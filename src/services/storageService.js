import { db, settingsTable, mealsTable, foodItemsTable } from '../db.js';

/**
 * Storage Service
 * Encapsulates all IndexedDB operations with validation and business rules
 */

// ============================================
// Settings Operations
// ============================================

/**
 * Get a setting value by key
 * @param {string} key - Setting identifier
 * @returns {Promise<any>} Setting value or undefined if not found
 */
export async function getSetting(key) {
  const setting = await settingsTable.get(key);
  return setting?.value;
}

/**
 * Store or update a setting
 * @param {string} key - Setting identifier
 * @param {any} value - Setting value
 * @param {boolean} encrypted - Whether value is encrypted
 */
export async function setSetting(key, value, encrypted = false) {
  if (!key || typeof key !== 'string') {
    throw new Error('Setting key must be a non-empty string');
  }
  
  // Validate API key format (only for non-encrypted values)
  if (key === 'apiKey' && !encrypted && typeof value === 'string' && !value.startsWith('sk-')) {
    throw new Error('API key must start with "sk-"');
  }
  
  await settingsTable.put({ key, value, encrypted });
}

/**
 * Delete a setting
 * @param {string} key - Setting identifier
 */
export async function deleteSetting(key) {
  await settingsTable.delete(key);
}

// ============================================
// Meal Operations
// ============================================

/**
 * Get a single meal by ID
 * @param {number} id - Meal ID
 * @returns {Promise<object|undefined>} Meal object or undefined
 */
export async function getMeal(id) {
  return await mealsTable.get(id);
}

/**
 * Get all meals for a specific date
 * @param {string} date - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of meal objects
 */
export async function getMealsByDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  
  return await mealsTable
    .where('date')
    .equals(date)
    .sortBy('timestamp');
}

/**
 * Get meals within a date range (inclusive)
 * @param {string} startDate - ISO date string (YYYY-MM-DD)
 * @param {string} endDate - ISO date string (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of meal objects ordered by timestamp
 */
export async function getMealsByDateRange(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    throw new Error('Dates must be in YYYY-MM-DD format');
  }
  
  if (endDate < startDate) {
    throw new Error('End date must be >= start date');
  }
  
  return await mealsTable
    .where('date')
    .between(startDate, endDate, true, true)
    .sortBy('timestamp');
}

/**
 * Save a new meal with associated food items (atomic transaction)
 * @param {object} mealData - Meal data (timestamp, date, type, totalCalories)
 * @param {Array} foodItems - Array of food item data
 * @returns {Promise<number>} Created meal ID
 */
export async function saveMeal(mealData, foodItems) {
  // Validation
  if (!mealData.timestamp || mealData.timestamp <= 0) {
    throw new Error('Invalid timestamp');
  }
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mealData.date)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  
  if (mealData.totalCalories < 0) {
    throw new Error('Total calories must be non-negative');
  }
  
  if (!Array.isArray(foodItems) || foodItems.length === 0) {
    throw new Error('Cannot save meal with 0 food items');
  }
  
  // Validate food items
  foodItems.forEach((item, index) => {
    if (!item.name || item.name.length === 0 || item.name.length > 100) {
      throw new Error(`Food item ${index}: name must be 1-100 characters`);
    }
    if (!item.grams || item.grams < 1) {
      throw new Error(`Food item ${index}: grams must be >= 1`);
    }
    if (item.calories < 0) {
      throw new Error(`Food item ${index}: calories must be non-negative`);
    }
    if (!['high', 'medium', 'low'].includes(item.confidence)) {
      throw new Error(`Food item ${index}: confidence must be high, medium, or low`);
    }
  });
  
  // Atomic transaction
  return await db.transaction('rw', mealsTable, foodItemsTable, async () => {
    // Create meal
    const mealId = await mealsTable.add(mealData);
    
    // Create food items with mealId
    const foodItemsWithMealId = foodItems.map(item => ({
      ...item,
      mealId
    }));
    
    await foodItemsTable.bulkAdd(foodItemsWithMealId);
    
    return mealId;
  });
}

/**
 * Update a food item and recalculate meal total calories
 * @param {number} itemId - Food item ID
 * @param {object} updates - Fields to update (name, grams, calories)
 */
