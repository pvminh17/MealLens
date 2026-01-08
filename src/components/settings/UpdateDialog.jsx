/**
 * UpdateDialog Component
 * Modal dialog with update details and "Update Now" button
 */

export function UpdateDialog({ version, updateUrl, onClose }) {
  const handleUpdate = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    // Platform-specific redirects
    if (isStandalone && isIOS) {
      window.location.href = 'https://apps.apple.com/app/meallens/id123456';
    } else if (isStandalone && isAndroid) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.meallens';
    } else {
      window.location.href = updateUrl;
    }
    
    onClose();
  };

  return (
    <div className="update-dialog-overlay" onClick={onClose}>
      <div className="update-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Update Available</h2>
        <p>Version {version} is now available.</p>
        <p>Update now to get the latest features and improvements.</p>
        <div className="update-dialog-actions">
          <button onClick={onClose} className="button-secondary" type="button">
            Later
          </button>
          <button onClick={handleUpdate} className="button-primary" type="button">
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
