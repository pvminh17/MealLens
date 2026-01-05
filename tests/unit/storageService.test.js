import { describe, it, expect, beforeEach } from 'vitest';
import * as storage from '../../src/services/storageService.js';
import { db } from '../../src/db.js';

describe('StorageService - Settings', () => {
  beforeEach(async () => {
    await storage.clearAllData();
  });

  it('should save and retrieve a setting', async () => {
    await storage.setSetting('theme', 'dark');
    const value = await storage.getSetting('theme');
    expect(value).toBe('dark');
  });

  it('should validate API key format', async () => {
    await expect(
      storage.setSetting('apiKey', 'invalid-key')
    ).rejects.toThrow('API key must start with "sk-"');
  });

  it('should delete a setting', async () => {
    await storage.setSetting('theme', 'dark');
    await storage.deleteSetting('theme');
    const value = await storage.getSetting('theme');
    expect(value).toBeUndefined();
  });
});

describe('StorageService - Meals', () => {
  beforeEach(async () => {
    await storage.clearAllData();
  });

  it('should save a meal with food items atomically', async () => {
    const mealData = {
      timestamp: Date.now(),
      date: '2026-01-05',
      type: 'Lunch',
      totalCalories: 450
    };

    const foodItems = [
      { name: 'Rice', grams: 180, calories: 230, confidence: 'high' },
      { name: 'Chicken', grams: 120, calories: 220, confidence: 'medium' }
    ];

    const mealId = await storage.saveMeal(mealData, foodItems);
    expect(mealId).toBeGreaterThan(0);

    const items = await storage.getFoodItemsForMeal(mealId);
    expect(items).toHaveLength(2);
    expect(items[0].mealId).toBe(mealId);
  });

  it('should reject meal with 0 food items', async () => {
    const mealData = {
      timestamp: Date.now(),
      date: '2026-01-05',
      totalCalories: 0
    };

    await expect(
      storage.saveMeal(mealData, [])
    ).rejects.toThrow('Cannot save meal with 0 food items');
  });

  it('should get meals by date', async () => {
    const mealData = {
      timestamp: Date.now(),
      date: '2026-01-05',
      totalCalories: 450
    };

    const foodItems = [
      { name: 'Rice', grams: 180, calories: 450, confidence: 'high' }
    ];

    await storage.saveMeal(mealData, foodItems);
    await storage.saveMeal(mealData, foodItems);

    const meals = await storage.getMealsByDate('2026-01-05');
    expect(meals).toHaveLength(2);
  });

  it('should delete meal and cascade delete food items', async () => {
    const mealData = {
      timestamp: Date.now(),
      date: '2026-01-05',
      totalCalories: 450
    };

    const foodItems = [
      { name: 'Rice', grams: 180, calories: 450, confidence: 'high' }
    ];

    const mealId = await storage.saveMeal(mealData, foodItems);
    await storage.deleteMeal(mealId);

    const meal = await storage.getMeal(mealId);
    expect(meal).toBeUndefined();

    const items = await storage.getFoodItemsForMeal(mealId);
    expect(items).toHaveLength(0);
  });

  it('should update food item and recalculate meal total', async () => {
    const mealData = {
      timestamp: Date.now(),
      date: '2026-01-05',
      totalCalories: 450
    };

    const foodItems = [
      { name: 'Rice', grams: 180, calories: 230, confidence: 'high' },
      { name: 'Chicken', grams: 120, calories: 220, confidence: 'medium' }
    ];

    const mealId = await storage.saveMeal(mealData, foodItems);
    const items = await storage.getFoodItemsForMeal(mealId);

    // Update first item's calories
    await storage.updateFoodItem(items[0].id, { calories: 300 });

    const updatedMeal = await storage.getMeal(mealId);
    expect(updatedMeal.totalCalories).toBe(520); // 300 + 220
  });
});

describe('StorageService - API Key Encryption', () => {
  beforeEach(async () => {
    await storage.clearAllData();
  });

  it('should encrypt and decrypt API key', async () => {
    const originalKey = 'sk-test123456789';
    
    const { encrypted, salt } = await storage.encryptApiKey(originalKey);
    expect(encrypted).not.toBe(originalKey);
    
    if (salt) {
      const decrypted = await storage.decryptApiKey(encrypted, salt);
      expect(decrypted).toBe(originalKey);
    }
  });

  it('should save and retrieve encrypted API key', async () => {
    const apiKey = 'sk-test123456789';
    await storage.saveEncryptedApiKey(apiKey);
    
    const retrieved = await storage.getDecryptedApiKey();
    expect(retrieved).toBe(apiKey);
  });
});
