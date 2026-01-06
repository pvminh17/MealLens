# Implementation Plan: App Version Check on Startup

**Branch**: `002-version-check` | **Date**: 2026-01-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-version-check/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement automatic version checking on app startup that compares the current app version against a version.json file hosted on the same server/CDN. When a newer version is available (based on semantic versioning), display a non-intrusive banner at the top of the screen. The banner shows version information and, when clicked, opens a dialog with an "Update Now" button that directs users to the app store. Notifications are throttled to once per 24 hours to prevent user annoyance. The version check must run asynchronously without blocking app startup and gracefully handle offline scenarios.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript (ES6+) / React 18.2.0  
**Primary Dependencies**: React, Vite, IndexedDB (Dexie), Service Worker (PWA)  
**Storage**: IndexedDB for notification state (last dismissed timestamp, version), localStorage as fallback  
**Testing**: Vitest (unit), Playwright (integration/E2E)  
**Target Platform**: Web browsers (PWA - Progressive Web App, desktop and mobile)
**Project Type**: Web application (single-page React app)  
**Performance Goals**: Version check completes in <3s (95th percentile), <100ms app startup impact  
**Constraints**: Must work offline (graceful degradation), non-blocking async operation, <5s timeout  
**Scale/Scope**: Single-user PWA, lightweight feature (1-2 new components, 1 service module)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Use `.specify/memory/constitution.md` as the source of truth. Document pass/fail
for each gate and list any exceptions in **Complexity Tracking**.

Required gates (MealLens):

✅ **MVP slice is independently testable/deployable; upgrade path documented.**
- P1 (Automatic Update Notification) can be tested and deployed independently
- Upgrade path: Start with simple localStorage, migrate to IndexedDB if needed
- Feature can be toggled via feature flag if rollback required

✅ **Design stays simple; any new abstraction/infrastructure is justified.**
- Reuses existing patterns: service module (like aiService, storageService)
- No new infrastructure required (uses existing CDN for version.json)
- Single responsibility: version checking only, delegates update to OS/browser

✅ **Security/privacy: data classification done; sensitive fields listed; secrets handling defined; authz boundaries explicit.**
- Data classification: Internal (version numbers, timestamps - non-sensitive)
- No secrets required (public version.json endpoint)
- No PII collected or stored
- No authentication/authorization needed (public read-only data)

✅ **Scalability: data model supports indexes/migrations; interfaces are versioned or backward compatible; long-running work is async where needed.**
- Version check runs async (Promise-based, non-blocking)
- version.json schema can be extended (backward compatible)
- Notification state stored with simple key-value schema (easily migrated)
- Semantic versioning ensures future compatibility

✅ **Operability: structured logs for key events/errors; auditable security events; rollback plan included.**
- Structured logging: version check success/failure, version mismatch detected
- Error handling: network failures, malformed JSON, timeout scenarios
- Rollback: Remove notification banner component, disable version check call
- No security events (public data, no auth)

**Status**: ✅ ALL GATES PASSED - Ready for Phase 0

### Post-Phase 1 Re-check

After completing research, data model, and contracts, re-evaluating constitution compliance:

✅ **MVP slice** - STILL PASSING
- Data model is minimal (3 entities, <1KB storage)
- Components are simple (banner + dialog)
- Service is single-purpose (version checking only)
- Upgrade path clear: version.json schema is extensible

✅ **Simplicity** - STILL PASSING
- No new infrastructure added
- Reuses existing IndexedDB setup
- Single new dependency (semver - 23KB, industry standard)
- Clear module boundaries maintained

✅ **Security/privacy** - STILL PASSING
- All data validated before use (validateVersionInfo)
- No eval() or code execution with external data
- HTTPS enforced in production
- Input sanitization confirmed in contracts

✅ **Scalability** - STILL PASSING
- Async/await pattern throughout (non-blocking)
- IndexedDB schema versioned (v1 → v2 migration defined)
- version.json contract includes versioning strategy
- Debounce (1 min) prevents rapid re-checks

✅ **Operability** - STILL PASSING
- Structured error logging confirmed in service contract
- All errors are non-fatal (silent failure mode)
- Rollback steps documented in quickstart
- Performance metrics defined (3s check, 100ms startup impact)

**Final Status**: ✅ **ALL GATES PASSED** - Design maintains constitution compliance

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── common/
│   │   └── UpdateBanner.jsx        # NEW: Top banner notification component
│   └── settings/
│       └── UpdateDialog.jsx         # NEW: Update details dialog
├── services/
│   └── versionService.js            # NEW: Version check logic
├── models/
│   └── VersionInfo.ts               # NEW: Version data types
└── App.jsx                          # MODIFIED: Add UpdateBanner integration

tests/
├── unit/
│   └── versionService.test.js       # NEW: Version check unit tests
└── integration/
    └── VersionCheck.test.js         # NEW: End-to-end version check flow

public/
└── version.json                     # NEW: Version information file
```

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
