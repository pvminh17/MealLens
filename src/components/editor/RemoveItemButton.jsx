import React, { useState } from 'react';

/**
 * Remove Item Button Component
 * Provides confirmation before removing a food item
 */
function RemoveItemButton({ onRemove, itemName }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onRemove();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  if (showConfirm) {
    return (
      <div style={styles.confirmContainer}>
        <span style={styles.confirmText}>Remove {itemName}?</span>
        <button onClick={handleConfirm} style={styles.confirmButton}>
          Yes
        </button>
        <button onClick={handleCancel} style={styles.cancelButton}>
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleClick} style={styles.removeButton} title="Remove item">
      🗑️
    </button>
  );
}

const styles = {
  removeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px 10px',
    opacity: 0.7,
    transition: 'opacity 0.2s'
  },
  confirmContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '5px'
  },
  confirmText: {
    fontSize: '13px',
    color: '#E74C3C',
    fontWeight: 'bold'
  },
  confirmButton: {
    padding: '5px 15px',
    fontSize: '12px',
    backgroundColor: '#E74C3C',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  cancelButton: {
    padding: '5px 15px',
    fontSize: '12px',
    backgroundColor: '#6B7280',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default RemoveItemButton;
