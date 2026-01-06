import React, { useState } from 'react';

/**
 * Meal Type Picker Component
 * Allows selection of meal type (Breakfast, Lunch, Dinner, Snack)
 */
function MealTypePicker({ value, onChange }) {
  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

  return (
    <div style={styles.container}>
      <label style={styles.label}>Meal Type</label>
      <div style={styles.options}>
        {mealTypes.map((type) => (
          <button
            key={type}
            onClick={() => onChange(type)}
            style={{
              ...styles.option,
              ...(value === type ? styles.optionSelected : {})
            }}
          >
            {getIcon(type)} {type}
          </button>
        ))}
      </div>
    </div>
  );
}

function getIcon(type) {
  const icons = {
    Breakfast: '🌅',
    Lunch: '🍽️',
    Dinner: '🌙',
    Snack: '🍪'
  };
  return icons[type] || '🍴';
}

const styles = {
  container: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#555'
  },
  options: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px'
  },
  option: {
    padding: '12px',
    fontSize: '14px',
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  optionSelected: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50',
    fontWeight: 'bold'
  }
};

export default MealTypePicker;
