import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import FoodItemCard from './FoodItemCard.jsx';
import TotalCalories from './TotalCalories.jsx';
import FoodItemEditor from '../editor/FoodItemEditor.jsx';
import RemoveItemButton from '../editor/RemoveItemButton.jsx';
import MealTypePicker from '../log/MealTypePicker.jsx';
import { saveMeal } from '../../services/storageService.js';
import { detectMealType } from '../../utils/mealTypeDetector.js';

/**
 * Detection Results Component
 * Displays AI-detected food items with calories and confidence
 * Supports editing and removing items
 */
function DetectionResults() {
  const { currentMeal, currentImage } = useAppContext();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [foodItems, setFoodItems] = useState(currentMeal?.foodItems || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [mealType, setMealType] = useState(detectMealType());
  const [showMealTypePicker, setShowMealTypePicker] = useState(false);

  if (!currentMeal || !currentMeal.foodItems) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p>No detection results available</p>
          <a href="/camera" style={styles.link}>Take a photo</a>
        </div>
      </div>
    );
  }

  // Handle edge case: no food detected or all items removed
  if (foodItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h2>No food items</h2>
          <p>The AI couldn't identify any food in this photo, or all items were removed.</p>
          <p>Try taking another photo with better lighting or a clearer view of the food.</p>
          <a href="/camera" style={styles.link}>
            <button style={styles.retryButton}>📸 Try Again</button>
          </a>
        </div>
      </div>
    );
  }

  // Check for poor image quality (all items low confidence)
  const allLowConfidence = foodItems.every(item => item.confidence === 'low');

  const handleEditItem = (index) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (updatedItem) => {
    const newItems = [...foodItems];
    newItems[editingIndex] = updatedItem;
    setFoodItems(newItems);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleRemoveItem = (index) => {
    const newItems = foodItems.filter((_, i) => i !== index);
    setFoodItems(newItems);
  };

  const handleSave = async () => {
    if (!showMealTypePicker) {
      // Show meal type picker first
      setShowMealTypePicker(true);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Calculate total calories
      const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);

      // Prepare meal data
      const mealData = {
        timestamp: currentMeal.timestamp || Date.now(),
        date: currentMeal.date || new Date().toISOString().split('T')[0],
        type: mealType,
        totalCalories
      };

      // Save meal with food items
      await saveMeal(mealData, foodItems);

      // Navigate to log page
      navigate('/log');
    } catch (err) {
      console.error('Failed to save meal:', err);
      setError(err.message);
      setSaving(false);
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Detection Results</h1>
        {currentImage && (
          <img src={currentImage} alt="Food" style={styles.thumbnail} />
        )}
      </div>

      {allLowConfidence && (
        <div style={styles.warning}>
          ⚠️ Poor image quality detected. Results may be inaccurate. Consider retaking the photo.
        </div>
      )}

      <div style={styles.itemsList}>
        {foodItems.map((item, index) => (
          <div key={index} style={styles.itemWrapper}>
            <div onClick={() => handleEditItem(index)} style={{ cursor: 'pointer', flex: 1 }}>
              <FoodItemCard item={item} index={index} />
            </div>
            <RemoveItemButton 
              onRemove={() => handleRemoveItem(index)} 
              itemName={item.name}
            />
          </div>
        ))}
      </div>

      <TotalCalories items={foodItems} />

      {showMealTypePicker && (
        <MealTypePicker value={mealType} onChange={setMealType} />
      )}

      <div style={styles.actions}>
        <a href="/camera" style={styles.link}>
          <button style={styles.secondaryButton} disabled={saving}>
            🔄 Retry
          </button>
        </a>
        <button 
          style={styles.primaryButton} 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '💾 Saving...' : showMealTypePicker ? '✓ Save to Log' : '➡️ Continue'}
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          ⚠️ Failed to save: {error}
        </div>
      )}

      {editingIndex !== null && (
        <FoodItemEditor
          item={foodItems[editingIndex]}
          onSave={handleSaveEdit}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '24px',
    color: '#333',
    marginBottom: '15px'
  },
  thumbnail: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '10px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  warning: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffc107',
    color: '#856404',
    padding: '12px',
    borderRadius: '5px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  itemsList: {
    marginBottom: '20px'
  },
  itemWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  link: {
    textDecoration: 'none',
    flex: 1
  },
  primaryButton: {
    flex: 1,
    padding: '15px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  secondaryButton: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
    padding: '12px',
    borderRadius: '5px',
    marginTop: '15px',
    textAlign: 'center',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  retryButton: {
    padding: '15px 30px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default DetectionResults;
