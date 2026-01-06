# Data Model: App Version Check on Startup

**Feature**: App Version Check on Startup  
**Date**: 2026-01-06  
**Status**: Phase 1 Design

## Overview

This document defines the data structures and state management for version checking functionality. All entities are designed to be lightweight, serializable, and compatible with IndexedDB storage.

---

## Entities

### 1. VersionInfo

Represents the version metadata retrieved from version.json and the current app version.

**Attributes**:

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `version` | string | Yes | Semantic version number (e.g., "1.2.3") | Valid semver format |
| `releaseDate` | string | Yes | ISO 8601 timestamp of release | ISO 8601 format |
| `minVersion` | string | No | Minimum supported version (for deprecation) | Valid semver format |
| `updateUrl` | string | Yes | URL to update page or app store | Valid HTTPS URL |

**Example**:
```json
{
  "version": "1.2.3",
  "releaseDate": "2026-01-06T12:00:00Z",
  "minVersion": "1.0.0",
  "updateUrl": "https://meallens.app/download"
}
```

**TypeScript Definition**:
```typescript
interface VersionInfo {
  version: string;
  releaseDate: string;
  minVersion?: string;
  updateUrl: string;
}
```

**Validation Rules**:
- `version` must match semver regex: `/^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/`
- `releaseDate` must be valid ISO 8601 timestamp
- `updateUrl` must start with `https://`

---

### 2. VersionCheckResult

Represents the outcome of a version check operation, including success/failure status and comparison result.

**Attributes**:

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `currentVersion` | string | Yes | Current app version | Valid semver |
| `latestVersion` | string | Yes | Latest available version from server | Valid semver |
| `updateAvailable` | boolean | Yes | Whether an update is available | Computed from version comparison |
| `checkedAt` | number | Yes | Unix timestamp (ms) of check | Positive integer |
| `success` | boolean | Yes | Whether check succeeded | true = success, false = error |
| `error` | string | No | Error message if check failed | Present only when success=false |

**Example (Success)**:
```json
{
  "currentVersion": "1.2.0",
  "latestVersion": "1.2.3",
  "updateAvailable": true,
  "checkedAt": 1704542400000,
  "success": true
}
```

**Example (Failure)**:
```json
{
  "currentVersion": "1.2.0",
  "latestVersion": "1.2.0",
  "updateAvailable": false,
  "checkedAt": 1704542400000,
  "success": false,
  "error": "Network timeout after 5000ms"
}
```

**TypeScript Definition**:
```typescript
interface VersionCheckResult {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  checkedAt: number;
  success: boolean;
  error?: string;
}
```

---

### 3. NotificationState

Tracks notification throttling to enforce "once per 24 hours" rule.

**Attributes**:

| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `key` | string | Yes | Storage key (always "app-version-state") | Primary key |
| `lastDismissedAt` | number | No | Unix timestamp (ms) when user dismissed notification | Positive integer or null |
| `lastDismissedVersion` | string | No | Version number that was dismissed | Valid semver or null |
| `lastCheckAt` | number | No | Unix timestamp (ms) of last check | Positive integer or null |

**Example**:
```json
{
  "key": "app-version-state",
  "lastDismissedAt": 1704542400000,
  "lastDismissedVersion": "1.2.3",
  "lastCheckAt": 1704628800000
}
```

**TypeScript Definition**:
```typescript
interface NotificationState {
  key: string; // Always "app-version-state"
  lastDismissedAt?: number;
  lastDismissedVersion?: string;
  lastCheckAt?: number;
}
```

**Business Rules**:
1. If `lastDismissedAt` is null → always show notification (first time)
2. If `lastDismissedVersion` ≠ `latestVersion` → reset throttle, show notification
3. If (current time - `lastDismissedAt`) < 24 hours → suppress notification
4. If (current time - `lastDismissedAt`) ≥ 24 hours → show notification

---

## State Transitions

### Version Check Flow

```
[App Startup]
     |
     v
[Check lastCheckAt]
     |
     +---> [< 1 minute ago] ---> [Skip check (debounce)]
     |
     +---> [> 1 minute ago or null] ---> [Fetch version.json]
                                              |
                                              +---> [Success] ---> [Compare versions]
                                              |                         |
                                              |                         v
                                              |                   [Update > Current?]
                                              |                         |
                                              |                         +---> [Yes] ---> [Check NotificationState]
                                              |                         |                      |
                                              |                         |                      v
                                              |                         |                [Can show?] ---> [Yes] ---> [Show banner]
                                              |                         |                      |
                                              |                         |                      +---> [No] ---> [Silent]
                                              |                         |
                                              |                         +---> [No] ---> [Silent (up to date)]
                                              |
                                              +---> [Error] ---> [Log error, continue silently]
```

### Notification Interaction Flow

