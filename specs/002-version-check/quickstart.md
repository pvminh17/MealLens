# Quickstart: App Version Check on Startup

**Feature**: App Version Check on Startup  
**Date**: 2026-01-06  
**Audience**: Developers implementing or testing this feature

## Purpose

This quickstart provides step-by-step instructions for developers to implement, test, and validate the version check feature. Follow these steps in order to ensure a smooth implementation.

---

## Prerequisites

- Node.js 18+ and npm installed
- MealLens repository cloned locally
- Development server running (`npm run dev`)
- Basic familiarity with React, Vite, and IndexedDB

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
# Install semver library for version comparison
npm install semver

# Install dev dependencies (if not already installed)
npm install --save-dev @vitest/ui
```

### Step 2: Update Database Schema

**File**: `src/db.js`

Add the `versionState` table to the Dexie schema:

```javascript
import Dexie from 'dexie';

const db = new Dexie('MealLensDB');

// Increment version number
db.version(2).stores({
  meals: '++id, date, type',
  settings: '&key',
  versionState: '&key, lastDismissedAt, lastCheckAt' // NEW
});

export { db };
```

### Step 3: Create Version Model

**File**: `src/models/VersionInfo.ts` (new file)

```typescript
export interface VersionInfo {
  version: string;
  releaseDate: string;
  minVersion?: string;
  updateUrl: string;
}

export interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  checkedAt: number;
  success: boolean;
  error?: string;
  shouldShowNotification?: boolean;
}

export interface NotificationState {
  key: string;
  lastDismissedAt?: number;
  lastDismissedVersion?: string;
  lastCheckAt?: number;
}
```

### Step 4: Implement Version Service

**File**: `src/services/versionService.js` (new file)

Create the service with all functions from the contract:

```javascript
import semver from 'semver';
import { db } from '../db';
import packageJson from '../../package.json';

const CONFIG = {
  VERSION_JSON_URL: '/version.json',
  FETCH_TIMEOUT: 5000,
  DEBOUNCE_INTERVAL: 60000,
  THROTTLE_WINDOW: 24 * 60 * 60 * 1000,
  STORAGE_KEY: 'app-version-state'
};

const CURRENT_VERSION = packageJson.version;

// Main entry point
export async function checkForUpdates() {
  try {
    // Debounce check
    const state = await getNotificationState();
    if (state.lastCheckAt && Date.now() - state.lastCheckAt < CONFIG.DEBOUNCE_INTERVAL) {
      return {
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        updateAvailable: false,
        checkedAt: state.lastCheckAt,
        success: true,
        shouldShowNotification: false
      };
    }

    // Fetch version info
    const versionInfo = await fetchVersionInfo();
    const updateAvailable = compareVersions(CURRENT_VERSION, versionInfo.version);
    const shouldShow = updateAvailable && await shouldShowNotification(versionInfo.version);

    // Update last check time
    await updateLastCheckTime();

    return {
      currentVersion: CURRENT_VERSION,
      latestVersion: versionInfo.version,
      updateAvailable,
      checkedAt: Date.now(),
      success: true,
      shouldShowNotification: shouldShow,
      updateUrl: versionInfo.updateUrl
    };
  } catch (error) {
    console.warn('Version check failed:', error.message);
    return {
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
      updateAvailable: false,
      checkedAt: Date.now(),
      success: false,
      error: error.message
    };
  }
}

