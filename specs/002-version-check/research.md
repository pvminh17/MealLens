# Research: App Version Check on Startup

**Feature**: App Version Check on Startup  
**Date**: 2026-01-06  
**Researcher**: GitHub Copilot

## Purpose

This research document resolves technical unknowns and documents best practices for implementing automatic version checking in a React PWA. All decisions are informed by the MealLens tech stack (React 18, Vite, IndexedDB, PWA) and constitution principles (MVP-first, simple, secure by default).

---

## Research Areas

### 1. Version Storage and Retrieval

**Question**: How should version.json be structured and hosted for optimal performance and reliability?

**Decision**: Static JSON file in public/ directory served by same CDN as app

**Rationale**:
- **Simplicity**: No additional infrastructure needed; Vite automatically serves public/ files
- **Performance**: Same CDN origin = no CORS issues, leverages existing cache headers
- **Reliability**: Version file deployed atomically with app (same build/deploy process)
- **Cost**: Zero additional hosting cost

**Structure**:
```json
{
  "version": "1.2.3",
  "releaseDate": "2026-01-06T12:00:00Z",
  "minVersion": "1.0.0",
  "updateUrl": "https://example.com/app-store-or-download"
}
```

**Alternatives Considered**:
- ❌ Separate API endpoint: Adds infrastructure complexity, violates simplicity principle
- ❌ GitHub Releases API: External dependency, rate limiting, requires internet for development
- ❌ npm registry: Only relevant for npm packages, not end-user apps

---

### 2. Semantic Versioning Comparison

**Question**: What's the most reliable way to compare semantic versions in JavaScript?

**Decision**: Use `semver` npm package (industry standard, 50M+ weekly downloads)

**Rationale**:
- **Reliability**: Battle-tested library, handles all edge cases (pre-release, build metadata)
- **Size**: 23KB minified (acceptable for feature value)
- **Standards Compliance**: Follows semver.org specification exactly
- **Maintenance**: Actively maintained, part of npm ecosystem

**Usage Pattern**:
```javascript
import semver from 'semver';

const isUpdateAvailable = (current, latest) => {
  return semver.gt(latest, current); // true if latest > current
};
```

**Alternatives Considered**:
- ❌ Manual string parsing: Error-prone, doesn't handle pre-release/metadata
- ❌ Simple string comparison: Fails for multi-digit versions (e.g., "1.10.0" < "1.9.0" lexicographically)
- ✅ Custom lightweight parser: Could work but not worth the maintenance burden for 23KB

---

### 3. Notification State Persistence

**Question**: Where should we store notification throttle state (last dismissed timestamp)?

**Decision**: IndexedDB (Dexie) with localStorage fallback

**Rationale**:
- **Consistency**: Reuses existing Dexie setup in MealLens (db.js already configured)
- **Reliability**: IndexedDB persists across browser sessions, survives cache clears
- **Capacity**: No storage limits for small metadata (timestamps, version strings)
- **Fallback**: localStorage ensures compatibility with older browsers

**Schema**:
```javascript
// In db.js - add new table
versionState: '&key, lastDismissedAt, lastDismissedVersion, lastCheckAt'
```

**Key**: `'app-version-state'` (single row)

**Alternatives Considered**:
- ❌ Cookies: Size limits (4KB), sent with every request (performance impact)
- ❌ sessionStorage: Lost on browser close (defeats 24-hour throttle)
- ✅ localStorage only: Simpler but less consistent with app architecture

---

### 4. Asynchronous Version Check Strategy

**Question**: How should version check integrate with app startup without blocking?

**Decision**: Fire-and-forget async call in App.jsx componentDidMount/useEffect with timeout

**Rationale**:
- **Non-blocking**: Version check runs in parallel with app initialization
- **Timeout**: 5-second timeout prevents indefinite hanging
- **Error Handling**: Network failures don't prevent app startup
- **User Experience**: App becomes interactive immediately

**Implementation Pattern**:
```javascript
useEffect(() => {
  // Fire and forget - don't await
  versionService.checkForUpdates().catch(err => {
    console.warn('Version check failed:', err);
    // Silent failure - app continues normally
  });
}, []); // Run once on mount
```

**Alternatives Considered**:
- ❌ Blocking await: Delays app startup, violates FR-007
- ❌ Service Worker: More complex, requires SW update for changes
- ❌ Interval polling: Unnecessary for "check on open" requirement

---

### 5. App Store Redirect Handling

