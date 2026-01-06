/**
 * Meal Type Detector Utility
 * Auto-detects meal type based on current time
 */

/**
 * Detect meal type based on time of day
 * @param {Date} date - Date object (defaults to current time)
 * @returns {string} Meal type: Breakfast, Lunch, Dinner, or Snack
 */
export function detectMealType(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return 'Breakfast';
  } else if (hour >= 11 && hour < 16) {
    return 'Lunch';
  } else if (hour >= 16 && hour < 21) {
    return 'Dinner';
  } else {
    return 'Snack';
  }
}

export default { detectMealType };
