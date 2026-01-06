import React from 'react';

/**
 * Food Item Card Component
 * Displays individual food item with name, portion, calories, and confidence
 */
function FoodItemCard({ item, index }) {
  const { name, grams, calories, confidence } = item;

  const confidenceColors = {
    high: '#2ECC71',
    medium: '#F39C12',
    low: '#E74C3C'
  };

  const confidenceLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.name}>{name}</h3>
        <span
          style={{
            ...styles.confidenceBadge,
            backgroundColor: confidenceColors[confidence]
          }}
        >
          {confidenceLabels[confidence]}
        </span>
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <span style={styles.label}>Portion:</span>
          <span style={styles.value}>{grams}g</span>
        </div>
        <div style={styles.detailItem}>
          <span style={styles.label}>Calories:</span>
          <span style={styles.value}>{calories} kcal</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  name: {
    fontSize: '18px',
    color: '#1F2933',
    margin: 0
  },
  confidenceBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  details: {
    display: 'flex',
    gap: '20px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px'
  },
  value: {
    fontSize: '16px',
    color: '#1F2933',
    fontWeight: '500'
  }
};

export default FoodItemCard;
