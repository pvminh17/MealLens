# Implementation Plan: Calorie Counting App - MVP Features

**Branch**: `001-calorie-tracker` | **Date**: 2026-01-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-calorie-tracker/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a mobile-first Progressive Web App (PWA) that helps users estimate meal calories from photos with minimal effort. Users capture or upload food photos, receive AI-powered calorie estimates via OpenAI Vision API, correct/edit results, and log meals locally. The app operates offline for viewing logged meals, with internet required only for AI analysis. All data (API keys, meals) stored client-side in IndexedDB; no backend infrastructure needed. Technical approach: ReactJS PWA with client-side image processing, OpenAI Vision API integration, and local-first architecture.

## Technical Context

**Language/Version**: JavaScript/TypeScript (ES2020+), React 18+  
**Primary Dependencies**: React, Vite (build tool), Workbox (service worker), OpenAI SDK, Dexie.js (IndexedDB wrapper)  
**Storage**: IndexedDB (client-side only) - stores API keys, user settings, meals (timestamp, calories, items)  
**Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E for PWA features)  
**Target Platform**: Modern mobile browsers (iOS Safari 15+, Chrome Android 90+), installable as PWA
**Project Type**: Web (Progressive Web App - single deployable, no backend)  
**Performance Goals**: AI analysis <10s (network-dependent), UI interactions <100ms, image compression <2s for typical photo  
**Constraints**: Offline-capable (view/edit stored meals), images never stored (memory-only during analysis), max image 1024px/<500KB, no backend/server costs  
**Scale/Scope**: Single-user client app, ~10 main screens (camera, results, edit, log, summary, settings), target 100+ meals stored locally without performance degradation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Use `.specify/memory/constitution.md` as the source of truth. Document pass/fail
for each gate and list any exceptions in **Complexity Tracking**.

### Initial Check (Pre-Research)

**Gate 1: MVP slice independently testable/deployable; upgrade path documented** ✅ PASS
- P1 (Photo + AI Detection) is independently deployable as PWA
- Upgrade path: P1 → P2 (editing) → P3 (logging) → P4 (summary) are additive features
- No breaking changes between priority levels; IndexedDB schema versioned for future migrations

**Gate 2: Design stays simple; new abstractions justified** ✅ PASS
- Single deployable (React PWA), no backend eliminates infrastructure complexity
- No premature abstractions: direct IndexedDB via Dexie, direct OpenAI API calls
- Service Worker for PWA is justified (offline requirement + installability)

