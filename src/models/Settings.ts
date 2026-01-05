/**
 * Settings entity
 * Purpose: Store user preferences and sensitive configuration (API key)
 */

export interface Settings {
  key: string;        // Setting identifier (e.g., "apiKey", "theme")
  value: any;         // Setting value (string, number, boolean, object)
  encrypted?: boolean; // Whether value is encrypted (for API key)
}

export interface SettingsInput {
  key: string;
  value: any;
  encrypted?: boolean;
}
