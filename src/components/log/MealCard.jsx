import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getFoodItemsForMeal, deleteMeal } from '../../services/storageService.js';
import { useNavigate } from 'react-router-dom';

/**
 * Meal Card Component
 * Displays meal summary with expandable food items
 */
function MealCard({ meal, expanded, onToggleExpand }) {
  const navigate = useNavigate();
  
  // Fetch food items only when expanded
  const foodItems = useLiveQuery(
    () => expanded ? getFoodItemsForMeal(meal.id) : Promise.resolve([]),
    [meal.id, expanded],
    []
  );

  const handleDelete = async () => {
    if (!confirm(`Delete this ${meal.type || 'meal'}?`)) return;

    try {
      await deleteMeal(meal.id);
      // The UI will auto-update via Dexie React hooks
    } catch (error) {
      console.error('Failed to delete meal:', error);
      alert('Failed to delete meal: ' + error.message);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getIcon = (type) => {
    const icons = {
      Breakfast: '🌅',
      Lunch: '🍽️',
      Dinner: '🌙',
      Snack: '🍪'
    };
    return icons[type] || '🍴';
  };

  return (
    <div style={styles.card}>
      <div style={styles.header} onClick={onToggleExpand}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>{getIcon(meal.type)}</span>
          <div>
            <div style={styles.type}>{meal.type || 'Meal'}</div>
            <div style={styles.time}>{formatTime(meal.timestamp)}</div>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.calories}>{meal.totalCalories} kcal</div>
          <div style={styles.expandIcon}>{expanded ? '▼' : '▶'}</div>
        </div>
      </div>

      {expanded && (
        <div style={styles.details}>
          {foodItems.length === 0 ? (
            <div style={styles.loading}>Loading items...</div>
          ) : (
            <div style={styles.itemsList}>
              {foodItems.map((item, index) => (
                <div key={index} style={styles.item}>
                  <span style={styles.itemName}>{item.name}</span>
                  <span style={styles.itemDetails}>
                    {item.grams}g • {item.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={styles.actions}>
            <button onClick={handleDelete} style={styles.deleteButton}>
              🗑️ Delete Meal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    marginBottom: '15px',
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    cursor: 'pointer',
    userSelect: 'none'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  icon: {
    fontSize: '28px'
  },
  type: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2933'
  },
  time: {
    fontSize: '12px',
    color: '#6B7280',
    marginTop: '2px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  calories: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#F39C12'
  },
  expandIcon: {
    fontSize: '14px',
    color: '#6B7280'
  },
  details: {
    borderTop: '1px solid #E5E7EB',
    padding: '15px',
    backgroundColor: '#FAFAFA'
  },
  loading: {
    textAlign: 'center',
    padding: '10px',
    color: '#6B7280',
    fontSize: '14px'
  },
  itemsList: {
    marginBottom: '15px'
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #E5E7EB'
  },
  itemName: {
    fontSize: '14px',
    color: '#1F2933'
  },
  itemDetails: {
    fontSize: '13px',
    color: '#6B7280'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  deleteButton: {
    padding: '8px 15px',
    fontSize: '13px',
    backgroundColor: '#E74C3C',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default MealCard;
