# Contract: versionService

**Feature**: App Version Check on Startup  
**Date**: 2026-01-06  
**Type**: Internal Service Module

## Overview

The `versionService` module provides version checking functionality with throttling, notification state management, and error handling. This service is called from `App.jsx` on startup and integrates with IndexedDB for state persistence.

---

## Module Interface

### Exports

```javascript
// src/services/versionService.js

export {
  checkForUpdates,      // Main entry point: check version and return result
  getNotificationState, // Get current notification state
  dismissNotification,  // Mark notification as dismissed
  shouldShowNotification // Determine if notification should be shown
};
```

---

## Functions

### checkForUpdates()

**Purpose**: Main entry point for version checking. Fetches latest version, compares with current, and determines if notification should be shown.

**Signature**:
```javascript
async function checkForUpdates(): Promise<VersionCheckResult>
```

**Returns**:
```typescript
interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  checkedAt: number;        // Unix timestamp (ms)
  success: boolean;
  error?: string;
  shouldShowNotification?: boolean; // Added by this function
}
```

**Behavior**:

1. Check debounce (skip if checked < 1 minute ago)
2. Fetch `version.json` with 5-second timeout
3. Validate response schema
4. Compare versions using semver
5. Check notification state (24-hour throttle)
6. Update `lastCheckAt` in storage
7. Return result

**Example Usage**:

```javascript
import { checkForUpdates } from './services/versionService';

// In App.jsx
useEffect(() => {
  checkForUpdates()
    .then(result => {
      if (result.shouldShowNotification) {
        setShowUpdateBanner(true);
        setUpdateInfo({ version: result.latestVersion });
      }
    })
    .catch(err => {
      console.warn('Version check failed:', err);
      // App continues normally
    });
}, []);
```

**Error Handling**:
- Network errors → Return `{ success: false, error: 'Network error' }`
- Timeout → Return `{ success: false, error: 'Timeout after 5000ms' }`
- Invalid JSON → Return `{ success: false, error: 'Invalid response' }`
- All errors are **non-fatal** (app continues)

---

### getNotificationState()

**Purpose**: Retrieve current notification state from IndexedDB/localStorage.

**Signature**:
```javascript
async function getNotificationState(): Promise<NotificationState>
```

**Returns**:
```typescript
interface NotificationState {
  key: string;                // Always "app-version-state"
  lastDismissedAt?: number;   // Unix timestamp (ms)
  lastDismissedVersion?: string; // Semver string
  lastCheckAt?: number;       // Unix timestamp (ms)
}
```

**Behavior**:

1. Try to read from IndexedDB (`versionState` table)
2. If IndexedDB fails, fallback to localStorage
3. If no state exists, return default (empty state)

**Example**:

```javascript
const state = await getNotificationState();
// {
//   key: "app-version-state",
//   lastDismissedAt: 1704542400000,
//   lastDismissedVersion: "1.2.0",
//   lastCheckAt: 1704628800000
// }
```

**Error Handling**:
- IndexedDB error → Try localStorage fallback
- localStorage error → Return default empty state
- Never throws errors (always returns valid state)

---

### dismissNotification(version)

**Purpose**: Mark a version notification as dismissed, updating throttle state.

**Signature**:
```javascript
async function dismissNotification(version: string): Promise<void>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `version` | string | Yes | Semantic version that was dismissed |

**Behavior**:

1. Get current notification state
2. Update `lastDismissedAt` to current timestamp (UTC)
3. Update `lastDismissedVersion` to provided version
4. Save to IndexedDB (with localStorage fallback)

**Example**:

```javascript
// User clicks "Dismiss" on update banner
await dismissNotification('1.2.3');

// State is now:
// {
//   lastDismissedAt: Date.now(),
//   lastDismissedVersion: "1.2.3"
// }
```

**Error Handling**:
- Storage errors are logged but don't throw (silent failure)

---

### shouldShowNotification(latestVersion)

**Purpose**: Determine if update notification should be shown based on throttle rules.

**Signature**:
```javascript
async function shouldShowNotification(latestVersion: string): Promise<boolean>
```

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `latestVersion` | string | Yes | Latest available version from server |

**Returns**: `true` if notification should be shown, `false` otherwise

**Decision Logic**:

```javascript
// Pseudocode
if (no previous dismissal) return true;
if (latestVersion !== lastDismissedVersion) return true; // New version
if (hoursSinceDismissal >= 24) return true;
return false; // Throttled
```

**Example**:

```javascript
const canShow = await shouldShowNotification('1.2.3');

if (canShow) {
  // Show UpdateBanner component
} else {
  // Suppress notification (24-hour throttle)
}
```

---

## Internal Functions

### fetchVersionInfo()

**Purpose**: Fetch and validate version.json from server.

**Signature**:
```javascript
async function fetchVersionInfo(): Promise<VersionInfo>
```

**Behavior**:

1. Create AbortController for timeout
2. Fetch `/version.json?_t=${Date.now()}` (cache busting)
3. Parse JSON response
4. Validate schema
5. Return VersionInfo object

**Implementation**:

```javascript
async function fetchVersionInfo() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`/version.json?_t=${Date.now()}`, {
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
    throw error;
  }
}
```

---

### compareVersions(current, latest)

**Purpose**: Compare two semantic versions.

**Signature**:
```javascript
function compareVersions(current: string, latest: string): boolean
```

**Returns**: `true` if `latest > current`, `false` otherwise

**Implementation**: Uses `semver` library

```javascript
import semver from 'semver';