export async function updateFoodItem(itemId, updates) {
  // Validation
  if (updates.name !== undefined && (updates.name.length === 0 || updates.name.length > 100)) {
    throw new Error('Name must be 1-100 characters');
  }
  if (updates.grams !== undefined && updates.grams < 1) {
    throw new Error('Grams must be >= 1');
  }
  if (updates.calories !== undefined && updates.calories < 0) {
    throw new Error('Calories must be non-negative');
  }
  
  await db.transaction('rw', foodItemsTable, mealsTable, async () => {
    // Update food item
    await foodItemsTable.update(itemId, updates);
    
    // Get updated item to find mealId
    const item = await foodItemsTable.get(itemId);
    if (!item) {
      throw new Error('Food item not found');
    }
    
    // Recalculate meal total
    const allItems = await foodItemsTable.where('mealId').equals(item.mealId).toArray();
    const totalCalories = allItems.reduce((sum, i) => sum + i.calories, 0);
    
    await mealsTable.update(item.mealId, { totalCalories });
  });
}

/**
 * Delete a meal and cascade delete all food items
 * @param {number} mealId - Meal ID
 */
export async function deleteMeal(mealId) {
  await db.transaction('rw', mealsTable, foodItemsTable, async () => {
    // Delete all food items for this meal
    await foodItemsTable.where('mealId').equals(mealId).delete();
    
    // Delete meal
    await mealsTable.delete(mealId);
  });
}

/**
 * Delete a food item and recalculate meal total calories
 * @param {number} itemId - Food item ID
 */
export async function deleteFoodItem(itemId) {
  await db.transaction('rw', foodItemsTable, mealsTable, async () => {
    // Get item to find mealId
    const item = await foodItemsTable.get(itemId);
    if (!item) {
      throw new Error('Food item not found');
    }
    
    const mealId = item.mealId;
    
    // Delete item
    await foodItemsTable.delete(itemId);
    
    // Recalculate meal total
    const allItems = await foodItemsTable.where('mealId').equals(mealId).toArray();
    
    if (allItems.length === 0) {
      // If no items left, delete the meal
      await mealsTable.delete(mealId);
    } else {
      const totalCalories = allItems.reduce((sum, i) => sum + i.calories, 0);
      await mealsTable.update(mealId, { totalCalories });
    }
  });
}

/**
 * Get all food items for a meal
 * @param {number} mealId - Meal ID
 * @returns {Promise<Array>} Array of food items
 */
export async function getFoodItemsForMeal(mealId) {
  return await foodItemsTable.where('mealId').equals(mealId).toArray();
}

/**
 * Clear all data (factory reset)
 */
export async function clearAllData() {
  await db.transaction('rw', settingsTable, mealsTable, foodItemsTable, async () => {
    await settingsTable.clear();
    await mealsTable.clear();
    await foodItemsTable.clear();
  });
}

// ============================================
// API Key Encryption (using SubtleCrypto)
// ============================================

/**
 * Encrypt API key using SubtleCrypto
 * @param {string} apiKey - Plain text API key
 * @returns {Promise<{encrypted: string, salt: string}>} Encrypted data
 */
export async function encryptApiKey(apiKey) {
  if (!window.crypto || !window.crypto.subtle) {
    // Fallback: store as plain text if encryption not available
    console.warn('SubtleCrypto not available, storing API key without encryption');
    return { encrypted: apiKey, salt: null };
  }
  
  try {
    // Generate random salt
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from a fixed password (device-specific would be better but complex)
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('meallens-local-encryption-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Encrypt
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      new TextEncoder().encode(apiKey)
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Return as base64
    return {
      encrypted: btoa(String.fromCharCode(...combined)),
      salt: btoa(String.fromCharCode(...salt))
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    return { encrypted: apiKey, salt: null };
  }
}

/**
 * Decrypt API key using SubtleCrypto
 * @param {string} encryptedData - Base64 encrypted data
 * @param {string} salt - Base64 salt
 * @returns {Promise<string>} Decrypted API key
 */
export async function decryptApiKey(encryptedData, salt) {
  if (!salt || !window.crypto || !window.crypto.subtle) {
    // Data was stored as plain text
    return encryptedData;
  }
  
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const saltArray = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Derive key
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('meallens-local-encryption-key'),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Save encrypted API key
 * @param {string} apiKey - Plain text API key
 */
export async function saveEncryptedApiKey(apiKey) {
  // Validate before encryption
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('API key is required');
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('API key must start with "sk-"');
  }
  
  const { encrypted, salt } = await encryptApiKey(apiKey);
  await setSetting('apiKey', encrypted, true);
  if (salt) {
    await setSetting('apiKeySalt', salt, false);
  }
}

/**
 * Get decrypted API key
 * @returns {Promise<string|null>} Decrypted API key or null
 */
export async function getDecryptedApiKey() {
  const encrypted = await getSetting('apiKey');
  if (!encrypted) return null;
  
  const salt = await getSetting('apiKeySalt');
  return await decryptApiKey(encrypted, salt);
}
