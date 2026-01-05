import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from './CameraCapture.jsx';
import PhotoUpload from './PhotoUpload.jsx';
import ImagePreview from './ImagePreview.jsx';
import LoadingIndicator from '../common/LoadingIndicator.jsx';
import { processImageForAI } from '../../services/imageService.js';
import { analyzeImage } from '../../services/aiService.js';
import { useAppContext } from '../../context/AppContext.jsx';
import { getDecryptedApiKey } from '../../services/storageService.js';

/**
 * Photo Flow Component
 * Orchestrates: capture/upload → preview → confirm → AI analysis
 */
function PhotoFlow() {
  const [mode, setMode] = useState('select'); // 'select', 'camera', 'preview', 'analyzing'
  const [imageBlob, setImageBlob] = useState(null);
  const [error, setError] = useState(null);
  const { setCurrentMeal, setCurrentImage } = useAppContext();
  const navigate = useNavigate();

  const handleCapture = (blob) => {
    setImageBlob(blob);
    setMode('preview');
  };

  const handleUpload = (file) => {
    setImageBlob(file);
    setMode('preview');
  };

  const handleRetake = () => {
    setImageBlob(null);
    setError(null);
    setMode('select');
  };

  const handleConfirm = async () => {
    setMode('analyzing');
    setError(null);

    try {
      // Get API key
      const apiKey = await getDecryptedApiKey();
      if (!apiKey) {
        throw new Error('No API key configured. Please set up your API key in Settings.');
      }

      // Process image (strip EXIF, compress, convert to base64)
      const base64Image = await processImageForAI(imageBlob);

      // Analyze with OpenAI Vision API
      const foodItems = await analyzeImage(base64Image, apiKey);

      // Save to context and navigate to results
      setCurrentImage(URL.createObjectURL(imageBlob));
      setCurrentMeal({
        foodItems,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0]
      });

      navigate('/results');
    } catch (err) {
      console.error('AI analysis error:', err);
      setError(err.message);
      setMode('preview');
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
  };

  return (
    <div style={styles.container}>
      {mode === 'select' && (
        <div style={styles.selectMode}>
          <h1 style={styles.title}>MealLens</h1>
          <p style={styles.subtitle}>Capture or upload a food photo</p>
          
          <div style={styles.buttonGroup}>
            <button onClick={() => setMode('camera')} style={styles.primaryButton}>
              📸 Take Photo
            </button>
            <PhotoUpload onUpload={handleUpload} onError={handleError} />
          </div>
          
          {error && <div style={styles.error}>⚠️ {error}</div>}
        </div>
      )}

      {mode === 'camera' && (
        <CameraCapture onCapture={handleCapture} onError={handleError} />
      )}

      {mode === 'preview' && imageBlob && (
        <ImagePreview
          imageBlob={imageBlob}
          onRetake={handleRetake}
          onConfirm={handleConfirm}
        />
      )}

      {mode === 'analyzing' && (
        <LoadingIndicator message="Analyzing photo... This may take 5-10 seconds" />
      )}

      {error && mode === 'preview' && (
        <div style={styles.errorOverlay}>
          <div style={styles.errorBox}>
            <p style={styles.errorText}>⚠️ {error}</p>
            <button onClick={() => setError(null)} style={styles.errorButton}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  },
  selectMode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  title: {
    fontSize: '36px',
    color: '#4CAF50',
    marginBottom: '10px',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '40px'
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center'
  },
  primaryButton: {
    padding: '15px 40px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '5px'
  },
  errorOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  },
  errorBox: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '400px',
    textAlign: 'center'
  },
  errorText: {
    fontSize: '16px',
    marginBottom: '20px',
    color: '#333'
  },
  errorButton: {
    padding: '10px 30px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
};

export default PhotoFlow;
