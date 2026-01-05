# Data Model: Calorie Counting App - MVP Features

**Feature**: 001-calorie-tracker  
**Date**: 2026-01-05  
**Status**: Complete

## Overview

This document defines the client-side data model for MealLens PWA. All data is stored locally in IndexedDB (no backend). The model supports:
- API key and user settings storage
- Meal logging with timestamps and calorie tracking
- Food item details with confidence scores
- Efficient querying by date and meal ID
- Schema versioning for future migrations

---

## Entity Relationship Diagram

```
┌─────────────┐
│  Settings   │
│             │
│ - key (PK)  │
│ - value     │
│ - encrypted │
└─────────────┘

┌──────────────────────────────┐
│         Meal                 │
│                              │
│ - id (PK, auto-increment)    │
│ - timestamp (indexed)        │
│ - date (indexed, YYYY-MM-DD) │
│ - type (Breakfast/Lunch...)  │
│ - totalCalories              │
└──────────────┬───────────────┘
               │
               │ 1:N
               │
       ┌───────▼───────────────────────┐
       │       FoodItem                │
       │                               │
       │ - id (PK, auto-increment)     │
       │ - mealId (FK, indexed)        │
       │ - name                        │
       │ - grams                       │
       │ - calories                    │
       │ - confidence (high/med/low)   │
       └───────────────────────────────┘
```

---

## Entity Definitions

### 1. Settings

**Purpose**: Store user preferences and sensitive configuration (API key)

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `key` | string | Primary Key, required | Setting identifier (e.g., "apiKey", "theme") |
| `value` | any | required | Setting value (string, number, boolean, object) |
| `encrypted` | boolean | optional | Whether value is encrypted (for API key) |

**Indexes**: Primary key on `key`

**Example Records**:
```json
{ "key": "apiKey", "value": "sk-...", "encrypted": true }
{ "key": "theme", "value": "light", "encrypted": false }
{ "key": "defaultMealType", "value": "auto", "encrypted": false }
```

**Validation Rules**:
- API key must start with "sk-" (OpenAI format)
- Encrypted values must be ArrayBuffer or base64 string

**Privacy/Security**:
- API key is sensitive (encrypted via SubtleCrypto when possible)
- Never logged or transmitted except to OpenAI API

---

### 2. Meal

**Purpose**: Represents a logged meal with aggregated calorie data

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | number | Primary Key, auto-increment | Unique meal identifier |
| `timestamp` | number | Indexed, required | Unix timestamp (ms) of meal creation |
| `date` | string | Indexed, required | ISO date string (YYYY-MM-DD) for daily aggregation |
| `type` | string | Enum, optional | Meal type: "Breakfast", "Lunch", "Dinner", "Snack" |
| `totalCalories` | number | Required, >= 0 | Sum of all food items' calories |

**Indexes**:
- Primary key on `id`
- Index on `timestamp` (for chronological sorting)
- Index on `date` (for daily summary queries)

**Example Record**:
```json
{
  "id": 42,
  "timestamp": 1704470400000,
  "date": "2026-01-05",
  "type": "Lunch",
  "totalCalories": 650
}
```

**Validation Rules**:
- `timestamp` must be valid Unix timestamp (> 0)
- `date` must match ISO format YYYY-MM-DD
- `type` must be one of: "Breakfast", "Lunch", "Dinner", "Snack", or null
- `totalCalories` must be non-negative number

**Business Rules**:
- `totalCalories` is calculated as sum of linked food items (not manually editable)
- Deleting a meal cascades to delete all linked food items
- `type` can be auto-detected based on timestamp (morning = Breakfast, etc.)

**Migration Strategy** (future versions):
- v1→v2: Add `type` field with default value "unknown"
- v2→v3 (example): Add `notes` field for user comments

---

### 3. FoodItem

**Purpose**: Individual food item detected/edited within a meal

**Attributes**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | number | Primary Key, auto-increment | Unique food item identifier |
| `mealId` | number | Foreign Key, Indexed, required | Reference to parent Meal.id |
| `name` | string | Required, max 100 chars | Food name (e.g., "Grilled Chicken") |
| `grams` | number | Required, >= 1 | Portion size in grams |
| `calories` | number | Required, >= 0 | Calorie value for this portion |
| `confidence` | string | Enum, required | AI confidence: "high", "medium", "low" |

**Indexes**:
- Primary key on `id`
- Index on `mealId` (for efficient meal→items joins)

**Example Record**:
```json
{
  "id": 123,
  "mealId": 42,
  "name": "White Rice",
  "grams": 180,
  "calories": 230,
  "confidence": "high"
}
```

**Validation Rules**:
- `name` must be non-empty string, max 100 characters
- `grams` must be integer >= 1 (minimum portion)
- `calories` must be non-negative number
- `confidence` must be one of: "high", "medium", "low"

**Business Rules**:
- User can edit `name`, `grams`, `calories` after AI detection
- Editing `grams` triggers calorie recalculation if calorie-per-gram ratio is known
- `confidence` is set by AI and not directly editable (reflects original AI accuracy)
- Deleting a food item recalculates parent meal's `totalCalories`

**Referential Integrity**:
- `mealId` must reference existing Meal.id
- Cascade delete: Deleting a Meal deletes all linked FoodItems

---

## Indexing Strategy

