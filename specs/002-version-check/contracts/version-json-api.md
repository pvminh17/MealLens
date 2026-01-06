# Contract: version.json API

**Feature**: App Version Check on Startup  
**Date**: 2026-01-06  
**Type**: Static JSON File (Public API)

## Overview

This contract defines the structure and behavior of the `version.json` file that the app fetches to determine if an update is available. This is a **static JSON file** hosted in the `public/` directory and served by the same CDN as the app.

---

## Endpoint

**URL**: `/version.json` (relative to app root)  
**Method**: `GET`  
**Authentication**: None (public endpoint)  
**Content-Type**: `application/json`

### Examples

- **Local Development**: `http://localhost:5173/version.json`
- **Production**: `https://meallens.app/version.json`

---

## Request

### Headers

No special headers required. Client SHOULD send:

```http
GET /version.json HTTP/1.1
Host: meallens.app
Accept: application/json
Cache-Control: no-cache
```

**Cache-Busting**: Client MAY add timestamp query parameter to avoid stale cache:

```http
GET /version.json?_t=1704542400000 HTTP/1.1
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `_t` | number | No | Unix timestamp (ms) for cache busting |

---

## Response

### Success Response (200 OK)

**Status Code**: `200 OK`  
**Content-Type**: `application/json`

**Body Schema**:

```json
{
  "version": "string (semver)",
  "releaseDate": "string (ISO 8601)",
  "minVersion": "string (semver, optional)",
  "updateUrl": "string (HTTPS URL)"
}
```

**Example**:

```json
{
  "version": "1.2.3",
  "releaseDate": "2026-01-06T12:00:00Z",
  "minVersion": "1.0.0",
  "updateUrl": "https://meallens.app/download"
}
```

### Field Definitions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `version` | string | Yes | Latest available app version | Must match semver format `^\d+\.\d+\.\d+` |
| `releaseDate` | string | Yes | ISO 8601 timestamp of when version was released | Valid ISO 8601 format |
| `minVersion` | string | No | Minimum supported version (for deprecation warnings) | Must match semver format if present |
| `updateUrl` | string | Yes | URL to app store or download page | Must start with `https://` |

### Error Responses

#### 404 Not Found

File doesn't exist (deployment issue).

```http
HTTP/1.1 404 Not Found
Content-Type: text/html
```

**Client Behavior**: Treat as network error, continue app startup silently.

#### 500 Internal Server Error

Server-side error.

```http
HTTP/1.1 500 Internal Server Error
```

**Client Behavior**: Treat as network error, continue app startup silently.

#### Network Timeout

No response within 5 seconds.

**Client Behavior**: Abort request, continue app startup silently.

---

## Client Requirements

### Timeout

Client MUST implement a 5-second timeout for the fetch request:

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('/version.json?_t=' + Date.now(), {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  // Process response...
} catch (error) {
  if (error.name === 'AbortError') {
    console.warn('Version check timed out');
  }
  // Continue silently...
}
```

### Validation

Client MUST validate response structure before using:

```javascript
function isValidVersionResponse(data) {
  return (
    typeof data === 'object' &&
    typeof data.version === 'string' &&
    /^\d+\.\d+\.\d+/.test(data.version) &&
    typeof data.updateUrl === 'string' &&
    data.updateUrl.startsWith('https://')
  );
}
```

### Error Handling

Client MUST handle all errors gracefully:

1. **Network errors** → Log warning, continue app startup
2. **Timeout** → Log warning, continue app startup
3. **Invalid JSON** → Log warning, continue app startup
4. **Schema validation failure** → Log warning, continue app startup

**Critical**: Errors MUST NOT block app startup or display to users.

---

## Service Provider Requirements

### File Deployment

1. `version.json` MUST be deployed atomically with the app build
2. File MUST be accessible at app root (`/version.json`)
3. File MUST be served over HTTPS in production
4. File SHOULD have appropriate CORS headers (if needed)

### Update Workflow

When deploying a new version:

1. Update `version.json` with new version number
2. Update `releaseDate` to current timestamp
3. Update `updateUrl` if app store link changed
4. Deploy both app and `version.json` together (atomic deploy)

### Example Deployment

```bash
# 1. Update version.json
echo '{
  "version": "1.3.0",
  "releaseDate": "2026-01-15T10:00:00Z",
  "minVersion": "1.0.0",
  "updateUrl": "https://meallens.app/download"
}' > public/version.json

