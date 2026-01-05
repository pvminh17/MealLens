/**
 * Meal entity
 * Purpose: Represents a logged meal with aggregated calorie data
 */

export interface Meal {
  id?: number;              // Auto-increment primary key
  timestamp: number;        // Unix timestamp (ms) of meal creation
  date: string;            // ISO date string (YYYY-MM-DD) for daily aggregation
  type?: string;           // Meal type: "Breakfast", "Lunch", "Dinner", "Snack"
  totalCalories: number;   // Sum of all food items' calories
}

export interface MealInput {
  timestamp: number;
  date: string;
  type?: string;
  totalCalories: number;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