// Fetch version.json with timeout
async function fetchVersionInfo() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

  try {
    const response = await fetch(`${CONFIG.VERSION_JSON_URL}?_t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!validateVersionInfo(data)) {
      throw new Error('Invalid version.json schema');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout after 5000ms');
    }
    throw error;
  }
}

// Validate version.json structure
function validateVersionInfo(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.version === 'string' &&
    /^\d+\.\d+\.\d+/.test(data.version) &&
    typeof data.updateUrl === 'string' &&
    data.updateUrl.startsWith('https://')
  );
}

// Compare versions using semver
function compareVersions(current, latest) {
  try {
    return semver.gt(latest, current);
  } catch {
    return false;
  }
}

// Get notification state from storage
export async function getNotificationState() {
  try {
    const state = await db.versionState.get(CONFIG.STORAGE_KEY);
    return state || { key: CONFIG.STORAGE_KEY };
  } catch {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`meallens:${CONFIG.STORAGE_KEY}`);
      return stored ? JSON.parse(stored) : { key: CONFIG.STORAGE_KEY };
    } catch {
      return { key: CONFIG.STORAGE_KEY };
    }
  }
}

// Check if notification should be shown
export async function shouldShowNotification(latestVersion) {
  const state = await getNotificationState();
  
  if (!state.lastDismissedAt) return true;
  if (state.lastDismissedVersion !== latestVersion) return true;
  
  const hoursSince = (Date.now() - state.lastDismissedAt) / (1000 * 60 * 60);
  return hoursSince >= 24;
}

// Dismiss notification
export async function dismissNotification(version) {
  const state = await getNotificationState();
  state.lastDismissedAt = Date.now();
  state.lastDismissedVersion = version;

  try {
    await db.versionState.put(state);
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(`meallens:${CONFIG.STORAGE_KEY}`, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save notification state:', error);
    }
  }
}

// Update last check time
async function updateLastCheckTime() {
  const state = await getNotificationState();
  state.lastCheckAt = Date.now();
  
  try {
    await db.versionState.put(state);
  } catch {
    try {
      localStorage.setItem(`meallens:${CONFIG.STORAGE_KEY}`, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to update check time:', error);
    }
  }
}
```

### Step 5: Create UpdateBanner Component

**File**: `src/components/common/UpdateBanner.jsx` (new file)

```jsx
import { useState } from 'react';
import { dismissNotification } from '../../services/versionService';

export function UpdateBanner({ version, onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = async () => {
    await dismissNotification(version);
    setIsVisible(false);
    onDismiss?.();
  };

  const handleClick = () => {
    // Will be handled by UpdateDialog
  };

  if (!isVisible) return null;

  return (
    <div className="update-banner" onClick={handleClick}>
      <div className="update-banner-content">
        <span className="update-icon">🔔</span>
        <span className="update-text">
          New version {version} available! Tap to update.
        </span>
        <button
          className="update-dismiss"
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
```

### Step 6: Create UpdateDialog Component

**File**: `src/components/settings/UpdateDialog.jsx` (new file)

```jsx
export function UpdateDialog({ version, updateUrl, onClose }) {
  const handleUpdate = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isStandalone && isIOS) {
      window.location.href = 'https://apps.apple.com/app/meallens/id123456';
    } else if (isStandalone && isAndroid) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.meallens';
    } else {
      window.location.href = updateUrl;
    }
    
    onClose();
  };

  return (
    <div className="update-dialog-overlay" onClick={onClose}>
      <div className="update-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Update Available</h2>
        <p>Version {version} is now available.</p>
        <p>Update now to get the latest features and improvements.</p>
        <div className="update-dialog-actions">
          <button onClick={onClose} className="button-secondary">
            Later
          </button>
          <button onClick={handleUpdate} className="button-primary">
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Step 7: Integrate in App.jsx

**File**: `src/App.jsx` (modify)

```jsx
import { useEffect, useState } from 'react';
import { checkForUpdates } from './services/versionService';
import { UpdateBanner } from './components/common/UpdateBanner';
import { UpdateDialog } from './components/settings/UpdateDialog';

function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    // Fire and forget - don't block startup
    checkForUpdates()
      .then(result => {
        if (result.shouldShowNotification) {
          setUpdateInfo({
            version: result.latestVersion,
            updateUrl: result.updateUrl
          });
        }
      })
      .catch(err => {
        console.warn('Version check failed:', err);
      });
  }, []);

  return (
    <div className="app">
      {updateInfo && (
        <UpdateBanner
          version={updateInfo.version}
          onDismiss={() => setUpdateInfo(null)}
          onClick={() => setShowDialog(true)}
        />
      )}
      
      {showDialog && (
        <UpdateDialog
          version={updateInfo.version}
          updateUrl={updateInfo.updateUrl}
          onClose={() => setShowDialog(false)}
        />
      )}
      
      {/* Rest of app */}
    </div>
  );
}
```

### Step 8: Create version.json

**File**: `public/version.json` (new file)

```json
{
  "version": "1.0.0",
  "releaseDate": "2026-01-06T00:00:00Z",
  "updateUrl": "https://meallens.app/download"
}
```

### Step 9: Add Styles

**File**: `src/index.css` (add)

```css
/* Update Banner */
.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  cursor: pointer;
  animation: slideDown 0.3s ease-out;
}

