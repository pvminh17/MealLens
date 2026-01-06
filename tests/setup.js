import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

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
if (!global.crypto?.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: {
      subtle: {
        encrypt: async () => new ArrayBuffer(32),
        decrypt: async () => new ArrayBuffer(32),
        generateKey: async () => ({}),
        exportKey: async () => new ArrayBuffer(32),
        importKey: async () => ({}),
        digest: async () => new ArrayBuffer(32)
      },
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    }
  });
}
