import '@testing-library/jest-dom';

// Mock IndexedDB for tests
global.indexedDB = {
  open: () => ({
    result: {},
    onsuccess: null,
    onerror: null
  })
};

// Mock navigator.mediaDevices for camera tests
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: async () => ({
      getTracks: () => [],
      getVideoTracks: () => []
    })
  }
});

// Mock SubtleCrypto for encryption tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: async () => new ArrayBuffer(32),
      decrypt: async () => new ArrayBuffer(32),
      generateKey: async () => ({}),
      exportKey: async () => new ArrayBuffer(32),
      importKey: async () => ({})
    },
    getRandomValues: (arr) => arr
  }
});
