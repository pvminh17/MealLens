# Storage Service Contract

**Service**: IndexedDB Storage Layer (via Dexie.js)  
**Purpose**: Provide CRUD operations for Settings, Meals, and FoodItems with transactional consistency  
**Feature**: 001-calorie-tracker  
**Date**: 2026-01-05

---

## Service Interface

### Overview

The `storageService` module encapsulates all IndexedDB operations and enforces business rules, validation, and referential integrity. All methods return Promises and handle errors gracefully.

---

## Settings Operations

### `getSetting(key: string): Promise<any>`

**Purpose**: Retrieve a setting value by key

**Parameters**:
- `key` (string, required): Setting identifier (e.g., "apiKey", "theme")

**Returns**: Promise resolving to setting value (any type) or `undefined` if not found

**Example**:
```javascript
const apiKey = await storageService.getSetting('apiKey');
if (apiKey) {
  console.log('API key found');
}
```

**Errors**: Rejects with error if IndexedDB is unavailable

---

### `setSetting(key: string, value: any, encrypted?: boolean): Promise<void>`

**Purpose**: Store or update a setting

**Parameters**:
- `key` (string, required): Setting identifier
- `value` (any, required): Setting value (string, number, boolean, object, or encrypted ArrayBuffer)
- `encrypted` (boolean, optional): Whether value is encrypted (default: false)

**Returns**: Promise resolving when operation complete

**Validation**:
- `key` must be non-empty string
- If `key === 'apiKey'`, validate format starts with "sk-"

**Example**:
```javascript
await storageService.setSetting('theme', 'dark');
await storageService.setSetting('apiKey', encryptedKey, true);
```

**Errors**: Rejects if validation fails or IndexedDB write fails

---

### `deleteSetting(key: string): Promise<void>`

**Purpose**: Remove a setting

**Parameters**:
- `key` (string, required): Setting identifier

**Returns**: Promise resolving when operation complete

**Example**:
```javascript
await storageService.deleteSetting('apiKey');
```

---

## Meal Operations

### `getMeal(id: number): Promise<Meal | undefined>`

**Purpose**: Retrieve a single meal by ID

**Parameters**:
- `id` (number, required): Meal identifier

**Returns**: Promise resolving to Meal object or `undefined` if not found

**Example**:
```javascript
const meal = await storageService.getMeal(42);
console.log(meal.totalCalories);
```

---

### `getMealsByDate(date: string): Promise<Meal[]>`

**Purpose**: Retrieve all meals for a specific date

**Parameters**:
- `date` (string, required): ISO date string (YYYY-MM-DD)

**Returns**: Promise resolving to array of Meal objects (empty array if none found)

**Example**:
```javascript
const todaysMeals = await storageService.getMealsByDate('2026-01-05');
const totalCalories = todaysMeals.reduce((sum, m) => sum + m.totalCalories, 0);
```

**Validation**:
- `date` must match format YYYY-MM-DD

**Performance**: Uses indexed query on `Meal.date` field (O(log n) + O(k) where k = meals on date)

---

### `getMealsByDateRange(startDate: string, endDate: string): Promise<Meal[]>`

**Purpose**: Retrieve meals within a date range (inclusive)

**Parameters**:
- `startDate` (string, required): ISO date string (YYYY-MM-DD)
- `endDate` (string, required): ISO date string (YYYY-MM-DD)

**Returns**: Promise resolving to array of Meal objects ordered by timestamp

**Example**:
```javascript
// Get this week's meals
const meals = await storageService.getMealsByDateRange('2026-01-01', '2026-01-07');
```

**Validation**:
- Both dates must match format YYYY-MM-DD
- `endDate` must be >= `startDate`

---

### `saveMeal(mealData: MealInput, foodItems: FoodItemInput[]): Promise<number>`

**Purpose**: Create a new meal with associated food items (atomic transaction)