```
[Banner Shown]
     |
     +---> [User clicks banner] ---> [Show UpdateDialog]
     |                                     |
     |                                     v
     |                               [User clicks "Update Now"] ---> [Open app store URL]
     |                                     |
     |                                     v
     |                               [Close dialog]
     |
     +---> [User clicks dismiss] ---> [Update NotificationState]
                                            |
                                            v
                                      [Set lastDismissedAt = now]
                                      [Set lastDismissedVersion = latestVersion]
                                            |
                                            v
                                      [Hide banner]
```

---

## Storage Schema

### IndexedDB (Dexie)

**Table**: `versionState`

```javascript
// In src/db.js
const db = new Dexie('MealLensDB');
db.version(2).stores({
  // Existing tables
  meals: '++id, date, type',
  settings: '&key',
  
  // NEW: Version state table
  versionState: '&key, lastDismissedAt, lastCheckAt'
});
```

**Key**: Primary key is `key` field (always `"app-version-state"`)

**Indexes**:
- Primary: `key` (unique)
- Secondary: `lastDismissedAt` (for time-based queries)
- Secondary: `lastCheckAt` (for debounce logic)

### localStorage Fallback

If IndexedDB fails or is unavailable:

```javascript
// Key: 'meallens:version-state'
// Value: JSON string of NotificationState
const state = JSON.parse(localStorage.getItem('meallens:version-state') || '{}');
```

---

## Data Validation

### Version String Validation

```javascript
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

function isValidSemver(version) {
  return typeof version === 'string' && SEMVER_REGEX.test(version);
}
```

### VersionInfo Validation

```javascript
function validateVersionInfo(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('VersionInfo must be an object');
  }
  
  if (!isValidSemver(data.version)) {
    throw new Error(`Invalid version: ${data.version}`);
  }
  
  if (!data.updateUrl || !data.updateUrl.startsWith('https://')) {
    throw new Error('updateUrl must be a valid HTTPS URL');
  }
  
  if (data.releaseDate && !isValidISODate(data.releaseDate)) {
    throw new Error(`Invalid releaseDate: ${data.releaseDate}`);
  }
  
  return true;
}
```

---

## Migration Strategy

### Version 1 → Version 2 (Current)

**Change**: Add `versionState` table to existing Dexie schema

**Migration Code**:
```javascript
// In src/db.js
db.version(2).stores({
  meals: '++id, date, type',
  settings: '&key',
  versionState: '&key, lastDismissedAt, lastCheckAt' // NEW
}).upgrade(tx => {
  // No data migration needed - new table starts empty
  return tx.versionState.add({
    key: 'app-version-state',
    lastDismissedAt: null,
    lastDismissedVersion: null,
    lastCheckAt: null
  });
});
```

**Rollback Plan**: If rollback to v1, `versionState` table is simply ignored (no data loss)

---

## Performance Considerations

### Data Size

- **VersionInfo**: ~200 bytes per fetch (negligible)
- **NotificationState**: ~150 bytes in storage (single row)
- **Total Storage Impact**: < 1 KB

### Access Patterns

- **Read Frequency**: Once per app startup (cold start only)
- **Write Frequency**: Twice per user interaction (dismiss notification + check completion)
- **Index Usage**: Primary key lookups only (O(1) performance)

### Caching Strategy

- **version.json**: Client-side cache for 1 minute (prevent rapid re-checks)
- **NotificationState**: Keep in-memory after first read (reduce IndexedDB hits)

---

## Security & Privacy

### Data Classification

All data is **Internal** (non-sensitive):
- Version numbers: Public information
- Timestamps: No PII, only relative time checks
- URLs: Public app store links

### Privacy Compliance

- **No PII**: No personal data collected or stored
- **No Tracking**: No analytics or telemetry
- **Local Only**: All state stored locally, never transmitted

### Integrity

- **Input Validation**: All external data (version.json) validated before use
- **Type Safety**: TypeScript interfaces enforce schema compliance
- **Error Handling**: Malformed data triggers fallback (no app crash)

---

## Future Extensibility

### Possible Enhancements

1. **Release Notes**: Add `releaseNotes` field to VersionInfo
2. **Critical Updates**: Add `isCritical` boolean to force immediate update
3. **Update History**: Track all dismissed versions (array in NotificationState)
4. **Conditional Updates**: Add `platforms` array for platform-specific versions

### Backward Compatibility

- All new fields must be **optional** (default values)
- Existing fields cannot be renamed or removed
- Schema version tracked in `db.version()` for migrations

---

## Summary

| Entity | Purpose | Storage | Size |
|--------|---------|---------|------|
| VersionInfo | External version metadata | Fetched from server | ~200 bytes |
| VersionCheckResult | Check operation result | In-memory only | ~300 bytes |
| NotificationState | Throttle state | IndexedDB + localStorage | ~150 bytes |

**Total Storage Impact**: < 1 KB  
**Performance Impact**: Negligible (single fetch, single DB write per startup)  
**Security Risk**: None (public data, validated inputs, local storage only)
