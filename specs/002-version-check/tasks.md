# Tasks: App Version Check on Startup

**Input**: Design documents from `/specs/002-version-check/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are NOT included per feature spec - this is a lightweight MVP feature that can be validated through manual testing. If tests are needed later, they can be added incrementally.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependencies

- [X] T001 Install semver package via npm install semver
- [X] T002 [P] Update package.json version to match current app version (verify 1.0.0)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Update IndexedDB schema in src/db.js - increment version to 2
- [X] T004 Add versionState table to Dexie schema with fields: &key, lastDismissedAt, lastCheckAt
- [X] T005 [P] Create VersionInfo TypeScript interface in src/models/VersionInfo.ts
- [X] T006 [P] Create VersionCheckResult TypeScript interface in src/models/VersionInfo.ts
- [X] T007 [P] Create NotificationState TypeScript interface in src/models/VersionInfo.ts
- [X] T008 Create public/version.json with current version (1.0.0), releaseDate, and updateUrl

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Automatic Update Notification (Priority: P1) 🎯 MVP

**Goal**: Display update notification when newer version available, allow dismissal, respect 24-hour throttle

**Independent Test**: Update public/version.json to 1.1.0, restart app, verify banner appears, dismiss it, restart within 24h to verify throttle

### Implementation for User Story 1

- [X] T009 [P] [US1] Create versionService.js in src/services/ - add CONFIG constants
- [X] T010 [P] [US1] Implement fetchVersionInfo() function in src/services/versionService.js with 5s timeout using AbortController
- [X] T011 [P] [US1] Implement validateVersionInfo() function in src/services/versionService.js
- [X] T012 [P] [US1] Implement compareVersions() function in src/services/versionService.js using semver.gt()
- [X] T013 [US1] Implement getNotificationState() function in src/services/versionService.js with IndexedDB + localStorage fallback
- [X] T014 [US1] Implement shouldShowNotification() function in src/services/versionService.js with 24-hour throttle logic
- [X] T015 [US1] Implement dismissNotification() function in src/services/versionService.js
- [X] T016 [US1] Implement updateLastCheckTime() helper function in src/services/versionService.js
- [X] T017 [US1] Implement checkForUpdates() main entry point function in src/services/versionService.js (depends on T010-T016)
- [X] T018 [P] [US1] Create UpdateBanner component in src/components/common/UpdateBanner.jsx
- [X] T019 [P] [US1] Add UpdateBanner styles to src/index.css (banner styling with gradient, slide-down animation)
- [X] T020 [P] [US1] Create UpdateDialog component in src/components/settings/UpdateDialog.jsx
- [X] T021 [P] [US1] Add UpdateDialog styles to src/index.css (overlay, modal dialog, button styles)
- [X] T022 [US1] Add platform detection logic to UpdateDialog for iOS/Android/Web app store redirects
- [X] T023 [US1] Integrate version check in src/App.jsx - add useEffect hook to call checkForUpdates() on mount
- [X] T024 [US1] Add UpdateBanner conditional rendering in src/App.jsx based on update availability
- [X] T025 [US1] Add UpdateDialog conditional rendering in src/App.jsx with show/hide state management
- [X] T026 [US1] Wire up UpdateBanner click handler to show UpdateDialog
- [X] T027 [US1] Wire up UpdateBanner dismiss handler to call dismissNotification()

**Acceptance Validation for User Story 1**:
- ✅ Banner appears when public/version.json has newer version
- ✅ Banner shows correct version number
- ✅ Clicking banner opens dialog with "Update Now" button
- ✅ "Update Now" opens appropriate app store/URL
- ✅ Dismissing banner hides it and prevents re-showing for 24 hours
- ✅ New version (different from dismissed) shows banner immediately
- ✅ Banner appears again after 24+ hours if update still available

---

## Phase 4: User Story 2 - Offline Graceful Degradation (Priority: P2)

**Goal**: App loads successfully when offline without errors or blocking

**Independent Test**: Enable airplane mode, launch app, verify it loads normally without error messages

### Implementation for User Story 2

- [ ] T028 [US2] Add try-catch error handling to checkForUpdates() in src/services/versionService.js
- [ ] T029 [US2] Ensure fetchVersionInfo() timeout error returns graceful failure result
- [ ] T030 [US2] Add console.warn() logging for version check failures (not console.error to avoid alarming users)
- [ ] T031 [US2] Verify App.jsx catch block handles checkForUpdates() rejection silently
- [ ] T032 [US2] Test with DevTools Network → Offline mode to ensure no error dialogs appear

**Acceptance Validation for User Story 2**:
- ✅ App loads successfully in airplane mode
- ✅ No error messages displayed to user
- ✅ App functionality remains fully accessible
- ✅ Version check timeout logged as warning (not error)

---

## Phase 5: User Story 3 - Version Check Performance (Priority: P3)

**Goal**: Version check runs in background without blocking app startup

**Independent Test**: Measure app startup time with/without version check, verify <100ms impact

### Implementation for User Story 3

- [ ] T033 [US3] Add 1-minute debounce check in checkForUpdates() to prevent rapid re-checks
- [ ] T034 [US3] Ensure checkForUpdates() is fire-and-forget (not await) in App.jsx useEffect
- [ ] T035 [US3] Verify AbortController timeout is exactly 5 seconds
- [ ] T036 [US3] Add performance.mark() calls around version check (optional, for debugging)
- [ ] T037 [US3] Test app interaction during version check to ensure no blocking

**Acceptance Validation for User Story 3**:
- ✅ App UI becomes interactive within 1 second of load
- ✅ User can interact with app while version check runs
- ✅ Version check completes within 3 seconds (95th percentile)
- ✅ App startup time impact < 100ms

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements and deployment preparation

- [ ] T038 Add cache-busting query parameter (?_t=timestamp) to version.json fetch
- [ ] T039 [P] Add ErrorBoundary wrapper around UpdateBanner in App.jsx
- [ ] T040 [P] Verify ARIA labels on dismiss button for accessibility
- [ ] T041 Document version.json update process in deployment workflow
- [ ] T042 Add comment in public/version.json explaining update process
- [ ] T043 Verify version numbers follow semantic versioning format
- [ ] T044 Test with multiple rapid app restarts (debounce validation)
- [ ] T045 Test time zone changes don't break 24-hour throttle (UTC timestamps)

---

## Dependencies

### User Story Completion Order

```
Phase 1: Setup
  ↓
