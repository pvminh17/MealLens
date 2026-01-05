---

description: "Task list for Calorie Counting App - MVP Features implementation"
---

# Tasks: Calorie Counting App - MVP Features

**Input**: Design documents from `/specs/001-calorie-tracker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (all complete)

**Tests**: Tests are REQUIRED for security boundaries (API key encryption, EXIF stripping), data migrations, and regressions per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web PWA**: `src/`, `public/`, `tests/` at repository root
- All paths shown assume project root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and PWA structure

- [ ] T001 Initialize Vite + React project with package.json and vite.config.js
- [ ] T002 [P] Install core dependencies: react, react-dom, react-router-dom
- [ ] T003 [P] Install PWA dependencies: vite-plugin-pwa, workbox-window
- [ ] T004 [P] Install storage dependencies: dexie, dexie-react-hooks
- [ ] T005 [P] Install image processing: pica, piexifjs
- [ ] T006 [P] Install AI integration: openai SDK
- [ ] T007 [P] Install testing: vitest, @testing-library/react, @testing-library/jest-dom, playwright
- [ ] T008 [P] Install dev tools: @vitejs/plugin-react, typescript, eslint, prettier
- [ ] T009 Create public/manifest.json with PWA metadata (name, icons, display: standalone)
- [ ] T010 [P] Add PWA icons to public/icons/ (192x192.png, 512x512.png)
- [ ] T011 [P] Create public/index.html with meta tags for mobile viewport
- [ ] T012 Configure vite.config.js with PWA plugin (Workbox, manifest generation)
- [ ] T013 [P] Configure tsconfig.json for React + ES2020+ support
- [ ] T014 [P] Configure vitest.config.js for unit/integration tests
- [ ] T015 [P] Configure playwright.config.js for E2E/PWA tests
- [ ] T016 [P] Setup ESLint + Prettier configs for code quality

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T017 Create src/models/Settings.ts TypeScript interface (key, value, encrypted)
- [ ] T018 [P] Create src/models/Meal.ts TypeScript interface (id, timestamp, date, type, totalCalories)
- [ ] T019 [P] Create src/models/FoodItem.ts TypeScript interface (id, mealId, name, grams, calories, confidence)
- [ ] T020 Initialize IndexedDB schema in src/db.js using Dexie (settings, meals, foodItems tables with indexes)
- [ ] T021 [P] Implement schema versioning (Dexie v1) with indexes on meals.timestamp, meals.date, foodItems.mealId in src/db.js
- [ ] T022 Create src/services/storageService.js with getSetting, setSetting, deleteSetting methods
- [ ] T023 Implement API key encryption/decryption using SubtleCrypto in src/services/storageService.js
- [ ] T024 [P] Implement saveMeal transaction (create Meal + FoodItems atomically) in src/services/storageService.js
- [ ] T025 [P] Implement getMealsByDate with indexed query in src/services/storageService.js
- [ ] T026 [P] Implement updateFoodItem with meal.totalCalories recalculation in src/services/storageService.js
- [ ] T027 [P] Implement deleteMeal with cascade delete of FoodItems in src/services/storageService.js
- [ ] T028 Create src/hooks/useIndexedDB.js custom hook for storage operations
- [ ] T029 [P] Create src/hooks/useOnlineStatus.js custom hook with navigator.onLine listeners
- [ ] T030 Implement service worker in src/service-worker.js with Workbox runtime caching strategies
- [ ] T031 Configure cache-first for static assets, network-only for OpenAI API in src/service-worker.js
- [ ] T032 [P] Implement offline fallback handling in service worker
- [ ] T033 Create src/App.jsx with React Router setup (routes for camera, results, edit, log, settings)
- [ ] T034 [P] Create src/main.jsx entry point with service worker registration
- [ ] T035 [P] Create AppContext in src/context/AppContext.jsx (settings, isOnline, currentMeal state)
- [ ] T036 Setup error boundary component in src/components/ErrorBoundary.jsx
- [ ] T037 [P] Create offline banner component in src/components/OfflineBanner.jsx
- [ ] T038 Write unit tests for storageService (getSetting, setSetting, saveMeal, transactions) in tests/unit/storageService.test.js
- [ ] T039 [P] Write unit tests for API key encryption in tests/unit/storageService.test.js
- [ ] T040 [P] Write migration test (Dexie v1 schema initialization) in tests/unit/db.test.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Photo Capture & AI Detection (Priority: P1) 🎯 MVP

**Goal**: Enable users to capture/upload food photos and receive AI-powered calorie estimates

**Independent Test**: Upload food photo → See detected food items with calories and confidence scores

### Tests for User Story 1 (REQUIRED per constitution)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T041 [P] [US1] Write contract test for OpenAI API request format in tests/unit/aiService.test.js
- [ ] T042 [P] [US1] Write contract test for OpenAI API response parsing in tests/unit/aiService.test.js
- [ ] T043 [P] [US1] Write unit test for EXIF metadata stripping in tests/unit/imageService.test.js (SECURITY BOUNDARY)
- [ ] T044 [P] [US1] Write unit test for image compression (<500KB, <=1024px) in tests/unit/imageService.test.js
- [ ] T045 [P] [US1] Write integration test for camera → preview → confirm flow in tests/integration/PhotoCapture.test.jsx

### Implementation for User Story 1

- [ ] T046 [P] [US1] Create src/services/imageService.js with compressImage function (pica library, target <500KB, max 1024px)
- [ ] T047 [P] [US1] Implement stripExif function using piexifjs in src/services/imageService.js
- [ ] T048 [P] [US1] Implement blobToBase64 helper in src/services/imageService.js
- [ ] T049 [US1] Create src/services/aiService.js with analyzeImage function (OpenAI Vision API integration)
- [ ] T050 [US1] Implement OpenAI request formatting (GPT-4 Vision, JSON response format, base64 image) in src/services/aiService.js
- [ ] T051 [US1] Implement AI response parsing (extract items array, validate schema) in src/services/aiService.js
- [ ] T052 [P] [US1] Implement error handling for API errors (401, 429, 500, timeout) in src/services/aiService.js
- [ ] T053 [P] [US1] Implement retry logic with exponential backoff for rate limits in src/services/aiService.js
- [ ] T054 Create src/hooks/useCamera.js custom hook with navigator.mediaDevices.getUserMedia
- [ ] T055 [P] Create CameraCapture component in src/components/camera/CameraCapture.jsx (video stream, capture button)
- [ ] T056 [P] Create ImagePreview component in src/components/camera/ImagePreview.jsx (show captured image, retake/confirm buttons)
- [ ] T057 [P] Create PhotoUpload component in src/components/camera/PhotoUpload.jsx (file input, gallery access)
- [ ] T058 Create PhotoFlow component in src/components/camera/PhotoFlow.jsx (orchestrates capture/upload → preview → confirm)
- [ ] T059 [US1] Integrate imageService.compressImage in PhotoFlow component
- [ ] T060 [US1] Integrate imageService.stripExif in PhotoFlow component before AI call
- [ ] T061 [US1] Integrate aiService.analyzeImage on photo confirm
- [ ] T062 [P] [US1] Create DetectionResults component in src/components/results/DetectionResults.jsx (display food items list)
- [ ] T063 [P] [US1] Create FoodItemCard component in src/components/results/FoodItemCard.jsx (name, grams, calories, confidence badge)
- [ ] T064 [P] [US1] Implement confidence indicator UI (High=green, Medium=yellow, Low=red badges) in FoodItemCard
- [ ] T065 [P] [US1] Create TotalCalories component in src/components/results/TotalCalories.jsx (sum of all items)
- [ ] T066 [P] [US1] Create LoadingIndicator component in src/components/common/LoadingIndicator.jsx (shows during AI processing)
- [ ] T067 [US1] Add error handling UI for "No food detected" edge case in DetectionResults
- [ ] T068 [US1] Add error handling UI for "Poor image quality" (low confidence) in DetectionResults
- [ ] T069 [US1] Implement "Retry" button for network errors in DetectionResults
- [ ] T070 [P] [US1] Add route /camera in App.jsx for PhotoFlow component
- [ ] T071 [P] [US1] Add route /results in App.jsx for DetectionResults component
- [ ] T072 [US1] Implement navigation: PhotoFlow → DetectionResults on AI success

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP!)

---

## Phase 4: User Story 2 - Calorie Correction & Editing (Priority: P2)

**Goal**: Enable users to edit AI-detected food items (name, portion, calories) and remove incorrect items

**Independent Test**: Load pre-detected items → Edit portions/names → Remove items → Verify instant calorie recalculation

### Tests for User Story 2

- [ ] T073 [P] [US2] Write unit test for portion adjustment with calorie recalculation in tests/unit/editor.test.js
- [ ] T074 [P] [US2] Write integration test for edit → save flow in tests/integration/FoodItemEdit.test.jsx

### Implementation for User Story 2

- [ ] T075 [P] [US2] Create FoodItemEditor component in src/components/editor/FoodItemEditor.jsx (edit form with name, grams, calories inputs)
- [ ] T076 [P] [US2] Implement portion slider in FoodItemEditor with real-time calorie recalculation
- [ ] T077 [P] [US2] Implement validation (grams >= 1, calories >= 0, name max 100 chars) in FoodItemEditor
- [ ] T078 [P] [US2] Create RemoveItemButton component in src/components/editor/RemoveItemButton.jsx (swipe-to-delete or icon)
- [ ] T079 [US2] Integrate FoodItemEditor into DetectionResults (modal/drawer on item tap)
- [ ] T080 [US2] Implement remove item logic with totalCalories update in DetectionResults
- [ ] T081 [US2] Implement "Cannot save with 0 items" validation in DetectionResults
- [ ] T082 [P] [US2] Add "Confirm" button in DetectionResults to finalize edits before saving

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Daily Meal Logging (Priority: P3)

**Goal**: Save confirmed meals to IndexedDB with timestamps and meal types

**Independent Test**: Confirm meal → Save to log → Verify meal appears in daily log with timestamp and type

### Tests for User Story 3

- [ ] T083 [P] [US3] Write integration test for save meal → view in log flow in tests/integration/MealLogging.test.jsx
- [ ] T084 [P] [US3] Write unit test for meal type auto-detection based on time in tests/unit/mealTypeDetector.test.js

### Implementation for User Story 3

- [ ] T085 [P] [US3] Create MealTypePicker component in src/components/log/MealTypePicker.jsx (Breakfast/Lunch/Dinner/Snack options)
- [ ] T086 [P] [US3] Implement meal type auto-detection logic (time-based) in src/utils/mealTypeDetector.js
- [ ] T087 [P] [US3] Create SaveMealButton component in src/components/results/SaveMealButton.jsx
- [ ] T088 [US3] Integrate storageService.saveMeal on SaveMealButton click
- [ ] T089 [US3] Implement meal save flow: show MealTypePicker → save to IndexedDB → navigate to log
- [ ] T090 [P] [US3] Create MealLogList component in src/components/log/MealLogList.jsx (chronological meal list)
- [ ] T091 [P] [US3] Create MealCard component in src/components/log/MealCard.jsx (timestamp, type, total calories)
- [ ] T092 [P] [US3] Implement getMealsByDate query in MealLogList for today's meals
- [ ] T093 [P] [US3] Add route /log in App.jsx for MealLogList component
- [ ] T094 [US3] Implement navigation: SaveMeal → /log on success

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Daily Calorie Summary (Priority: P4)

**Goal**: Display total calories for today and list of all meals

**Independent Test**: Log multiple meals → View summary → Verify total calories and meal list display correctly

### Tests for User Story 4

- [ ] T095 [P] [US4] Write integration test for daily summary calculation in tests/integration/DailySummary.test.jsx

### Implementation for User Story 4

- [ ] T096 [P] [US4] Create DailySummary component in src/components/log/DailySummary.jsx (total calories + meal count)
- [ ] T097 [US4] Implement total calories calculation (sum of all meals for today) in DailySummary
- [ ] T098 [US4] Implement meal count display in DailySummary
- [ ] T099 [US4] Add "No meals logged" empty state with prompt in DailySummary
- [ ] T100 [US4] Integrate DailySummary at top of MealLogList component
- [ ] T101 [P] [US4] Add meal detail expansion (tap meal → show food items) in MealCard

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Settings & API Key Management (Cross-Cutting)

**Purpose**: API key configuration and user preferences

- [ ] T102 [P] Create Settings screen in src/components/settings/Settings.jsx
- [ ] T103 [P] Create ApiKeyInput component in src/components/settings/ApiKeyInput.jsx (password input, validation)
- [ ] T104 Implement API key save with encryption (storageService.setSetting) in ApiKeyInput
- [ ] T105 [P] Implement API key validation (starts with "sk-") in ApiKeyInput
- [ ] T106 [P] Create DeleteAllData button in Settings with confirmation dialog
- [ ] T107 Implement factory reset (storageService.clearAllData) in Settings
- [ ] T108 [P] Add privacy notice text in Settings ("API key stored locally, never transmitted except to OpenAI")
- [ ] T109 [P] Add route /settings in App.jsx for Settings component
- [ ] T110 [P] Add Settings icon/button in app header/navigation

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T111 [P] Implement responsive design (mobile-first, works on iOS Safari 15+ and Chrome Android 90+)
- [ ] T112 [P] Add loading states for all async operations (AI analysis, storage operations)
- [ ] T113 [P] Implement consistent error message UI (toast/snackbar component)
- [ ] T114 [P] Add user-friendly error messages for all error types (API key invalid, rate limit, network timeout)
- [ ] T115 [P] Implement success messages for save operations (meal saved, settings updated)
- [ ] T116 [P] Add confirmation dialogs for destructive actions (delete meal, delete all data)
- [ ] T117 [P] Optimize image compression performance (target <2s per photo)
- [ ] T118 [P] Add accessibility attributes (ARIA labels, keyboard navigation)
- [ ] T119 [P] Implement dark mode support (optional enhancement)
- [ ] T120 [P] Add app logo and branding assets
- [ ] T121 Write E2E test for PWA installability in tests/e2e/pwa-install.spec.js
- [ ] T122 [P] Write E2E test for offline mode (view meals, disabled AI) in tests/e2e/offline.spec.js
- [ ] T123 [P] Write E2E test for full user flow (capture → detect → edit → save → view) in tests/e2e/full-flow.spec.js
- [ ] T124 Validate all quickstart.md test scenarios pass
- [ ] T125 [P] Add README.md with project setup instructions
- [ ] T126 [P] Add inline code documentation (JSDoc comments for services)
- [ ] T127 Run performance audit (Lighthouse PWA score target: 90+)
- [ ] T128 Run security audit (no API keys logged, EXIF stripped, encryption working)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Depends on User Story 1 (needs DetectionResults component)
  - User Story 3 (P3): Depends on User Story 2 (needs confirm flow to save)
  - User Story 4 (P4): Depends on User Story 3 (needs logged meals to display)
- **Settings (Phase 7)**: Can start after Foundational (parallel with User Stories)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories - **MVP CANDIDATE**
- **User Story 2 (P2)**: Requires US1 DetectionResults component - Builds on AI detection results
- **User Story 3 (P3)**: Requires US2 confirm flow - Saves edited meals to IndexedDB
- **User Story 4 (P4)**: Requires US3 logged meals - Displays aggregated data

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD approach)
- Models before services (TypeScript interfaces defined in Phase 2)
- Services before components (aiService, imageService ready before UI)
- Core implementation before integration (components before routing)
- Story complete before moving to next priority

### Parallel Opportunities

**Setup (Phase 1)**:
- All dependency installations (T002-T008) can run in parallel
- All config files (T013-T016) can be created in parallel
- PWA assets (T010-T011) can be added in parallel

**Foundational (Phase 2)**:
- Model interfaces (T017-T019) can be created in parallel
- Storage service methods (T022-T027) can be implemented in parallel after schema (T020-T021)
- Custom hooks (T028-T029) can be created in parallel
- Error boundary and offline banner (T036-T037) can be created in parallel
- Unit tests (T038-T040) can be written in parallel

**User Story 1 Tests (Phase 3)**:
- All test files (T041-T045) can be written in parallel

**User Story 1 Implementation (Phase 3)**:
- imageService functions (T046-T048) can be implemented in parallel
- Camera components (T055-T057) can be created in parallel
- Results components (T062-T065) can be created in parallel
- Routes (T070-T071) can be added in parallel

**Settings (Phase 7)**:
- All settings components (T102-T108) can run in parallel with User Story implementations

**Polish (Phase 8)**:
- All polish tasks (T111-T120) can run in parallel
- E2E tests (T121-T123) can be written in parallel
- Documentation tasks (T125-T126) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
- T041: OpenAI API request format test
- T042: OpenAI API response parsing test
- T043: EXIF stripping test (SECURITY)
- T044: Image compression test
- T045: Camera flow integration test

# Launch all image service functions together:
- T046: compressImage implementation
- T047: stripExif implementation
- T048: blobToBase64 helper

# Launch all camera components together:
- T055: CameraCapture component
- T056: ImagePreview component
- T057: PhotoUpload component

# Launch all results components together:
- T062: DetectionResults component
- T063: FoodItemCard component
- T064: Confidence indicator UI
- T065: TotalCalories component
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T016)
2. Complete Phase 2: Foundational (T017-T040) - **CRITICAL** - blocks all stories
3. Complete Phase 3: User Story 1 (T041-T072)
4. Complete Phase 7: Settings (T102-T110) - **REQUIRED** for API key
5. **STOP and VALIDATE**: Test User Story 1 independently using quickstart.md
6. Deploy/demo if ready - **This is the MVP!**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 + Settings → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add Polish (Phase 8) → Final production release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T041-T072) - **MVP PRIORITY**
   - **Developer B**: Settings (T102-T110) - **REQUIRED FOR MVP**
   - **Developer C**: User Story 2 (T073-T082) - **PARALLEL if staffed**
3. After US1 + Settings complete: Test MVP
4. Continue with US2 → US3 → US4 → Polish

---

## Notes

- **[P] tasks** = different files, no dependencies - safe to parallelize
- **[Story] label** maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD approach**: Write tests first (they FAIL), then implement (tests PASS)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Constitution compliance**: Security tests (T043, T039), migration tests (T040), contract tests (T041-T042) are NON-NEGOTIABLE
- **MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 7 (Settings)** = ~110 tasks for basic working app

---

## Task Count Summary

- **Phase 1 (Setup)**: 16 tasks
- **Phase 2 (Foundational)**: 24 tasks (BLOCKS everything)
- **Phase 3 (User Story 1 - MVP)**: 32 tasks
- **Phase 4 (User Story 2)**: 10 tasks
- **Phase 5 (User Story 3)**: 12 tasks
- **Phase 6 (User Story 4)**: 6 tasks
- **Phase 7 (Settings)**: 9 tasks
- **Phase 8 (Polish)**: 18 tasks
- **TOTAL**: 128 tasks

**MVP Task Count** (P1 + P2 + P3 + P7): 81 tasks  
**Full Feature Task Count**: 128 tasks

**Parallel Tasks**: 72 tasks marked [P] (56% parallelizable)  
**Independent Test Tasks**: 12 tasks (all required before implementation per constitution)

---

## Validation Checklist

Before marking tasks.md as complete, verify:

- [x] All user stories from spec.md are represented (P1, P2, P3, P4)
- [x] All entities from data-model.md are covered (Settings, Meal, FoodItem)
- [x] All contracts are implemented (openai-api.md, storageService.md)
- [x] All tech stack from plan.md is included (React, Vite, Dexie, Workbox, OpenAI SDK, pica, piexifjs)
- [x] All constitution requirements met (security tests, migration tests, TDD approach)
- [x] All tasks follow format: `- [ ] [ID] [P?] [Story?] Description with file path`
- [x] Task IDs are sequential (T001-T128)
- [x] Dependencies are clear (phases must complete in order)
- [x] Parallel opportunities identified ([P] markers)
- [x] MVP path is clear (Setup + Foundational + US1 + Settings)
- [x] Independent test criteria defined per user story

**Validation Status**: ✅ COMPLETE - Ready for implementation

---

**Generated**: 2026-01-05  
**Feature**: 001-calorie-tracker  
**Next Command**: `/speckit.implement` to begin task execution
