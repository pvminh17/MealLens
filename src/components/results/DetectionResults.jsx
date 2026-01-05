import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import FoodItemCard from './FoodItemCard.jsx';
import TotalCalories from './TotalCalories.jsx';
import { saveMeal } from '../../services/storageService.js';

/**
 * Detection Results Component
 * Displays AI-detected food items with calories and confidence
 */
function DetectionResults() {
  const { currentMeal, currentImage } = useAppContext();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  const { foodItems } = currentMeal;

  // Handle edge case: no food detected
  if (foodItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <h2>No food detected</h2>
          <p>The AI couldn't identify any food in this photo.</p>
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

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Calculate total calories
      const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);

      // Prepare meal data
      const mealData = {
        timestamp: currentMeal.timestamp || Date.now(),
        date: currentMeal.date || new Date().toISOString().split('T')[0],
        type: currentMeal.type || detectMealType(),
        totalCalories
      };

      // Save meal with food items
      await saveMeal(mealData, foodItems);

      // Navigate to success or log page
      alert('✅ Meal saved successfully!');
      navigate('/');
    } catch (err) {
      console.error('Failed to save meal:', err);
      setError(err.message);
      setSaving(false); disabled={saving}>🔄 Retry</button>
        </a>
        <button 
          style={styles.primaryButton} 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '💾 Saving...' : '✓ Confirm & Save'}
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          ⚠️ Failed to save: {error}
        </div>
      )}
  const detectMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Breakfast';
    if (hour >= 11 && hour < 16) return 'Lunch';
    if (hour >= 16 && hour < 21) return 'Dinner';
    return 'Snack';
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
          <FoodItemCard key={index} item={item} index={index} />
        ))}
      </div>

      <TotalCalories items={foodItems} />

      <div style={styles.actions}>
        <a href="/camera" style={styles.link}>
          <button style={styles.secondaryButton}>🔄 Retry</button>
        </a>
        <button style={styles.primaryButton}>✓ Confirm & Save</button>
      </div>
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
   ,
  errorMessage: {
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    color: '#721c24',
    padding: '12px',
    borderRadius: '5px',
    marginTop: '15px',
    textAlign: 'center'
  } cursor: 'pointer',
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
