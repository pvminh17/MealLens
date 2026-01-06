import React from 'react';

/**
 * Daily Summary Component
 * Displays total calories and meal count for the day
 */
function DailySummary({ meals, date }) {
  if (!meals || meals.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <p>No meals logged yet</p>
          <p style={styles.hint}>Start tracking your meals to see your daily summary</p>
        </div>
      </div>
    );
  }

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0);
  const mealCount = meals.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.dateHeader}>{formatDate(date)}</div>
      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.statValue}>{totalCalories}</div>
          <div style={styles.statLabel}>Total Calories</div>
        </div>
        <div style={styles.divider}></div>
        <div style={styles.stat}>
          <div style={styles.statValue}>{mealCount}</div>
          <div style={styles.statLabel}>Meals Logged</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    border: '2px solid #2ECC71',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '25px',
    boxShadow: '0 2px 6px rgba(46, 204, 113, 0.1)'
  },
  dateHeader: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#2ECC71',
    marginBottom: '15px',
    textAlign: 'center'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  stat: {
    textAlign: 'center',
    flex: 1
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1F2933',
    marginBottom: '5px'
  },
  statLabel: {
    fontSize: '13px',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  divider: {
    width: '1px',
    height: '60px',
    backgroundColor: '#E5E7EB'
  },
  emptyState: {
    textAlign: 'center',
    padding: '10px'
  },
  hint: {
    fontSize: '13px',
    color: '#6B7280',
    marginTop: '5px'
  }
};

export default DailySummary;
