import Dexie from 'dexie';

/**
 * IndexedDB database for MealLens PWA
 * All data stored client-side, no backend required
 */
class MealLensDB extends Dexie {
  constructor() {
    super('MealLensDB');
    
    // Schema version 1
    this.version(1).stores({
      settings: 'key',                     // Primary key: key
      meals: '++id, timestamp, date',      // Auto-increment id, indexed timestamp and date
      foodItems: '++id, mealId'            // Auto-increment id, foreign key mealId
    });
    
    // Schema version 2 - Add version checking support
    this.version(2).stores({
      settings: 'key',
      meals: '++id, timestamp, date',
      foodItems: '++id, mealId',
      versionState: '&key, lastDismissedAt, lastCheckAt'  // Version check state
    });
  }
}

// Export singleton instance
export const db = new MealLensDB();

// Type-safe table references
export const settingsTable = db.table('settings');
export const mealsTable = db.table('meals');
export const foodItemsTable = db.table('foodItems');
export const versionStateTable = db.table('versionState');
