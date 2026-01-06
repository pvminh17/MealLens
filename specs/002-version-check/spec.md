# Feature Specification: App Version Check on Startup

**Feature Branch**: `002-version-check`  
**Created**: January 6, 2026  
**Status**: Draft  
**Input**: User description: "I want the app always checks version when open"

## Clarifications

### Session 2026-01-06

- Q: Where should the version information be retrieved from? → A: Custom JSON file hosted on the same server/CDN as the app (e.g., version.json)
- Q: What should happen when the user clicks/taps on the update notification? → A: Show a dialog with update details and an "Update Now" button that opens the app store
- Q: How should version comparison determine if an update is "newer"? → A: Semantic versioning comparison (e.g., 1.2.3 < 1.2.4, major.minor.patch)
- Q: Should the app throttle version check notifications to avoid annoying users who choose not to update? → A: Show once per day maximum (if dismissed, don't show again for 24 hours)
- Q: Where should the update notification appear in the UI? → A: Non-intrusive banner at top

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Automatic Update Notification (Priority: P1)

When a user opens the app, the system automatically checks if a newer version is available and notifies them if an update exists, allowing them to stay current with the latest features and bug fixes.

**Why this priority**: Core functionality that ensures users are aware of updates without manual checking. This is the minimum viable feature that delivers immediate value.

**Independent Test**: Can be fully tested by opening the app with an outdated version and verifying that an update notification appears within 3 seconds of launch.

**Acceptance Scenarios**:

1. **Given** the app is opened and a newer version exists, **When** the version check completes, **Then** a non-intrusive banner notification appears at the top of the screen indicating a new version is available
2. **Given** the app is opened and the current version is up-to-date, **When** the version check completes, **Then** no update notification is shown and the app proceeds normally
3. **Given** the user sees an update notification banner, **When** they click/tap on it, **Then** a dialog appears with update details and an "Update Now" button
4. **Given** the user clicks "Update Now", **When** the action is triggered, **Then** the device's app store/update page opens for the app
5. **Given** the user sees an update notification banner, **When** they dismiss the notification, **Then** the app continues to function normally with the current version
6. **Given** the user dismissed an update notification, **When** they open the app again within 24 hours, **Then** no update notification is shown even if an update is available
7. **Given** the user dismissed an update notification more than 24 hours ago, **When** they open the app and an update is still available, **Then** the update notification banner is shown again

---

### User Story 2 - Offline Graceful Degradation (Priority: P2)

When a user opens the app without an internet connection, the version check fails silently without blocking app usage or displaying error messages, ensuring the app remains functional offline.

**Why this priority**: Ensures the app remains usable in offline scenarios, which is critical for a meal tracking app that users may need anywhere.

**Independent Test**: Can be tested by opening the app in airplane mode and verifying the app launches successfully without errors or delays.

**Acceptance Scenarios**:

1. **Given** the app is opened without internet connectivity, **When** the version check times out, **Then** the app loads normally without showing error messages
2. **Given** the version check fails due to network issues, **When** the timeout period expires, **Then** the app continues to function with locally stored data

---

### User Story 3 - Version Check Performance (Priority: P3)

The version check executes in the background without delaying app startup or impacting the user's ability to begin using the app immediately.

**Why this priority**: Improves user experience by ensuring the version check doesn't create perceived slowness, but is less critical than core functionality.

**Independent Test**: Can be tested by measuring app startup time with version check enabled versus disabled, ensuring no perceivable delay (under 100ms impact).

**Acceptance Scenarios**:

1. **Given** the app is launching, **When** the version check runs, **Then** the main interface becomes interactive within 1 second regardless of version check status
2. **Given** the version check is running, **When** the user begins interacting with the app, **Then** all core features respond immediately without waiting for version check completion

---

### Edge Cases

- What happens when the version check service is temporarily unavailable?
- How does the system handle malformed version information from the server?
- What occurs if multiple app instances are opened simultaneously?
- How is the version check handled after the app has been backgrounded and resumed?
- What happens if the user has disabled internet access for the app at the OS level?
- What happens if a user dismisses version 1.2.0, then 1.3.0 is released - should notification show immediately?
- How is the 24-hour throttle managed across different time zones or device time changes?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST perform a version check automatically every time the app is opened
- **FR-002**: System MUST compare the current app version against the latest available version
- **FR-003**: System MUST display a non-intrusive banner notification at the top of the screen when a newer version is available
- **FR-004**: System MUST show a dialog with update details and an "Update Now" button when the user interacts with the update notification
- **FR-005**: System MUST open the device's app store/update page when the user clicks "Update Now"
- **FR-006**: System MUST allow users to dismiss update notifications and continue using the current version
- **FR-007**: System MUST complete the version check within 5 seconds or timeout gracefully
- **FR-006**: System MUST allow users to dismiss update notifications and continue using the current version
- **FR-007**: System MUST complete the version check within 5 seconds or timeout gracefully
- **FR-008**: System MUST function normally if the version check fails due to network issues
- **FR-009**: System MUST NOT block app startup while performing the version check
- **FR-010**: System MUST store the timestamp of the last successful version check
- **FR-011**: Update notifications MUST include the new version number
- **FR-012**: Update dialog MUST provide a way for users to learn more about the update or proceed to update
- **FR-013**: System MUST NOT show the same update notification more than once per 24-hour period
- **FR-014**: System MUST store the timestamp of the last dismissed update notification
- **FR-015**: System MUST reset the notification throttle when a new version becomes available (different from the previously dismissed version)
- **FR-016**: Update notification banner MUST be dismissable without blocking app functionality
- **FR-017**: Update notification banner MUST remain visible until dismissed or user interacts with it

### Key Entities

- **Version Info**: Represents version data including current version number, latest available version number, release date, and update availability status. Version numbers follow semantic versioning format (major.minor.patch).
- **Version Check Result**: Represents the outcome of a version check including success/failure status, timestamp, and comparison result (up-to-date, update available, or check failed). Comparison uses semantic versioning rules where version A is newer than version B if A's major, minor, or patch number is greater.
- **Notification State**: Tracks notification throttling including last dismissed notification timestamp, last dismissed version number, and whether notification can be shown (based on 24-hour throttle window).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Version check completes within 3 seconds for 95% of app launches with internet connectivity
- **SC-002**: App startup time increases by no more than 100 milliseconds when version check is active
- **SC-003**: Users receive update notifications within 5 seconds of opening the app when a new version is available
- **SC-004**: App launches successfully 100% of the time regardless of network connectivity status
- **SC-005**: Version check failures (due to network issues) do not generate user-visible errors or prevent app usage

## Scope

### In Scope

- Automatic version checking when the app is opened from a closed state (cold start)
- Displaying update notifications to users when new versions are available
- Graceful handling of network failures during version checks
- Non-blocking version check that doesn't delay app startup
- Ability for users to dismiss update notifications

### Out of Scope

- Automatic app updates or forced updates
- Version checking when app resumes from background (only on cold start)
- Detailed release notes or changelogs within the notification
- Version rollback or downgrade functionality
- Periodic background version checks while app is running

## Assumptions

- The app has access to a version information endpoint or service that provides the latest version number via a JSON file (e.g., version.json) hosted on the same server/CDN as the app
- Users have granted necessary network permissions for the app
- Version numbers follow semantic versioning format (major.minor.patch, e.g., 1.2.3)
- The version check service has reasonable uptime (95%+)
- App store or distribution platform handles the actual update process
- Users can access app updates through their device's standard update mechanism (app store, web download, etc.)
- The version.json file is updated when new app versions are deployed
