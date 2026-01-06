import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDecryptedApiKey,
  saveEncryptedApiKey,
  deleteSetting,
  clearAllData
} from '../../services/storageService.js';

/**
 * Settings Page Component
 * API key management and app preferences
 */
function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const key = await getDecryptedApiKey();
      if (key) {
        setApiKey(key);
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setMessage(null);

    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter an API key' });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      setMessage({ type: 'error', text: 'Invalid API key format. Key must start with "sk-"' });
      return;
    }

    try {
      await saveEncryptedApiKey(apiKey);
      setMessage({ type: 'success', text: 'API key saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to save API key: ${error.message}` });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSetting('apiKey');
      await deleteSetting('apiKeySalt');
      setApiKey('');
      setMessage({ type: 'success', text: 'API key deleted' });
      setShowDeleteConfirm(false);
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to delete API key: ${error.message}` });
    }
  };

  const handleFactoryReset = async () => {
    if (window.confirm('⚠️ This will delete ALL data including meals and settings. Are you sure?')) {
      try {
        await clearAllData();
        setApiKey('');
        setMessage({ type: 'success', text: 'All data deleted. App reset complete.' });
        setTimeout(() => navigate('/'), 2000);
      } catch (error) {
        setMessage({ type: 'error', text: `Factory reset failed: ${error.message}` });
      }
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Settings</h1>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>OpenAI API Key</h2>
        <p style={styles.description}>
          Your API key is stored locally and encrypted. It's never transmitted except to OpenAI.
        </p>

        <div style={styles.inputGroup}>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={styles.input}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            style={styles.toggleButton}
          >
            {showKey ? '🙈 Hide' : '👁️ Show'}
          </button>
        </div>

        <div style={styles.buttonGroup}>
          <button onClick={handleSave} style={styles.primaryButton}>
            💾 Save API Key
          </button>
          {apiKey && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={styles.dangerButton}
            >
              🗑️ Delete Key
            </button>
          )}
        </div>

        {showDeleteConfirm && (
          <div style={styles.confirmBox}>
            <p>Delete API key?</p>
            <div style={styles.confirmButtons}>
              <button onClick={handleDelete} style={styles.confirmYes}>
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={styles.confirmNo}
              >
                No
              </button>
            </div>
          </div>
        )}

        <div style={styles.helpText}>
          <p>📝 Get an API key at <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" style={styles.link}>platform.openai.com</a></p>
          <p>💰 You pay for your own OpenAI usage (~$0.01-0.03 per photo)</p>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Privacy</h2>
        <ul style={styles.privacyList}>
          <li>✅ All data stored locally on your device</li>
          <li>✅ API key encrypted using browser crypto</li>
          <li>✅ EXIF metadata stripped from photos</li>
          <li>✅ Images never stored (memory-only during analysis)</li>
          <li>✅ No backend server, no data collection</li>
        </ul>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Danger Zone</h2>
        <button onClick={handleFactoryReset} style={styles.dangerButton}>
          ⚠️ Factory Reset (Delete All Data)
        </button>
        <p style={styles.warningText}>
          This will permanently delete all meals, settings, and your API key.
        </p>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            backgroundColor: message.type === 'success' ? '#D5F5E3' : '#FADBD8',
            color: message.type === 'success' ? '#1E8449' : '#E74C3C'
          }}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px',
    gap: '15px'
  },
  backButton: {
    padding: '8px 15px',
    backgroundColor: '#FAFAFA',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  title: {
    fontSize: '28px',
    color: '#1F2933',
    margin: 0
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#1F2933',
    marginTop: 0,
    marginBottom: '10px'
  },
  description: {
    color: '#6B7280',
    fontSize: '14px',
    marginBottom: '15px'
  },
  inputGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '5px',
    fontFamily: 'monospace'
  },
  toggleButton: {
    padding: '12px 20px',
    backgroundColor: '#FAFAFA',
    border: '1px solid #E5E7EB',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  primaryButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#2ECC71',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  dangerButton: {
    padding: '12px 20px',
    fontSize: '16px',
    backgroundColor: '#E74C3C',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '100%'
  },
  confirmBox: {
    backgroundColor: '#FEF3E2',
    padding: '15px',
    borderRadius: '5px',
    marginTop: '10px'
  },
  confirmButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  confirmYes: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#E74C3C',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  confirmNo: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#6B7280',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  helpText: {
    marginTop: '15px',
    fontSize: '14px',
    color: '#6B7280'
  },
  link: {
    color: '#2ECC71',
    textDecoration: 'none'
  },
  privacyList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  warningText: {
    fontSize: '14px',
    color: '#6B7280',
    marginTop: '10px'
  },
  message: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '15px 30px',
    borderRadius: '5px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    zIndex: 9999,
    maxWidth: '90%',
    textAlign: 'center'
  }
};

export default Settings;
