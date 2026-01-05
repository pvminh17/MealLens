import { useLiveQuery } from 'dexie-react-hooks';
import * as storage from '../services/storageService.js';

/**
 * Custom hook for IndexedDB storage operations
 * Provides reactive queries with Dexie live queries
 */

/**
 * Get a setting value
 * @param {string} key - Setting key
 * @returns {any} Setting value (reactive)
 */
export function useSetting(key) {
  return useLiveQuery(() => storage.getSetting(key), [key]);
}

/**
 * Get meals for a specific date
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Array} Meals for the date (reactive)
 */
export function useMealsByDate(date) {
  return useLiveQuery(() => storage.getMealsByDate(date), [date]) || [];
}

/**
 * Get food items for a meal
 * @param {number} mealId - Meal ID
 * @returns {Array} Food items (reactive)
 */
export function useFoodItemsForMeal(mealId) {
  return useLiveQuery(() => storage.getFoodItemsForMeal(mealId), [mealId]) || [];
}

/**
 * Get a single meal by ID
 * @param {number} mealId - Meal ID
 * @returns {object|undefined} Meal object (reactive)
 */
export function useMeal(mealId) {
  return useLiveQuery(() => storage.getMeal(mealId), [mealId]);
}

export default {
  useSetting,
  useMealsByDate,
  useFoodItemsForMeal,
  useMeal
};
