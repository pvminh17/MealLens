import React, { useRef } from 'react';

/**
 * Photo Upload Component
 * File input for gallery/photo picker access
 */
function PhotoUpload({ onUpload, onError }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      if (onError) {
        onError('Please select an image file');
      }
      return;
    }
    
    // Validate file size (max 10MB for upload)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      if (onError) {
        onError('Image too large. Maximum size is 10MB.');
      }
      return;
    }
    
    onUpload(file);
  };

  return (
    <div style={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={styles.hiddenInput}
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        style={styles.uploadButton}
      >
        📁 Upload Photo
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px'
  },
  hiddenInput: {
    display: 'none'
  },
  uploadButton: {
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default PhotoUpload;