**Parameters**:
- `mealData` (object, required):
  - `timestamp` (number, required): Unix timestamp in milliseconds
  - `type` (string, optional): "Breakfast" | "Lunch" | "Dinner" | "Snack" | null
- `foodItems` (array, required): Array of food item objects:
  - `name` (string, required): Food name (max 100 chars)
  - `grams` (number, required): Portion size (integer >= 1)
  - `calories` (number, required): Calorie value (>= 0)
  - `confidence` (string, required): "high" | "medium" | "low"

**Returns**: Promise resolving to created Meal ID (number)

**Validation**:
- `timestamp` must be valid Unix timestamp (> 0)
- `foodItems` must be non-empty array
- Each food item validated per FoodItem constraints
- `totalCalories` calculated automatically from food items

**Transaction Behavior**:
1. Create Meal record with `totalCalories = 0`
2. Create all FoodItem records with `mealId` set to new Meal ID
3. Update Meal.totalCalories to sum of food item calories
4. If any step fails, entire transaction rolls back

**Example**:
```javascript
const mealId = await storageService.saveMeal(
  { timestamp: Date.now(), type: 'Lunch' },
  [
    { name: 'White Rice', grams: 180, calories: 230, confidence: 'high' },
    { name: 'Grilled Chicken', grams: 120, calories: 200, confidence: 'medium' }
  ]
);
console.log('Meal saved with ID:', mealId);
```

**Errors**: Rejects if validation fails or transaction fails

---

### `updateMeal(id: number, updates: Partial<Meal>): Promise<void>`

**Purpose**: Update meal properties (excludes totalCalories - use updateFoodItem instead)

**Parameters**:
- `id` (number, required): Meal identifier
- `updates` (object, required): Fields to update:
  - `type` (string, optional): New meal type

**Returns**: Promise resolving when operation complete

**Validation**:
- `id` must reference existing meal
- `updates.totalCalories` is ignored (calculated from food items)

**Example**:
```javascript
await storageService.updateMeal(42, { type: 'Dinner' });
```

---

### `deleteMeal(id: number): Promise<void>`

**Purpose**: Delete a meal and all associated food items (cascade delete)

**Parameters**:
- `id` (number, required): Meal identifier

**Returns**: Promise resolving when operation complete

**Transaction Behavior**:
1. Delete all FoodItem records where `mealId === id`
2. Delete Meal record
3. If any step fails, entire transaction rolls back

**Example**:
```javascript
await storageService.deleteMeal(42);
```

---

## Food Item Operations

### `getFoodItemsByMeal(mealId: number): Promise<FoodItem[]>`

**Purpose**: Retrieve all food items for a specific meal

**Parameters**:
- `mealId` (number, required): Meal identifier

**Returns**: Promise resolving to array of FoodItem objects (empty array if none found)

**Example**:
```javascript
const items = await storageService.getFoodItemsByMeal(42);
items.forEach(item => console.log(`${item.name}: ${item.calories} kcal`));
```

**Performance**: Uses indexed query on `FoodItem.mealId` field (O(log n) + O(m) where m = items in meal)

---

### `updateFoodItem(id: number, updates: Partial<FoodItem>): Promise<void>`

**Purpose**: Update a food item and recalculate parent meal's total calories

**Parameters**:
- `id` (number, required): FoodItem identifier
- `updates` (object, required): Fields to update:
  - `name` (string, optional): New food name (max 100 chars)
  - `grams` (number, optional): New portion size (integer >= 1)
  - `calories` (number, optional): New calorie value (>= 0)

**Returns**: Promise resolving when operation complete

**Validation**:
- `id` must reference existing food item
- `updates.mealId` cannot be changed (immutable foreign key)
- `updates.confidence` cannot be changed (reflects original AI confidence)

**Transaction Behavior**:
1. Update FoodItem record with new values
2. Recalculate parent Meal.totalCalories (sum of all linked food item calories)
3. If any step fails, transaction rolls back

**Example**:
```javascript
// User corrects portion size
await storageService.updateFoodItem(123, { grams: 200, calories: 255 });
```