**Question**: How to open app store/update URL cross-platform (iOS, Android, Desktop)?

**Decision**: Use window.location.href with conditional logic for PWA context

**Rationale**:
- **PWA Detection**: Check if app is in standalone mode (installed PWA)
- **Platform Detection**: Use navigator.userAgent for iOS/Android distinction
- **Fallback**: Generic update URL if platform-specific store unavailable

**Implementation**:
```javascript
const openUpdatePage = (updateUrl) => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isStandalone && isIOS) {
    window.location.href = 'https://apps.apple.com/app/meallens/id123456';
  } else if (isStandalone && isAndroid) {
    window.location.href = 'https://play.google.com/store/apps/details?id=com.meallens';
  } else {
    window.location.href = updateUrl; // Web version update
  }
};
```

**Alternatives Considered**:
- ❌ Deep linking: Requires native app wrapper (not pure PWA)
- ❌ Browser-specific APIs: Limited support, inconsistent behavior

---

### 6. 24-Hour Throttle Implementation

**Question**: How to reliably enforce "once per 24 hours" notification limit?

**Decision**: Store timestamp in UTC, compare with current time on each check

**Rationale**:
- **Time Zone Safety**: UTC avoids DST and time zone change issues
- **Simplicity**: Single timestamp comparison (no complex date math)
- **Version Reset**: New version resets throttle (different from dismissed version)

**Logic**:
```javascript
const canShowNotification = (state, latestVersion) => {
  if (!state.lastDismissedAt) return true;
  if (state.lastDismissedVersion !== latestVersion) return true; // New version
  
  const hoursSinceDismissal = (Date.now() - state.lastDismissedAt) / (1000 * 60 * 60);
  return hoursSinceDismissal >= 24;
};
```

**Alternatives Considered**:
- ❌ Date-based (ignore time): Could show twice in one day (11 PM and 1 AM)
- ❌ Local time: Breaks with time zone changes or DST transitions

---

## Best Practices Applied

### React PWA Version Checking
- **Progressive Enhancement**: Feature degrades gracefully if network unavailable
- **Service Worker Independence**: Version check doesn't rely on SW (simpler, easier to update)
- **Cache Busting**: Add timestamp query param to version.json fetch to avoid stale cache
- **Error Boundaries**: Wrap UpdateBanner in ErrorBoundary to prevent app crashes

### Performance Optimization
- **Lazy Loading**: Load semver library only when needed (dynamic import)
- **Debouncing**: Don't check version if app reopened within 1 minute (prevents spam)
- **Request Caching**: Cache version.json response for 1 minute to handle rapid app restarts

### Security Considerations
- **HTTPS Only**: version.json must be served over HTTPS (prevent MITM)
- **Integrity Check**: Validate JSON structure before parsing (prevent code injection)
- **No Eval**: Never use eval() or Function() with version data

---

## Technology Choices Summary

| Component | Technology | Justification |
|-----------|------------|---------------|
| Version Comparison | semver npm package | Industry standard, handles edge cases |
| State Storage | IndexedDB (Dexie) + localStorage fallback | Consistent with app, reliable persistence |
| Network Request | fetch() with AbortController | Native, supports timeout/cancellation |
| UI Components | React functional components + hooks | Consistent with existing codebase |
| Styling | Existing CSS approach (index.css) | Minimal bundle impact, reuses patterns |
| Testing | Vitest + Playwright | Matches existing test infrastructure |

---

## Implementation Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stale version.json cache | Medium | Low | Add cache-busting query param |
| IndexedDB quota exceeded | Low | Low | Fallback to localStorage |
| Network timeout delays startup | Low | Medium | 5s timeout + fire-and-forget |
| Malformed version.json | Low | Medium | Schema validation + try-catch |
| Time zone changes break throttle | Low | Low | Use UTC timestamps |

---

## Open Questions (None Remaining)

All technical unknowns from the spec have been resolved:
- ✅ Version source: version.json in public/
- ✅ Comparison method: semver library
- ✅ Storage location: IndexedDB with localStorage fallback
- ✅ Async strategy: useEffect with timeout
- ✅ Platform handling: Conditional redirect logic
- ✅ Throttle implementation: UTC timestamp comparison

---

## References

- [Semantic Versioning Spec](https://semver.org/)
- [semver npm package](https://www.npmjs.com/package/semver)
- [PWA Display Modes](https://web.dev/learn/pwa/app-design/#display-modes)
- [IndexedDB Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [AbortController for Fetch Timeout](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
