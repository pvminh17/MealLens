import React, { createContext, useContext, useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';
import { useSetting } from '../hooks/useIndexedDB.js';

/**
 * App Context
 * Global state management for settings, online status, and current meal
 */

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const isOnline = useOnlineStatus();
  const apiKey = useSetting('apiKey');
  const [currentMeal, setCurrentMeal] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  const value = {
    isOnline,
    apiKey,
    currentMeal,
    setCurrentMeal,
    currentImage,
    setCurrentImage
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}

export default AppContext;
