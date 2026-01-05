<!--
Sync Impact Report

- Version change: template -> 1.0.0
- Modified principles: N/A (template -> concrete)
- Added sections: Security & Privacy Requirements; Delivery Workflow & Quality Gates
- Removed sections: N/A
- Templates requiring updates:

	- updated: .specify/templates/plan-template.md
	- updated: .specify/templates/tasks-template.md
	- no change required: .specify/templates/spec-template.md
	- no change required: .specify/templates/checklist-template.md
- Deferred TODOs:

  - TODO(RATIFICATION_DATE): original adoption date is unknown; set once established.
-->

# MealLens Constitution

## Core Principles

### 1) MVP-First, Production-Ready Path
MealLens MUST ship value in thin, vertical slices (one user story at a time).
MVP shortcuts are allowed only if they do not create dead-ends.

Non-negotiables:
- Each feature MUST be independently testable and deployable as an incremental step.
- Each MVP decision MUST include an explicit, low-risk upgrade path (data migrations,
	config toggles, feature flags, or compatible interfaces).
- The system MUST prefer simple defaults and delay complexity until a measurable need
	exists.

Rationale: Smooth evolution from MVP to production requires incremental delivery and
avoids rewrites.

### 2) Simplicity and Clear Boundaries
MealLens MUST remain understandable by a new contributor within a short onboarding.
Designs MUST choose the smallest architecture that meets current requirements.

Non-negotiables:
- Start with a single deployable (monolith) unless there is a proven scaling or
	organizational need.
- Module boundaries MUST be explicit (clear ownership, stable interfaces, minimal
	coupling).
- New abstractions MUST be justified by duplication or a demonstrated lifecycle need;
	avoid speculative generalization.

Rationale: Simple systems scale better and are easier to secure.

### 3) Secure by Default (Privacy-Preserving)
MealLens MUST treat user data as sensitive by default and apply least-privilege
everywhere.

Non-negotiables:
- Secrets MUST NOT be committed; use environment/config management.
- Sensitive data (PII, tokens, credentials) MUST be minimized, encrypted in transit,
	and protected at rest when stored.
- Authentication/authorization boundaries MUST be explicit and tested.
- Dependencies MUST be kept current; known critical vulnerabilities MUST block release
	until addressed or explicitly risk-accepted.

Rationale: Security debt compounds quickly and is hardest to fix later.

### 4) Scalable Data and Performance Fundamentals
MealLens MUST design data models and APIs so performance can be improved without
breaking behavior.

Non-negotiables:
- Data models MUST support indexing and migrations; schema changes MUST be backward
	compatible during rollout when feasible.
- Public/remote interfaces MUST be versioned or backward compatible.
- Long-running work SHOULD be async/backgrounded when it affects latency.
- Performance optimizations MUST be driven by measurement (profiling/metrics), not
	guesswork.

Rationale: A production system needs predictable performance and evolvable data.

### 5) Operable and Observable
MealLens MUST be diagnosable in production with minimal guesswork.

Non-negotiables:
- Errors MUST be actionable (clear messages, consistent handling, no silent failures).
- The system MUST emit structured logs for key events and failures.
- Security-relevant events (auth failures, permission checks, sensitive operations)
	MUST be auditable.
- Production readiness changes MUST include rollback steps.

Rationale: Operability is the difference between a demo and a reliable product.

## Security & Privacy Requirements

- Data classification MUST be defined per feature: public / internal / sensitive.
- Sensitive fields MUST be explicitly listed in specs and reviewed.
- Logging MUST NOT include secrets; PII in logs MUST be avoided.
- Access control rules MUST be documented (who can do what).
- External integrations MUST define timeout/retry behavior and failure modes.

## Delivery Workflow & Quality Gates

- Every change MUST be reviewable (small PRs preferred) and include an implementation
	plan when non-trivial.
- Each feature MUST define acceptance scenarios (Given/When/Then) and a quickstart
	or validation path.
- Tests are REQUIRED for:
	- Authentication/authorization boundaries
	- Data migrations and backward compatibility logic
	- Any bugfix (regression coverage)
	For pure MVP prototyping, tests MAY be deferred, but the plan MUST state the
	follow-up test scope before production.
- Breaking changes MUST include a migration plan and staged rollout.

## Governance
This constitution is the highest-level engineering policy for MealLens.
Specs, plans, and tasks MUST comply; conflicts MUST be resolved by changing the
lower-level artifact or explicitly amending this constitution.

Amendments:
- Any amendment MUST describe impact, migration plan (if needed), and risks.
- Versioning follows semantic versioning:
	- MAJOR: backward-incompatible governance changes (principle removals/redefinitions)
	- MINOR: new principle/section or materially expanded guidance
	- PATCH: clarifications, wording, typos (no semantic change)
- Compliance review expectation: Every feature plan MUST include a Constitution Check
	section and explicitly note any exceptions and rationale.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-01-05
