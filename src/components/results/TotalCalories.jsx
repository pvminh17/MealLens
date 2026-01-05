import React from 'react';

/**
 * Total Calories Component
 * Displays sum of all food items' calories
 */
function TotalCalories({ items }) {
  const total = items.reduce((sum, item) => sum + item.calories, 0);

  return (
    <div style={styles.container}>
      <div style={styles.label}>Total Calories</div>
      <div style={styles.value}>{total} kcal</div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    marginTop: '20px'
  },
  label: {
    fontSize: '14px',
    opacity: 0.9,
    marginBottom: '5px'
  },
  value: {
    fontSize: '32px',
    fontWeight: 'bold'
  }
};

export default TotalCalories;
