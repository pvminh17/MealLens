/**
 * FoodItem entity
 * Purpose: Individual food item detected/edited within a meal
 */

export interface FoodItem {
  id?: number;                        // Auto-increment primary key
  mealId: number;                     // Foreign key to Meal.id
  name: string;                       // Food name (e.g., "Grilled Chicken")
  grams: number;                      // Portion size in grams
  calories: number;                   // Calorie value for this portion
  confidence: 'high' | 'medium' | 'low'; // AI confidence level
}

export interface FoodItemInput {
  mealId?: number;                    // Optional for initial AI results
  name: string;
  grams: number;
  calories: number;
  confidence: 'high' | 'medium' | 'low';
}
