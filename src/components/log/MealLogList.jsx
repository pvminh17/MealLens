import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getMealsByDate } from '../../services/storageService.js';
import MealCard from './MealCard.jsx';
import DailySummary from './DailySummary.jsx';

/**
 * Meal Log List Component
 * Displays chronological list of today's meals
 */
function MealLogList() {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Fetch meals for selected date using Dexie React hooks
  const meals = useLiveQuery(
    () => getMealsByDate(selectedDate),
    [selectedDate],
    []
  );

  const [expandedMealId, setExpandedMealId] = useState(null);

  const handleToggleExpand = (mealId) => {
    setExpandedMealId(expandedMealId === mealId ? null : mealId);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Meal Log</h1>

      <div style={styles.dateSelector}>
        <label style={styles.dateLabel}>Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.dateInput}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <DailySummary meals={meals} date={selectedDate} />

      {!meals ? (
        <div style={styles.loading}>Loading...</div>
      ) : meals.length === 0 ? (
        <div style={styles.emptyState}>
          <p>📝 No meals logged for {selectedDate}</p>
          <a href="/camera" style={styles.link}>
            <button style={styles.addButton}>➕ Add First Meal</button>
          </a>
        </div>
      ) : (
        <div style={styles.mealsList}>
          {meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              expanded={expandedMealId === meal.id}
              onToggleExpand={() => handleToggleExpand(meal.id)}
            />
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <a href="/camera" style={styles.link}>
          <button style={styles.addButton}>➕ Add Meal</button>
        </a>
        <a href="/" style={styles.link}>
          <button style={styles.homeButton}>🏠 Home</button>
        </a>
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
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center'
  },
  dateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    padding: '10px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  dateLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555'
  },
  dateInput: {
    flex: 1,
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '5px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  mealsList: {
    marginBottom: '20px'
  },
  footer: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px'
  },
  link: {
    textDecoration: 'none',
    flex: 1
  },
  addButton: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  homeButton: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default MealLogList;
