import { describe, it, expect } from 'vitest';
import { detectMealType } from '../../src/utils/mealTypeDetector.js';

/**
 * Unit Tests for Meal Type Detector
 */

describe('mealTypeDetector', () => {
  it('should detect Breakfast for morning hours (5-10 AM)', () => {
    const morning1 = new Date('2026-01-05T05:00:00');
    expect(detectMealType(morning1)).toBe('Breakfast');

    const morning2 = new Date('2026-01-05T10:59:00');
    expect(detectMealType(morning2)).toBe('Breakfast');
  });

  it('should detect Lunch for afternoon hours (11 AM - 3:59 PM)', () => {
    const lunch1 = new Date('2026-01-05T11:00:00');
    expect(detectMealType(lunch1)).toBe('Lunch');

    const lunch2 = new Date('2026-01-05T15:59:00');
    expect(detectMealType(lunch2)).toBe('Lunch');
  });

  it('should detect Dinner for evening hours (4 PM - 8:59 PM)', () => {
    const dinner1 = new Date('2026-01-05T16:00:00');
    expect(detectMealType(dinner1)).toBe('Dinner');

    const dinner2 = new Date('2026-01-05T20:59:00');
    expect(detectMealType(dinner2)).toBe('Dinner');
  });

  it('should detect Snack for late night/early morning hours', () => {
    const snack1 = new Date('2026-01-05T21:00:00');
    expect(detectMealType(snack1)).toBe('Snack');

    const snack2 = new Date('2026-01-05T04:59:00');
    expect(detectMealType(snack2)).toBe('Snack');

    const snack3 = new Date('2026-01-05T00:00:00');
    expect(detectMealType(snack3)).toBe('Snack');
  });
});
