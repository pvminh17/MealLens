import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import { UpdateBanner } from './components/common/UpdateBanner.jsx';
import { UpdateDialog } from './components/settings/UpdateDialog.jsx';
import { checkForUpdates } from './services/versionService.js';
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
      <Link to="/camera" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#2ECC71', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
          📸 Take Photo
        </button>
      </Link>
      <Link to="/log" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#F39C12', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
          📋 View Log
        </button>
      </Link>
      <Link to="/settings" style={{ textDecoration: 'none' }}>
        <button style={{ padding: '15px 40px', fontSize: '18px', backgroundColor: '#6B7280', color: 'white', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold' }}>
          ⚙️ Settings
        </button>
      </Link>
    </div>
  </div>
);

/**
 * Main App Component
 * Sets up routing and global providers
 */
function App() {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  // T023: Check for updates on mount
  useEffect(() => {
    checkForUpdates()
      .then(result => {
        if (result.shouldShowNotification) {
          setUpdateInfo({
            version: result.latestVersion,
            updateUrl: result.updateUrl
          });
        }
      })
      .catch(err => {
        console.warn('Version check failed:', err);
      });
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter basename={"/MealLens"}>
          {/* T024: Conditional UpdateBanner rendering */}
          {updateInfo && (
            <UpdateBanner
              version={updateInfo.version}
              onDismiss={() => setUpdateInfo(null)}
              onClick={() => setShowDialog(true)}
            />
          )}
          
          {/* T025: Conditional UpdateDialog rendering */}
          {showDialog && updateInfo && (
            <UpdateDialog
              version={updateInfo.version}
              updateUrl={updateInfo.updateUrl}
              onClose={() => setShowDialog(false)}
            />
          )}
          
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
