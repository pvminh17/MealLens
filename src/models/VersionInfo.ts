/**
 * Version Check Data Models
 * Defines TypeScript interfaces for version checking functionality
 */

/**
 * Version metadata retrieved from version.json
 */
export interface VersionInfo {
  version: string;          // Semantic version (e.g., "1.2.3")
  releaseDate: string;      // ISO 8601 timestamp
  minVersion?: string;      // Minimum supported version (optional)
  updateUrl: string;        // URL to app store or download page
}

/**
 * Result of a version check operation
 */
export interface VersionCheckResult {
  currentVersion: string;       // Current app version
  latestVersion: string;        // Latest available version
  updateAvailable: boolean;     // Whether update is available
  checkedAt: number;            // Unix timestamp (ms) of check
  success: boolean;             // Whether check succeeded
  error?: string;               // Error message if failed
  shouldShowNotification?: boolean;  // Whether to show notification
  updateUrl?: string;           // URL for updates
}

/**
 * Notification throttle state stored in IndexedDB
 */
export interface NotificationState {
  key: string;                  // Storage key (always "app-version-state")
  lastDismissedAt?: number;     // Unix timestamp when dismissed
  lastDismissedVersion?: string;  // Version that was dismissed
  lastCheckAt?: number;         // Last check timestamp
}
