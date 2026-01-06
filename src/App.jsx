import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import PhotoFlow from './components/camera/PhotoFlow.jsx';
import DetectionResults from './components/results/DetectionResults.jsx';
import Settings from './components/settings/Settings.jsx';
import MealLogList from './components/log/MealLogList.jsx';

// Home page component
const HomePage = () => (
  <div style={{ padding: '20px', textAlign: 'center', marginTop: '100px' }}>
    <h1 style={{ color: '#2ECC71', fontSize: '48px' }}>MealLens</h1>
    <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '30px' }}>AI-powered calorie tracking from food photos</p>
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
      <a href="/camera" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#2ECC71', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
          📸 Take Photo
        </button>
      </a>
      <a href="/log" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#F39C12', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
          📋 View Log
        </button>
      </a>
      <a href="/settings" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⚙️ Settings
        </button>
      </a>
    </div>
  </div>
);

/**
 * Main App Component
 * Sets up routing and global providers
 */
function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <OfflineBanner />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/camera" element={<PhotoFlow />} />
            <Route path="/results" element={<DetectionResults />} />
            <Route path="/log" element={<MealLogList />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