Phase 2: Foundational
  ↓
Phase 3: User Story 1 (P1) ← MVP - Can deploy after this
  ↓
Phase 4: User Story 2 (P2) ← Enhances offline reliability
  ↓
Phase 5: User Story 3 (P3) ← Performance optimization
  ↓
Phase 6: Polish
```

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only)

**Critical Path**:
1. T001-T008 (Setup + Foundation) - **Must complete first**
2. T009-T017 (versionService) - **Blocking for UI components**
3. T018-T027 (UI + Integration) - **Can parallelize components**

### Parallel Execution Opportunities

**Within User Story 1**:
- **Parallel Group A** (after T009-T017 complete):
  - T018 (UpdateBanner component)
  - T019 (UpdateBanner styles)
  - T020 (UpdateDialog component)
  - T021 (UpdateDialog styles)

- **Parallel Group B** (foundational tasks):
  - T002 (package.json)
  - T005 (VersionInfo interface)
  - T006 (VersionCheckResult interface)
  - T007 (NotificationState interface)
  - T008 (version.json file)

**Within versionService implementation**:
- T010, T011, T012 can be developed in parallel (different functions)

**Estimated Parallelization Savings**: ~40% if 2-3 developers work simultaneously

---

## Implementation Strategy

### Recommended Approach: MVP First

1. **Week 1**: Complete Phase 1 + Phase 2 (foundation) + User Story 1
   - This delivers core value: users get update notifications
   - Independently testable and deployable
   - ~3 hours of development time

2. **Week 2** (Optional): Add User Story 2 + User Story 3
   - User Story 2: ~30 minutes (error handling)
   - User Story 3: ~30 minutes (performance validation)
   - Polish: ~1 hour

### Task Granularity

- **Small tasks** (T010-T012, T018-T021): 10-15 minutes each
- **Medium tasks** (T013-T017, T022-T027): 20-30 minutes each
- **Foundation tasks** (T003-T008): 10-15 minutes each

**Total Estimated Time**:
- MVP (P1 only): ~3 hours
- Full feature (P1+P2+P3+Polish): ~5 hours

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 45 |
| **User Story 1 (P1)** | 19 tasks (MVP) |
| **User Story 2 (P2)** | 5 tasks |
| **User Story 3 (P3)** | 5 tasks |
| **Setup + Foundation** | 8 tasks |
| **Polish** | 8 tasks |
| **Parallelizable Tasks** | 15 tasks marked [P] |
| **MVP Scope** | T001-T027 (Setup + Foundation + US1) |
| **Estimated MVP Time** | 3 hours |
| **Estimated Full Time** | 5 hours |

### Format Validation ✅

All tasks follow required format:
- ✅ Checkbox: `- [ ]`
- ✅ Task ID: Sequential (T001-T045)
- ✅ [P] marker: Only on parallelizable tasks
- ✅ [Story] label: Present on all user story tasks (US1, US2, US3)
- ✅ Description: Includes specific file paths
- ✅ No setup/foundation tasks have story labels (correct)

### Independent Testing Criteria

**User Story 1**: Update version.json to 1.1.0 → Banner appears → Click it → Dialog opens → Dismiss → Restart within 24h → No banner

**User Story 2**: Airplane mode → Launch app → No errors → App works normally

**User Story 3**: Interact with app during startup → No lag → Version check completes in background

---

**Next Steps**: Start with T001 (install semver), complete foundation (T002-T008), then implement User Story 1 (T009-T027) for MVP.