**Gate 3: Security/privacy - data classification, sensitive fields, secrets handling, authz** ✅ PASS
- **Data classification**:
  - Sensitive: OpenAI API key (user-provided, stored locally in IndexedDB)
  - Internal: Meal data, timestamps, food items (local to user's device)
  - Public: None (no data sharing)
- **Sensitive fields**: API key (stored encrypted if browser supports SubtleCrypto), food photos (never stored)
- **Secrets handling**: API key stored in IndexedDB, never logged, never transmitted except to OpenAI API
- **Authz boundaries**: N/A (single-user local app, no multi-user access control needed)
- **Privacy**: Images stripped of EXIF metadata, never stored, exist only in memory during analysis

**Gate 4: Scalability - data model supports indexes/migrations, interfaces versioned, async work** ✅ PASS
- IndexedDB schema versioned (Dexie migrations support)
- Data model includes indexes on meal.timestamp for date-based queries
- AI processing is async (doesn't block UI)
- Image compression is async/web worker if needed
- Interfaces: OpenAI API is external/versioned; local storage schema versioned for migrations

**Gate 5: Operability - structured logs, auditable events, rollback plan** ✅ PASS
- Structured console logging for key events: AI API calls (success/failure), storage operations, errors
- Security events logged: API key validation failures (without logging the key), OpenAI API errors
- Rollback plan: PWA service worker can be updated/rolled back; IndexedDB migrations support downgrade patterns
- Error messages are actionable (e.g., "API key invalid - check Settings", "Network error - retry?")

**Overall Pre-Research Status**: ✅ ALL GATES PASS - Proceed to Phase 0

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
public/
├── manifest.json        # PWA manifest (name, icons, display mode)
├── icons/               # PWA icons (192x192, 512x512)
└── index.html           # Entry HTML

src/
├── components/          # React UI components
│   ├── camera/          # Photo capture, preview, retake
│   ├── results/         # AI detection results display
│   ├── editor/          # Food item editing, portion adjustment
│   ├── log/             # Meal log list, daily summary
│   └── settings/        # API key management, preferences
├── services/            # Business logic
│   ├── aiService.js     # OpenAI Vision API integration
│   ├── storageService.js # IndexedDB operations (Dexie)
│   ├── imageService.js  # Compression, EXIF stripping
│   └── pwaService.js    # Service worker registration, updates
├── models/              # Data models (TypeScript interfaces)
│   ├── Meal.ts
│   ├── FoodItem.ts
│   └── Settings.ts
├── hooks/               # React custom hooks
│   ├── useCamera.js
│   ├── useIndexedDB.js
│   └── useOnlineStatus.js
├── utils/               # Helpers
│   ├── imageUtils.js
│   └── dateUtils.js
├── App.jsx              # Main app component, routing
├── main.jsx             # React entry point
└── service-worker.js    # Workbox service worker

tests/
├── unit/                # Component + service unit tests
├── integration/         # Multi-component integration tests
└── e2e/                 # Playwright PWA tests (install, offline)

vite.config.js           # Vite build config + PWA plugin
package.json             # Dependencies
```

**Structure Decision**: Web application (Option 2 variant) selected. Single frontend project (no backend needed per requirements). React PWA with Vite build system. Service Worker for offline capability. All storage client-side (IndexedDB). Structure organizes by feature area (camera, results, editor, log, settings) with shared services layer.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations** - All constitution gates passed. No complexity tracking entries required.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design completion*

**Gate 1: MVP slice independently testable/deployable; upgrade path documented** ✅ PASS
- Design confirms P1-P4 are additive features with no breaking changes
- IndexedDB schema includes versioning (Dexie migrations) for future changes
- Service worker supports cache invalidation for app updates
- Upgrade path validated: local-first → optional cloud sync (future) via export/import

**Gate 2: Design stays simple; new abstractions justified** ✅ PASS
- Single deployable (React PWA bundle) with no backend
- Service layer (`aiService`, `storageService`, `imageService`) justified by separation of concerns
- No premature optimization: direct IndexedDB, direct OpenAI API, standard React patterns
- Web Workers deferred unless image processing >2s (measurement-driven decision per research)

**Gate 3: Security/privacy - data classification, sensitive fields, secrets handling, authz** ✅ PASS
- Data classification complete (see data-model.md):
  - Sensitive: API key (encrypted via SubtleCrypto AES-GCM)
  - Internal: Meals, FoodItems (local-only, never transmitted)
  - Public: None
- Sensitive fields documented: `Settings.apiKey` (encrypted flag in schema)
- Secrets handling: API key encrypted at rest, transmitted only to OpenAI via HTTPS, never logged
- Privacy enforced: EXIF stripping (piexifjs), no image storage, no PII beyond device
- Authz: N/A (single-user local app - no multi-user access control needed)

**Gate 4: Scalability - data model supports indexes/migrations, interfaces versioned, async work** ✅ PASS
- IndexedDB schema versioned (Dexie v1 with upgrade path to v2+ documented in data-model.md)
- Indexes on: `meals.timestamp`, `meals.date`, `foodItems.mealId` for efficient queries
- Interfaces versioned:
  - OpenAI API: external API versioned by provider (gpt-4-vision-preview)
  - Storage schema: internal versioning via Dexie migrations
- Async work: AI calls, image compression, service worker - all non-blocking (see contracts)

**Gate 5: Operability - structured logs, auditable events, rollback plan** ✅ PASS
- Structured logging:
  - Console logs for: API calls (success/failure), storage ops, errors (no API keys logged)
  - Error types defined: ValidationError, NotFoundError, DatabaseError, QuotaExceededError
- Auditable security events:
  - API key save/delete logged (value not logged)
  - OpenAI API errors logged (rate limits, auth failures)
  - Image processing failures logged
- Rollback plan:
  - Service worker version controlled (Workbox skip waiting strategy)
  - IndexedDB migrations support downgrade (Dexie tx.abort() on failure)
  - Factory reset available (clearAllData() in storageService)
- Actionable errors: All error messages include next steps (see quickstart.md error tests)

**Overall Post-Design Status**: ✅ ALL GATES PASS - Design complies with constitution

**Additional Compliance**:
- **Testing** (per constitution Delivery Workflow):
  - Auth/authz boundaries: API key encryption tests (storageService.test.js)
  - Data migrations: Dexie v1→v2 migration test required
  - Regressions: TDD approach documented in research.md testing strategy
- **Acceptance scenarios**: Defined in spec.md (Given/When/Then format)
- **Quickstart validation**: quickstart.md provides end-to-end validation path

---

## Phase Summary

### Phase 0: Research (Complete)
**Output**: [research.md](research.md)
- Resolved all technical unknowns (OpenAI Vision API, IndexedDB, PWA patterns, image processing)
- Selected libraries: Dexie.js, pica, piexifjs, Workbox, Vitest, Playwright
- No [NEEDS CLARIFICATION] markers remain

### Phase 1: Design (Complete)
**Outputs**:
- [data-model.md](data-model.md): 3 entities (Settings, Meal, FoodItem) with indexes, migrations, validation
- [contracts/openai-api.md](contracts/openai-api.md): OpenAI Vision API integration spec
- [contracts/storageService.md](contracts/storageService.md): IndexedDB CRUD operations contract
- [quickstart.md](quickstart.md): End-to-end validation guide for all user stories
- [.github/agents/copilot-instructions.md](../.github/agents/copilot-instructions.md): Agent context updated with React/PWA stack

### Phase 2: Tasks (Next Command)
**Not created by /speckit.plan** - Use `/speckit.tasks` command to generate tasks.md

---

## Deliverables Summary

| Artifact | Status | Path | Description |
|----------|--------|------|-------------|
| Feature Spec | ✅ Complete | [spec.md](spec.md) | User stories, requirements, success criteria |
| Implementation Plan | ✅ Complete | [plan.md](plan.md) | This file - technical context, constitution check, structure |
| Research | ✅ Complete | [research.md](research.md) | Technology decisions, best practices, alternatives |
| Data Model | ✅ Complete | [data-model.md](data-model.md) | Entity schemas, indexes, migrations, validation |
| OpenAI API Contract | ✅ Complete | [contracts/openai-api.md](contracts/openai-api.md) | AI service integration spec |
| Storage Contract | ✅ Complete | [contracts/storageService.md](contracts/storageService.md) | IndexedDB CRUD operations |
| Quickstart Guide | ✅ Complete | [quickstart.md](quickstart.md) | End-to-end validation tests |
| Agent Context | ✅ Updated | [.github/agents/copilot-instructions.md](../.github/agents/copilot-instructions.md) | React/PWA stack context |
| Task List | ⏳ Pending | tasks.md | Run `/speckit.tasks` to generate |

---

## Ready for Next Phase

**Recommendation**: Run `/speckit.tasks` to generate detailed implementation tasks based on:
- User stories from spec.md (P1→P2→P3→P4 priority order)
- Technical design from this plan, research, data model, and contracts
- Constitution compliance requirements (testing, security, migrations)

**Expected Task Structure**:
- Phase 1: Setup (Vite + React + PWA dependencies)
- Phase 2: Foundational (IndexedDB schema, service worker, base components)
- Phase 3: User Story 1 - Photo Capture & AI Detection (P1) 🎯 MVP
- Phase 4: User Story 2 - Calorie Correction & Editing (P2)
- Phase 5: User Story 3 - Daily Meal Logging (P3)
- Phase 6: User Story 4 - Daily Calorie Summary (P4)
- Phase 7: Polish & Testing (E2E tests, PWA installability, offline validation)

**Branch**: `001-calorie-tracker` (already created)  
**Next Command**: `/speckit.tasks` or begin implementation with `/speckit.implement`