**Errors**: Rejects if validation fails or transaction fails

---

### `deleteFoodItem(id: number): Promise<void>`

**Purpose**: Delete a food item and recalculate parent meal's total calories

**Parameters**:
- `id` (number, required): FoodItem identifier

**Returns**: Promise resolving when operation complete

**Transaction Behavior**:
1. Get FoodItem to retrieve `mealId`
2. Delete FoodItem record
3. Recalculate parent Meal.totalCalories
4. If any step fails, transaction rolls back

**Example**:
```javascript
// User removes incorrectly detected item
await storageService.deleteFoodItem(123);
```

---

## Bulk Operations

### `clearAllData(): Promise<void>`

**Purpose**: Factory reset - delete all data (settings, meals, food items)

**Returns**: Promise resolving when operation complete

**Example**:
```javascript
// User taps "Delete All Data" in Settings
await storageService.clearAllData();
```

**Warning**: Irreversible operation - should require user confirmation

---

### `exportData(): Promise<ExportData>`

**Purpose**: Export all data as JSON (future feature for backup/migration)

**Returns**: Promise resolving to object with all settings, meals, food items

**Example**:
```javascript
const backup = await storageService.exportData();
const json = JSON.stringify(backup, null, 2);
downloadFile('meallens-backup.json', json);
```

**Export Format**:
```typescript
interface ExportData {
  version: string;  // Schema version (e.g., "1.0")
  exportDate: string;  // ISO timestamp
  settings: Record<string, any>;
  meals: Meal[];
  foodItems: FoodItem[];
}
```

---

## Error Handling

### Error Types

| Error Type | Cause | Client Handling |
|------------|-------|-----------------|
| `ValidationError` | Invalid input (e.g., negative grams, empty name) | Show field-specific error message |
| `NotFoundError` | Record doesn't exist (e.g., getMeal(999)) | Show "Meal not found" message |
| `DatabaseError` | IndexedDB operation failed | Show "Storage error - please try again" |
| `QuotaExceededError` | Storage quota exceeded | Show "Storage full - delete old meals" |

### Error Response Format

```typescript
interface StorageError extends Error {
  type: 'validation' | 'notFound' | 'database' | 'quotaExceeded';
  message: string;
  field?: string;  // For validation errors
}
```

### Example Error Handling

```javascript
try {
  await storageService.saveMeal(mealData, foodItems);
} catch (error) {
  if (error.type === 'validation') {
    showFieldError(error.field, error.message);
  } else if (error.type === 'quotaExceeded') {
    showAlert('Storage full. Delete old meals to free up space.');
  } else {
    showAlert('Failed to save meal. Please try again.');
  }
}
```

---

## Performance Guarantees

| Operation | Time Complexity | Performance Goal |
|-----------|----------------|------------------|
| `getSetting(key)` | O(1) | <10ms |
| `getMealsByDate(date)` | O(log n + k) | <50ms for typical day (k=10 meals) |
| `getFoodItemsByMeal(mealId)` | O(log n + m) | <20ms for typical meal (m=5 items) |
| `saveMeal(...)` | O(m) | <100ms for typical meal (m=5 items) |
| `deleteMeal(id)` | O(m) | <100ms for typical meal (m=5 items) |

**Assumptions**:
- n = total records in table
- k = meals matching query
- m = food items in meal
- IndexedDB indexes properly utilized
- Modern mobile device (2020+)

---

## Schema Migrations

### Migration Strategy

Dexie.js handles schema versioning automatically. The `storageService` defines upgrade functions:

```javascript
db.version(1).stores({
  settings: 'key',
  meals: '++id, timestamp, date',
  foodItems: '++id, mealId'
});

db.version(2).stores({
  meals: '++id, timestamp, date, type'
}).upgrade(tx => {
  return tx.meals.toCollection().modify(meal => {
    meal.type = meal.type || null;
  });
});
```

### Backward Compatibility