function compareVersions(current, latest) {
  return semver.gt(latest, current);
}
```

---

### validateVersionInfo(data)

**Purpose**: Validate version.json schema.

**Signature**:
```javascript
function validateVersionInfo(data: any): boolean
```

**Validation Rules**:

```javascript
function validateVersionInfo(data) {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'string') return false;
  if (!/^\d+\.\d+\.\d+/.test(data.version)) return false;
  if (typeof data.updateUrl !== 'string') return false;
  if (!data.updateUrl.startsWith('https://')) return false;
  return true;
}
```

---

## Dependencies

### External Libraries

```json
{
  "dependencies": {
    "semver": "^7.5.4"
  }
}
```

### Internal Modules

```javascript
import { db } from '../db'; // IndexedDB instance
```

---

## Configuration

### Constants

```javascript
// src/services/versionService.js

const CONFIG = {
  VERSION_JSON_URL: '/version.json',
  FETCH_TIMEOUT: 5000,           // 5 seconds
  DEBOUNCE_INTERVAL: 60000,      // 1 minute
  THROTTLE_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  STORAGE_KEY: 'app-version-state'
};
```

### Current App Version

```javascript
import packageJson from '../../package.json';

const CURRENT_VERSION = packageJson.version; // "1.0.0"
```

---

## Error Codes

| Code | Description | Handling |
|------|-------------|----------|
| `TIMEOUT` | Fetch timeout after 5s | Log warning, return failure result |
| `NETWORK_ERROR` | Network request failed | Log warning, return failure result |
| `INVALID_JSON` | Malformed JSON response | Log warning, return failure result |
| `SCHEMA_VALIDATION_FAILED` | Response doesn't match schema | Log warning, return failure result |
| `STORAGE_ERROR` | IndexedDB/localStorage error | Log warning, use fallback |

**All errors result in silent failure** - app continues normally.

---

## Storage Contract

### IndexedDB Schema

```javascript
// Table: versionState
{
  key: 'app-version-state',        // Primary key
  lastDismissedAt: 1704542400000,  // Unix timestamp (ms)
  lastDismissedVersion: '1.2.0',   // Semver string
  lastCheckAt: 1704628800000       // Unix timestamp (ms)
}
```

### localStorage Fallback

```javascript
// Key: 'meallens:version-state'
// Value: JSON string
{
  "lastDismissedAt": 1704542400000,
  "lastDismissedVersion": "1.2.0",
  "lastCheckAt": 1704628800000
}
```

---

## Testing Contract

### Unit Tests

Required test coverage:

```javascript
describe('versionService', () => {
  test('checkForUpdates returns update available', async () => {
    // Mock fetch to return newer version
    // Assert shouldShowNotification = true
  });

  test('checkForUpdates handles timeout', async () => {
    // Mock slow fetch (> 5s)
    // Assert success = false, error = 'Timeout'
  });

  test('shouldShowNotification respects 24h throttle', async () => {
    // Set lastDismissedAt to 23 hours ago
    // Assert returns false
  });

  test('shouldShowNotification resets for new version', async () => {
    // Set lastDismissedVersion to "1.2.0"
    // Check with latestVersion "1.3.0"
    // Assert returns true
  });

  test('dismissNotification updates state', async () => {
    // Call dismissNotification('1.2.3')
    // Assert state.lastDismissedVersion = "1.2.3"
    // Assert state.lastDismissedAt is recent
  });
});
```

### Integration Tests

```javascript
describe('versionService integration', () => {
  test('full version check flow', async () => {
    // 1. Mock version.json endpoint
    // 2. Call checkForUpdates()
    // 3. Verify notification state saved
    // 4. Call dismissNotification()
    // 5. Verify throttle applied
  });
});
```

---

## Performance Guarantees

| Metric | Target | Measurement |
|--------|--------|-------------|
| Fetch timeout | 5s max | AbortController enforced |
| Debounce check | < 10ms | In-memory timestamp check |
| Storage read | < 50ms | IndexedDB primary key lookup |
| Storage write | < 100ms | IndexedDB single row update |
| Total latency | < 3s (95th percentile) | Version check + storage |

---

## Security Considerations

### Input Validation

All external data (version.json) MUST be validated:

```javascript
// Never trust external data
const data = await response.json();
if (!validateVersionInfo(data)) {
  throw new Error('Invalid schema');
}
```

### No Code Execution

NEVER use `eval()` or `Function()` with version data:

```javascript
// ❌ FORBIDDEN
eval(data.version);
new Function(data.updateUrl)();

// ✅ SAFE
console.log(data.version);
window.location.href = data.updateUrl;
```

### HTTPS Only (Production)

```javascript
if (process.env.NODE_ENV === 'production' && !location.protocol.startsWith('https')) {
  throw new Error('HTTPS required in production');
}
```

---

## Changelog

- **1.0** (2026-01-06): Initial version
  - Core functions: checkForUpdates, getNotificationState, dismissNotification
  - 24-hour throttle logic
  - IndexedDB + localStorage fallback

---

## Summary

| Aspect | Details |
|--------|---------|
| **Entry Point** | `checkForUpdates()` |
| **Storage** | IndexedDB (Dexie) + localStorage fallback |
| **Timeout** | 5 seconds |
| **Throttle** | 24 hours |
| **Error Handling** | Silent failure (app continues) |
| **Dependencies** | semver, Dexie |
| **Test Coverage** | Unit + integration tests required |
