import React, { useState, useEffect } from 'react';

/**
 * Image Preview Component
 * Shows captured/uploaded image with retake/confirm buttons
 */
function ImagePreview({ imageBlob, onRetake, onConfirm }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (imageBlob) {
      const url = URL.createObjectURL(imageBlob);
      setImageUrl(url);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [imageBlob]);

  return (
    <div style={styles.container}>
      {imageUrl && (
        <img src={imageUrl} alt="Preview" style={styles.image} />
      )}
      
      <div style={styles.buttonContainer}>
        <button onClick={onRetake} style={styles.retakeButton}>
          🔄 Retake
        </button>
        <button onClick={onConfirm} style={styles.confirmButton}>
          ✓ Confirm
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '70vh',
    objectFit: 'contain'
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    marginBottom: '40px'
  },
  retakeButton: {
    padding: '15px 30px',
    fontSize: '16px',
    backgroundColor: '#666',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  confirmButton: {
    padding: '15px 30px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default ImagePreview;
