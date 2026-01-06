import React, { useState } from 'react';

/**
 * Food Item Editor Component
 * Allows editing of food item name, portion (grams), and calories
 */
function FoodItemEditor({ item, onSave, onCancel }) {
  const [name, setName] = useState(item.name);
  const [grams, setGrams] = useState(item.grams);
  const [calories, setCalories] = useState(item.calories);
  const [errors, setErrors] = useState({});

  // Calculate calorie-per-gram ratio from original item
  const caloriePerGram = item.grams > 0 ? item.calories / item.grams : 0;

  const handleGramsChange = (newGrams) => {
    const gramsNum = parseInt(newGrams, 10) || 1;
    setGrams(gramsNum);
    
    // Auto-recalculate calories based on original ratio
    if (caloriePerGram > 0) {
      const newCalories = Math.round(gramsNum * caloriePerGram);
      setCalories(newCalories);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!name || name.trim().length === 0) {
      newErrors.name = 'Name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    if (grams < 1) {
      newErrors.grams = 'Portion must be at least 1 gram';
    }

    if (calories < 0) {
      newErrors.calories = 'Calories cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...item,
      name: name.trim(),
      grams: parseInt(grams, 10),
      calories: parseInt(calories, 10)
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Edit Food Item</h2>

        <div style={styles.formGroup}>
          <label style={styles.label}>Food Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            placeholder="e.g., White Rice"
            maxLength={100}
          />
          {errors.name && <span style={styles.error}>{errors.name}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Portion (grams)</label>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="1"
              max={Math.max(grams * 2, 500)}
              value={grams}
              onChange={(e) => handleGramsChange(e.target.value)}
              style={styles.slider}
            />
            <input
              type="number"
              min="1"
              value={grams}
              onChange={(e) => handleGramsChange(e.target.value)}
              style={styles.numberInput}
            />
            <span style={styles.unit}>g</span>
          </div>
          {errors.grams && <span style={styles.error}>{errors.grams}</span>}
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Calories</label>
          <input
            type="number"
            min="0"
            value={calories}
            onChange={(e) => setCalories(parseInt(e.target.value, 10) || 0)}
            style={styles.input}
          />
          {errors.calories && <span style={styles.error}>{errors.calories}</span>}
        </div>

        <div style={styles.info}>
          💡 Adjusting portion size will automatically recalculate calories
        </div>

        <div style={styles.actions}>
          <button onClick={onCancel} style={styles.cancelButton}>
            Cancel
          </button>
          <button onClick={handleSave} style={styles.saveButton}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '25px',
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    boxSizing: 'border-box'
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  slider: {
    flex: 1,
    height: '6px'
  },
  numberInput: {
    width: '80px',
    padding: '8px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    textAlign: 'center'
  },
  unit: {
    fontSize: '14px',
    color: '#666',
    minWidth: '15px'
  },
  info: {
    backgroundColor: '#e3f2fd',
    padding: '10px',
    borderRadius: '5px',
    fontSize: '13px',
    color: '#1976d2',
    marginBottom: '20px'
  },
  error: {
    display: 'block',
    color: '#d32f2f',
    fontSize: '12px',
    marginTop: '5px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#9e9e9e',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  saveButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default FoodItemEditor;