# 2. Build app
npm run build

# 3. Deploy (both app and version.json)
npm run deploy
```

---

## Cache Strategy

### Server-Side

```http
Cache-Control: public, max-age=60, must-revalidate
ETag: "v1.2.3"
```

- **max-age=60**: Cache for 1 minute (balance freshness vs. performance)
- **must-revalidate**: Force revalidation after expiry
- **ETag**: Enable conditional requests

### Client-Side

- Use cache-busting query parameter (`?_t=timestamp`) on version checks
- Don't cache response in-memory for more than 1 minute
- Clear cached response when app is closed/reopened

---

## Backward Compatibility

### Adding Fields

New optional fields MAY be added without breaking clients:

```json
{
  "version": "1.2.3",
  "releaseDate": "2026-01-06T12:00:00Z",
  "updateUrl": "https://meallens.app/download",
  "releaseNotes": "Bug fixes and improvements", // NEW (optional)
  "isCritical": false                           // NEW (optional)
}
```

Clients MUST ignore unknown fields.

### Removing/Renaming Fields

Required fields (`version`, `releaseDate`, `updateUrl`) MUST NOT be removed or renamed.

### Breaking Changes

If breaking changes are needed:

1. Version the API: `/version.v2.json`
2. Maintain both versions during transition
3. Update clients gradually

---

## Security Considerations

### HTTPS Required

- Production MUST serve over HTTPS (prevent MITM attacks)
- Development MAY use HTTP (localhost only)

### Content Validation

- Client MUST validate JSON structure (prevent code injection)
- Client MUST NOT use `eval()` or `Function()` with response data

### No Sensitive Data

- File contains only public information (version numbers, URLs)
- No secrets, tokens, or PII

---

## Testing

### Manual Testing

```bash
# Test endpoint accessibility
curl -i https://meallens.app/version.json

# Expected output:
# HTTP/1.1 200 OK
# Content-Type: application/json
# {
#   "version": "1.2.3",
#   "releaseDate": "2026-01-06T12:00:00Z",
#   "updateUrl": "https://meallens.app/download"
# }
```

### Automated Testing

```javascript
// Test valid response
test('version.json returns valid schema', async () => {
  const response = await fetch('/version.json');
  const data = await response.json();
  
  expect(data).toHaveProperty('version');
  expect(data).toHaveProperty('releaseDate');
  expect(data).toHaveProperty('updateUrl');
  expect(data.updateUrl).toMatch(/^https:\/\//);
});

// Test timeout handling
test('version check handles timeout', async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10); // Fast timeout
  
  await expect(
    fetch('/version.json', { signal: controller.signal })
  ).rejects.toThrow('AbortError');
});
```

---

## Versioning

**Current Version**: 1.0  
**Last Updated**: 2026-01-06

### Changelog

- **1.0** (2026-01-06): Initial version
  - Required fields: `version`, `releaseDate`, `updateUrl`
  - Optional fields: `minVersion`

---

## Examples

### Example 1: Basic Version Info

```json
{
  "version": "1.0.0",
  "releaseDate": "2026-01-01T00:00:00Z",
  "updateUrl": "https://meallens.app/download"
}
```

### Example 2: With Minimum Version

```json
{
  "version": "1.5.0",
  "releaseDate": "2026-02-01T12:00:00Z",
  "minVersion": "1.2.0",
  "updateUrl": "https://apps.apple.com/app/meallens/id123456"
}
```

### Example 3: Pre-release Version

```json
{
  "version": "2.0.0-beta.1",
  "releaseDate": "2026-03-01T09:00:00Z",
  "updateUrl": "https://meallens.app/beta"
}
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Endpoint** | `/version.json` (static file) |
| **Method** | GET |
| **Authentication** | None |
| **Timeout** | 5 seconds |
| **Error Handling** | Silent failure (app continues) |
| **Update Frequency** | Checked on every app cold start |
| **Cache TTL** | 1 minute |
| **Security** | HTTPS only (production), schema validation |
