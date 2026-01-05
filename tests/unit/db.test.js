import { describe, it, expect, beforeEach } from 'vitest';
import { db, mealsTable, foodItemsTable } from '../../src/db.js';

describe('Database Schema', () => {
  beforeEach(async () => {
    // Clear all tables
    await mealsTable.clear();
    await foodItemsTable.clear();
  });

  it('should initialize Dexie v1 schema', async () => {
    expect(db.verno).toBe(1);
    expect(db.tables).toHaveLength(3);
    
    const tableNames = db.tables.map(t => t.name);
    expect(tableNames).toContain('settings');
    expect(tableNames).toContain('meals');
    expect(tableNames).toContain('foodItems');
  });

  it('should have correct indexes on meals table', () => {
    const mealsSchema = db.table('meals').schema;
    expect(mealsSchema.primKey.name).toBe('id');
    expect(mealsSchema.indexes.some(idx => idx.name === 'timestamp')).toBe(true);
    expect(mealsSchema.indexes.some(idx => idx.name === 'date')).toBe(true);
  });

  it('should have correct indexes on foodItems table', () => {
    const foodItemsSchema = db.table('foodItems').schema;
    expect(foodItemsSchema.primKey.name).toBe('id');
    expect(foodItemsSchema.indexes.some(idx => idx.name === 'mealId')).toBe(true);
  });

  it('should support auto-increment IDs', async () => {
    const meal1Id = await mealsTable.add({
      timestamp: Date.now(),
      date: '2026-01-05',
      totalCalories: 100
    });

    const meal2Id = await mealsTable.add({
      timestamp: Date.now(),
      date: '2026-01-05',
      totalCalories: 200
    });

    expect(meal2Id).toBeGreaterThan(meal1Id);
  });
});
