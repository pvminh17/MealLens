import React, { useEffect } from 'react';
import { useCamera } from '../../hooks/useCamera.js';

/**
 * Camera Capture Component
 * Displays live camera feed and capture button
 */
function CameraCapture({ onCapture, onError }) {
  const { videoRef, isActive, error, startCamera, stopCamera, capturePhoto } = useCamera();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const handleCapture = async () => {
    try {
      const photoBlob = await capturePhoto();
      onCapture(photoBlob);
    } catch (err) {
      if (onError) {
        onError(err.message);
      }
    }
  };

  return (
    <div style={styles.container}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={styles.video}
      />
      
      {isActive && (
        <button onClick={handleCapture} style={styles.captureButton}>
          📸 Capture
        </button>
      )}
      
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  video: {
    width: '100%',
    maxWidth: '600px',
    height: 'auto'
  },
  captureButton: {
    position: 'absolute',
    bottom: '40px',
    padding: '15px 30px',
    fontSize: '18px',
    backgroundColor: '#2ECC71',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    position: 'absolute',
    top: '20px',
    padding: '10px 20px',
    backgroundColor: '#E74C3C',
    color: 'white',
    borderRadius: '5px'
  }
};

export default CameraCapture;
