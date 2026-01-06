import React from 'react';
import { useAppContext } from '../context/AppContext.jsx';

/**
 * Offline Banner Component
 * Shows notification when user is offline
 */
function OfflineBanner() {
  const { isOnline } = useAppContext();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#F39C12',
        color: 'white',
        padding: '10px',
        textAlign: 'center',
        zIndex: 9999,
        fontSize: '14px',
        fontFamily: 'sans-serif'
      }}
    >
      📡 You are offline. AI analysis unavailable. You can still view saved meals.
    </div>
  );
}

export default OfflineBanner;
