import { describe, it, expect, beforeEach } from 'vitest';
import * as storage from '../../src/services/storageService.js';
import { detectMealType } from '../../src/utils/mealTypeDetector.js';

/**
 * Integration Tests for User Story 3 - Meal Logging
 */

describe('User Story 3 - Meal Logging', () => {
  beforeEach(async () => {
    await storage.clearAllData();
  });

  it('should save meal and retrieve from log', async () => {
    const mealData = {
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Lunch',
      totalCalories: 500
    };

    const foodItems = [
      { name: 'Rice', grams: 200, calories: 260, confidence: 'high' },
      { name: 'Chicken', grams: 150, calories: 240, confidence: 'high' }
    ];

    const mealId = await storage.saveMeal(mealData, foodItems);
    expect(mealId).toBeGreaterThan(0);

    // Retrieve from log
    const meals = await storage.getMealsByDate(mealData.date);
    expect(meals).toHaveLength(1);
    expect(meals[0].type).toBe('Lunch');
    expect(meals[0].totalCalories).toBe(500);
  });

  it('should auto-detect meal type based on time', () => {
    // Morning (7 AM)
    const morning = new Date('2026-01-05T07:00:00');
    expect(detectMealType(morning)).toBe('Breakfast');

    // Afternoon (1 PM)
    const afternoon = new Date('2026-01-05T13:00:00');
    expect(detectMealType(afternoon)).toBe('Lunch');

    // Evening (7 PM)
    const evening = new Date('2026-01-05T19:00:00');
    expect(detectMealType(evening)).toBe('Dinner');

    // Late night (11 PM)
    const lateNight = new Date('2026-01-05T23:00:00');
    expect(detectMealType(lateNight)).toBe('Snack');
  });

  it('should retrieve meals chronologically', async () => {
    const date = '2026-01-05';

    // Create meals at different times
    await storage.saveMeal(
      {
        timestamp: new Date('2026-01-05T13:00:00').getTime(),
        date,
        type: 'Lunch',
        totalCalories: 500
      },
      [{ name: 'Food', grams: 100, calories: 500, confidence: 'high' }]
    );

    await storage.saveMeal(
      {
        timestamp: new Date('2026-01-05T08:00:00').getTime(),
        date,
        type: 'Breakfast',
        totalCalories: 300
      },
      [{ name: 'Food', grams: 100, calories: 300, confidence: 'high' }]
    );

    const meals = await storage.getMealsByDate(date);
    expect(meals).toHaveLength(2);
    expect(meals[0].type).toBe('Breakfast'); // Earlier time
    expect(meals[1].type).toBe('Lunch'); // Later time
  });
});