### Performance Considerations

| Query Pattern | Index Used | Performance |
|---------------|------------|-------------|
| Get all meals for today | `date` index | O(log n) + O(k) where k = meals today |
| Get meals chronologically | `timestamp` index | O(log n) + O(k) for range |
| Get food items for meal | `mealId` index | O(log n) + O(m) where m = items in meal |
| Get setting by key | Primary key | O(1) |

### Index Maintenance

- Indexes are automatically maintained by IndexedDB
- No manual index rebuilding required
- Compound indexes not needed for MVP (simple queries only)

---

## Schema Versioning (Dexie Migrations)

### Version 1 (Initial Schema)

```javascript
db.version(1).stores({
  settings: 'key',
  meals: '++id, timestamp, date',
  foodItems: '++id, mealId'
});
```

### Version 2 (Add Meal Type Index)

```javascript
db.version(2).stores({
  meals: '++id, timestamp, date, type'  // Add type to indexes
}).upgrade(tx => {
  // Backfill existing meals with type = null
  return tx.meals.toCollection().modify(meal => {
    if (!meal.type) {
      meal.type = null;  // Or auto-detect from timestamp
    }
  });
});
```

### Future Versions (Examples)

**v3: Add user preferences table**
```javascript
db.version(3).stores({
  settings: 'key',
  meals: '++id, timestamp, date, type',
  foodItems: '++id, mealId',
  preferences: '++id'  // New table
});
```

**v4: Add meal notes field** (non-breaking, no migration needed)

---

## Data Size Estimates

### Storage Requirements (per user)

| Entity | Avg Size | 100 Meals | 1000 Meals | Notes |
|--------|----------|-----------|------------|-------|
| Settings | 500 bytes | 500 bytes | 500 bytes | API key + prefs |
| Meal | 100 bytes | 10 KB | 100 KB | Timestamp, date, type, total |
| FoodItem (5/meal) | 80 bytes | 40 KB | 400 KB | Name, grams, calories, confidence |
| **Total** | - | **~50 KB** | **~500 KB** | Well within IndexedDB limits |

### IndexedDB Limits

- **Quota**: Varies by browser (typically 50-100 MB on mobile)
- **This app**: ~500 KB for 1000 meals = 0.5% of minimum quota
- **Scaling**: Can store 10,000+ meals before hitting limits

---

## Data Lifecycle

### Create
1. User captures photo → AI detects food items
2. `FoodItem` records created in memory (not yet persisted)
3. User confirms/edits → Meal + FoodItems saved to IndexedDB atomically

### Read
1. **Daily summary**: Query `meals` by `date` index
2. **Meal details**: Query `meals` by `id`, then `foodItems` by `mealId` index
3. **Settings**: Query `settings` by `key`

### Update
1. **Edit food item**: Update `foodItems` record, recalculate parent `Meal.totalCalories`
2. **Edit meal type**: Update `Meal.type` directly

### Delete
1. **Delete meal**: Cascade delete all linked `foodItems`, then delete `Meal`
2. **Delete food item**: Delete `foodItem`, recalculate parent `Meal.totalCalories`
3. **Factory reset**: Clear all stores (settings, meals, foodItems)

---

## Consistency Rules

### Transactional Updates

Use Dexie transactions for multi-record updates:

```javascript
await db.transaction('rw', db.meals, db.foodItems, async () => {
  const mealId = await db.meals.add({ timestamp, date, type, totalCalories: 0 });
  await db.foodItems.bulkAdd(
    foodItems.map(item => ({ ...item, mealId }))
  );
  const total = foodItems.reduce((sum, item) => sum + item.calories, 0);
  await db.meals.update(mealId, { totalCalories: total });
});
```

### Invariants

- `Meal.totalCalories` MUST equal sum of linked `FoodItem.calories`
- All `FoodItem.mealId` MUST reference existing `Meal.id`
- `Meal.date` MUST be derivable from `Meal.timestamp` (same calendar day)

### Validation Layer

Service layer (`storageService.js`) enforces:
- Foreign key constraints (manual checks before insert/update)
- Data type validation (TypeScript interfaces + runtime checks)
- Business rule enforcement (minimum grams, non-negative calories, etc.)

---

## Privacy & Security

### Sensitive Data

| Field | Classification | Protection |
|-------|----------------|------------|
| Settings.apiKey | Sensitive | Encrypted via SubtleCrypto (AES-GCM) |
| Meal.*, FoodItem.* | Internal | Local to device, not transmitted |

### EXIF Metadata

- Food photos are **never stored** (requirement)
- EXIF metadata stripped before AI analysis (privacy)
- No location or device info persisted

### Data Export/Deletion

- **Export**: Provide JSON export of all meals (future feature)
- **Factory Reset**: `db.delete()` clears all data including API key
- **GDPR Compliance**: User controls 100% of their data (local-only storage)

---

## Summary

The data model is designed for:
- **Simplicity**: 3 tables, clear relationships, minimal abstraction
- **Performance**: Indexed queries for common patterns (date, mealId)
- **Scalability**: Schema versioning supports migrations without breaking changes
- **Security**: Encrypted API key storage, no image/EXIF persistence
- **Compliance**: Aligns with constitution requirements (migrations, privacy, local-first)

**Next Steps**: Define API contracts for AI service integration and component interfaces.