.update-banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
}

.update-icon {
  font-size: 20px;
}

.update-text {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
}

.update-dismiss {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.update-dismiss:hover {
  opacity: 1;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

/* Update Dialog */
.update-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.update-dialog {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.update-dialog h2 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #1a1a1a;
}

.update-dialog p {
  margin: 0 0 12px 0;
  color: #666;
  line-height: 1.5;
}

.update-dialog-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.button-primary,
.button-secondary {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.button-secondary {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
}

.button-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.button-secondary:hover {
  border-color: #ccc;
}
```

---

## Testing

### Manual Testing

1. **Test Update Available**:
   ```bash
   # Update version.json to newer version
   echo '{"version":"1.1.0","releaseDate":"2026-01-06T12:00:00Z","updateUrl":"https://example.com"}' > public/version.json
   
   # Restart app
   npm run dev
   
   # Expected: Update banner appears at top
   ```

2. **Test Dismiss & Throttle**:
   - Click dismiss button
   - Refresh page immediately
   - Expected: No banner (throttled for 24 hours)

3. **Test Offline**:
   - Open DevTools → Network → Offline
   - Refresh page
   - Expected: App loads normally, no errors

### Automated Testing

**File**: `tests/unit/versionService.test.js` (new file)

```javascript
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { checkForUpdates, shouldShowNotification, dismissNotification } from '../../src/services/versionService';

describe('versionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('checkForUpdates detects newer version', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        version: '2.0.0',
        releaseDate: '2026-01-06T12:00:00Z',
        updateUrl: 'https://example.com'
      })
    });

    const result = await checkForUpdates();
    
    expect(result.success).toBe(true);
    expect(result.updateAvailable).toBe(true);
    expect(result.latestVersion).toBe('2.0.0');
  });

  test('shouldShowNotification respects 24h throttle', async () => {
    // Set state to 23 hours ago
    await dismissNotification('1.0.0');
    const state = await getNotificationState();
    state.lastDismissedAt = Date.now() - 23 * 60 * 60 * 1000;
    await db.versionState.put(state);

    const canShow = await shouldShowNotification('1.0.0');
    expect(canShow).toBe(false);
  });
});
```

Run tests:
```bash
npm test
```

---

## Validation Checklist

- [ ] `semver` package installed
- [ ] Database schema updated (version 2)
- [ ] VersionInfo.ts model created
- [ ] versionService.js implemented
- [ ] UpdateBanner component created
- [ ] UpdateDialog component created
- [ ] App.jsx integrated
- [ ] public/version.json exists
- [ ] Styles added to index.css
- [ ] Unit tests pass
- [ ] Manual test: Update banner shows
- [ ] Manual test: Dismiss works
- [ ] Manual test: Offline graceful
- [ ] Manual test: Dialog opens on click

---

## Troubleshooting

### Banner doesn't appear

1. Check version.json exists: `curl http://localhost:5173/version.json`
2. Check version.json version > package.json version
3. Check browser console for errors
4. Clear IndexedDB: DevTools → Application → IndexedDB → Delete

### Throttle not working

1. Check notification state: `await db.versionState.toArray()`
2. Verify timestamps are in UTC
3. Clear state and retry: `await db.versionState.clear()`

### Network timeout

1. Check FETCH_TIMEOUT constant (default 5s)
2. Verify version.json is served (not 404)
3. Check network tab in DevTools

---

## Next Steps

After implementation:
1. Run `/speckit.tasks` to generate detailed task breakdown
2. Complete unit tests for all service functions
3. Add integration tests (Playwright)
4. Update deployment workflow to generate version.json automatically

---

## Summary

| Step | Status | Time Estimate |
|------|--------|---------------|
| Install dependencies | ⬜ | 5 min |
| Update database | ⬜ | 10 min |
| Create models | ⬜ | 10 min |
| Implement service | ⬜ | 45 min |
| Create components | ⬜ | 30 min |
| Integrate App.jsx | ⬜ | 15 min |
| Add styles | ⬜ | 15 min |
| Create version.json | ⬜ | 5 min |
| Test manually | ⬜ | 20 min |
| Write unit tests | ⬜ | 30 min |

**Total Estimate**: ~3 hours for MVP implementation