- New fields are optional (default values provided in upgrade)
- Existing data is backfilled with safe defaults
- Old app versions can read new schema (ignore unknown fields)

---

## Testing Contract

### Unit Tests (Required per Constitution)

```javascript
describe('storageService', () => {
  test('saveMeal enforces non-empty food items', async () => {
    await expect(
      storageService.saveMeal({ timestamp: Date.now() }, [])
    ).rejects.toThrow('Food items cannot be empty');
  });

  test('saveMeal calculates totalCalories correctly', async () => {
    const mealId = await storageService.saveMeal(
      { timestamp: Date.now(), type: 'Lunch' },
      [
        { name: 'Rice', grams: 100, calories: 130, confidence: 'high' },
        { name: 'Chicken', grams: 80, calories: 160, confidence: 'high' }
      ]
    );
    const meal = await storageService.getMeal(mealId);
    expect(meal.totalCalories).toBe(290);
  });

  test('deleteFoodItem recalculates parent meal calories', async () => {
    const mealId = await storageService.saveMeal(
      { timestamp: Date.now() },
      [
        { name: 'A', grams: 100, calories: 100, confidence: 'high' },
        { name: 'B', grams: 100, calories: 200, confidence: 'high' }
      ]
    );
    const items = await storageService.getFoodItemsByMeal(mealId);
    await storageService.deleteFoodItem(items[0].id);
    const meal = await storageService.getMeal(mealId);
    expect(meal.totalCalories).toBe(200);
  });
});
```

### Integration Tests

```javascript
test('full meal lifecycle', async () => {
  // Create meal
  const mealId = await storageService.saveMeal(...);
  
  // Retrieve meal
  const meal = await storageService.getMeal(mealId);
  expect(meal).toBeDefined();
  
  // Update food item
  const items = await storageService.getFoodItemsByMeal(mealId);
  await storageService.updateFoodItem(items[0].id, { grams: 150 });
  
  // Verify totalCalories updated
  const updated = await storageService.getMeal(mealId);
  expect(updated.totalCalories).toBeGreaterThan(meal.totalCalories);
  
  // Delete meal
  await storageService.deleteMeal(mealId);
  const deleted = await storageService.getMeal(mealId);
  expect(deleted).toBeUndefined();
});
```

### Migration Tests (Required per Constitution)

```javascript
test('v1 to v2 migration adds type field', async () => {
  // Insert v1 meal (no type field)
  await db.meals.add({ timestamp: Date.now(), date: '2026-01-05', totalCalories: 500 });
  
  // Run migration
  await db.version(2).upgrade();
  
  // Verify type field exists with default value
  const meal = await db.meals.toCollection().first();
  expect(meal.type).toBeNull();
});
```

---

## Security & Privacy

### Data Classification

| Table | Classification | Protection |
|-------|----------------|------------|
| Settings (apiKey) | Sensitive | Encrypted via SubtleCrypto (AES-GCM) |
| Settings (other) | Internal | No encryption needed |
| Meals | Internal | Local to device, not transmitted |
| FoodItems | Internal | Local to device, not transmitted |

### Sensitive Data Handling

- API key is encrypted before storage (if SubtleCrypto available)
- No PII beyond user's own device (single-user app)
- No food photos stored (requirement)
- EXIF metadata stripped before any processing

### Logging

- NO logging of API keys or encrypted values
- Log only non-sensitive operations: "Meal saved", "Food item updated"
- Error logs must not include sensitive field values

---

## Summary

The `storageService` contract defines:
- **CRUD operations** for Settings, Meals, FoodItems
- **Transactional consistency** for multi-record updates
- **Validation** of business rules (portion sizes, calorie calculations)
- **Performance** guarantees for indexed queries
- **Error handling** with typed errors and user-friendly messages
- **Migrations** with backward compatibility

**Compliance**: Aligns with constitution requirements (data migrations, security, privacy, testing).

**Next Contract**: `imageService.contract.md` for client-side image processing.
