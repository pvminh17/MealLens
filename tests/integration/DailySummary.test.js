import { describe, it, expect, beforeEach } from 'vitest';
import * as storage from '../../src/services/storageService.js';

/**
 * Integration Tests for User Story 4 - Daily Summary
 */

describe('User Story 4 - Daily Summary', () => {
  beforeEach(async () => {
    await storage.clearAllData();
  });

  it('should calculate total calories for the day', async () => {
    const today = new Date().toISOString().split('T')[0];

    // Add multiple meals
    await storage.saveMeal(
      {
        timestamp: Date.now(),
        date: today,
        type: 'Breakfast',
        totalCalories: 300
      },
      [{ name: 'Food', grams: 100, calories: 300, confidence: 'high' }]
    );

    await storage.saveMeal(
      {
        timestamp: Date.now(),
        date: today,
        type: 'Lunch',
        totalCalories: 500
      },
      [{ name: 'Food', grams: 100, calories: 500, confidence: 'high' }]
    );

    await storage.saveMeal(
      {
        timestamp: Date.now(),
        date: today,
        type: 'Dinner',
        totalCalories: 600
      },
      [{ name: 'Food', grams: 100, calories: 600, confidence: 'high' }]
    );

    const meals = await storage.getMealsByDate(today);
    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
    
    expect(totalCalories).toBe(1400);
    expect(meals).toHaveLength(3);
  });

  it('should show zero for days with no meals', async () => {
    const emptyDate = '2026-01-01';
    const meals = await storage.getMealsByDate(emptyDate);
    
    expect(meals).toHaveLength(0);
    
    const totalCalories = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
    expect(totalCalories).toBe(0);
  });
});
