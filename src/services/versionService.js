/**
 * Version Check Service
 * Handles version checking, comparison, and notification throttling
 */

import semver from 'semver';
import { db } from '../db.js';

// Configuration constants
const CONFIG = {
  VERSION_JSON_URL: '/version.json',
  FETCH_TIMEOUT: 5000,           // 5 seconds
  DEBOUNCE_INTERVAL: 60000,      // 1 minute
  THROTTLE_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
  STORAGE_KEY: 'app-version-state'
};

// Get current app version from package.json
const CURRENT_VERSION = '1.0.0'; // Matches package.json

/**
 * Main entry point: Check for updates and return result
 * @returns {Promise<VersionCheckResult>}
 */
export async function checkForUpdates() {
  try {
    // Debounce: Skip if checked recently
    const state = await getNotificationState();
    if (state.lastCheckAt && Date.now() - state.lastCheckAt < CONFIG.DEBOUNCE_INTERVAL) {
      return {
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        updateAvailable: false,
        checkedAt: state.lastCheckAt,
        success: true,
        shouldShowNotification: false
      };
    }

    // Fetch version info from server
    const versionInfo = await fetchVersionInfo();
    const updateAvailable = compareVersions(CURRENT_VERSION, versionInfo.version);
    const shouldShow = updateAvailable && await shouldShowNotification(versionInfo.version);

    // Update last check time
    await updateLastCheckTime();

    return {
      currentVersion: CURRENT_VERSION,
      latestVersion: versionInfo.version,
      updateAvailable,
      checkedAt: Date.now(),
      success: true,
      shouldShowNotification: shouldShow,
      updateUrl: versionInfo.updateUrl
    };
  } catch (error) {
    console.warn('Version check failed:', error.message);
    return {
      currentVersion: CURRENT_VERSION,
      latestVersion: CURRENT_VERSION,
      updateAvailable: false,
      checkedAt: Date.now(),
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch version.json with timeout
 * @returns {Promise<VersionInfo>}
 */
async function fetchVersionInfo() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.FETCH_TIMEOUT);

  try {
    const response = await fetch(`${CONFIG.VERSION_JSON_URL}?_t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!validateVersionInfo(data)) {
      throw new Error('Invalid version.json schema');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Timeout after 5000ms');
    }
    throw error;
  }
}

/**
 * Validate version.json structure
 * @param {any} data
 * @returns {boolean}
 */
function validateVersionInfo(data) {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.version === 'string' &&
    /^\d+\.\d+\.\d+/.test(data.version) &&
    typeof data.updateUrl === 'string' &&
    data.updateUrl.length > 0
  );
}

/**
 * Compare versions using semver
 * @param {string} current
 * @param {string} latest
 * @returns {boolean} true if latest > current
 */
function compareVersions(current, latest) {
  try {
    return semver.gt(latest, current);
  } catch {
    return false;
  }
}

/**
 * Get notification state from storage
 * @returns {Promise<NotificationState>}
 */
export async function getNotificationState() {
  try {
    const state = await db.versionState.get(CONFIG.STORAGE_KEY);
    return state || { key: CONFIG.STORAGE_KEY };
  } catch {
    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`meallens:${CONFIG.STORAGE_KEY}`);
      return stored ? JSON.parse(stored) : { key: CONFIG.STORAGE_KEY };
    } catch {
      return { key: CONFIG.STORAGE_KEY };
    }
  }
}

/**
 * Check if notification should be shown (24-hour throttle)
 * @param {string} latestVersion
 * @returns {Promise<boolean>}
 */
export async function shouldShowNotification(latestVersion) {
  const state = await getNotificationState();
  
  // Always show if never dismissed
  if (!state.lastDismissedAt) return true;
  
  // Show if different version than dismissed
  if (state.lastDismissedVersion !== latestVersion) return true;
  
  // Check 24-hour throttle
  const hoursSince = (Date.now() - state.lastDismissedAt) / (1000 * 60 * 60);
  return hoursSince >= 24;
}

/**
 * Dismiss notification and update throttle state
 * @param {string} version
 * @returns {Promise<void>}
 */
export async function dismissNotification(version) {
  const state = await getNotificationState();
  state.lastDismissedAt = Date.now();
  state.lastDismissedVersion = version;

  try {
    await db.versionState.put(state);
  } catch {
    // Fallback to localStorage
    try {
      localStorage.setItem(`meallens:${CONFIG.STORAGE_KEY}`, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save notification state:', error);
    }
  }
}

/**
 * Update last check time
 * @returns {Promise<void>}
 */
async function updateLastCheckTime() {
  const state = await getNotificationState();
  state.lastCheckAt = Date.now();
  
  try {
    await db.versionState.put(state);
  } catch {
    try {
      localStorage.setItem(`meallens:${CONFIG.STORAGE_KEY}`, JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to update check time:', error);
    }
  }
}
