/**
 * UpdateBanner Component
 * Non-intrusive banner at top of screen showing update availability
 */

import { useState } from 'react';
import { dismissNotification } from '../../services/versionService';

export function UpdateBanner({ version, onDismiss, onClick }) {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = async (e) => {
    e.stopPropagation();
    await dismissNotification(version);
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <div className="update-banner" onClick={onClick}>
      <div className="update-banner-content">
        <span className="update-icon" aria-hidden="true">🔔</span>
        <span className="update-text">
          New version {version} available! Tap to update.
        </span>
        <button
          className="update-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss update notification"
          type="button"
        >
          ×
        </button>
      </div>
    </div>
  );
}
