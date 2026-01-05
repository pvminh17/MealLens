# Research: Calorie Counting App - MVP Features

**Feature**: 001-calorie-tracker  
**Date**: 2026-01-05  
**Status**: Complete

## Research Scope

This document resolves technical unknowns identified during Technical Context and Constitution Check phases. All research focuses on best practices for the chosen stack: React PWA with OpenAI Vision API, client-side storage, and offline capability.

---

## 1. OpenAI Vision API Integration for Food Detection

### Decision: Use OpenAI GPT-4 Vision API with structured JSON responses

**Rationale**:
- GPT-4 Vision supports image analysis with food detection capability
- Supports structured JSON output mode for reliable parsing
- Widely adopted, well-documented, actively maintained
- User-provided API key model eliminates backend infrastructure costs
- Rate limits (RPM, TPD) are per-user-key, so app can scale without central quota issues

**Implementation Pattern**:
```javascript
// Pseudo-code for API call structure
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Analyze this food photo and return JSON..." },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
    ]
  }],
  response_format: { type: "json_object" },
  max_tokens: 500
});
```

**Prompt Engineering Best Practice**:
- Request specific JSON schema: `{ "items": [{ "name": "string", "grams": number, "calories": number, "confidence": "high"|"medium"|"low" }] }`
- Limit max items (e.g., "Return up to 10 food items")
- Request portion size estimation in grams
- Explicitly ask for confidence scoring
- Handle edge cases: "If no food detected, return empty array"

**Cost Considerations**:
- User pays for their own API usage (transparent, no hidden costs)
- Typical cost: ~$0.01-0.03 per image analysis (based on current GPT-4 Vision pricing)
- Need clear UI messaging about API costs

**Alternatives Considered**:
- Google Cloud Vision API: Lower accuracy for food-specific detection; lacks portion/calorie estimation
- Azure Computer Vision: Similar limitations; less flexible JSON response formatting
- Self-hosted model (TensorFlow.js): Poor accuracy without extensive training data; large model size unsuitable for PWA

---

## 2. Client-Side Image Processing & Compression

### Decision: Use browser-native Canvas API + pica library for high-quality compression

**Rationale**:
- Canvas API is universally supported in modern browsers (iOS Safari 15+, Chrome Android 90+)
- `pica` library provides high-quality Lanczos filtering for resizing (better than default Canvas bicubic)
- Runs synchronously or in Web Worker (non-blocking UI)
- EXIF metadata stripping via `piexifjs` library (privacy requirement)

**Implementation Pattern**:
```javascript
// Pseudo-code for image pipeline
async function processImage(file) {
  // 1. Load image
  const img = await loadImage(file);
  
  // 2. Strip EXIF metadata
  const cleanedBlob = await stripExif(file);
  
  // 3. Resize to max 1024px on longest side
  const resized = await pica.resize(img, canvas, { quality: 3, alpha: false });
  
  // 4. Compress to JPEG/WebP <500KB
  let quality = 0.85;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  while (blob.size > 500 * 1024 && quality > 0.5) {
    quality -= 0.05;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }
  
  // 5. Convert to base64 for OpenAI API
  return blobToBase64(blob);
}
```

**Performance**:
- Typical processing time: 1-2s for 4MB photo on modern mobile device
- Use Web Worker if processing >2s (keeps UI responsive)

**Alternatives Considered**:
- ImageMagick WASM: Overkill for simple resize/compress; large bundle size (~2MB)
- Sharp.js: Node.js-only, doesn't run in browser
- Native Canvas only: Lower quality resizing (no Lanczos filtering)

---

## 3. IndexedDB Best Practices for PWA Storage

### Decision: Use Dexie.js wrapper with versioned schema and indexes

**Rationale**:
- Dexie.js provides clean Promise-based API (vs raw IndexedDB callback hell)
- Built-in schema versioning and migration support
- Supports indexes for efficient querying (e.g., meals by date)
- Well-maintained, widely adopted in PWA community
- Small footprint (~20KB gzipped)

**Schema Design**:
```javascript
const db = new Dexie('MealLensDB');

db.version(1).stores({
  settings: 'key',  // { key: 'apiKey', value: 'sk-...' }
  meals: '++id, timestamp, date',  // Auto-increment ID, indexed timestamp + date
  foodItems: '++id, mealId'  // Auto-increment ID, foreign key to meals
});

// Version 2 migration example (future-proofing)
db.version(2).stores({
  meals: '++id, timestamp, date, type'  // Add meal type index
}).upgrade(tx => {
  return tx.meals.toCollection().modify(meal => {
    meal.type = meal.type || 'unknown';  // Backfill existing data
  });
});
```

**Data Model**:
- `settings`: Key-value store (apiKey, preferences)
- `meals`: { id, timestamp, date, type, totalCalories }
- `foodItems`: { id, mealId, name, grams, calories, confidence }

**Indexing Strategy**:
- Index `meals.timestamp` for chronological queries
- Index `meals.date` for daily aggregation (format: 'YYYY-MM-DD')
- Index `foodItems.mealId` for efficient join queries

**Security**:
- API key encryption: Use SubtleCrypto API if supported, fallback to plaintext with warning
- No PII stored beyond user's own device

**Alternatives Considered**:
- localStorage: 5-10MB limit; synchronous API blocks UI; no indexing/querying
- Raw IndexedDB: Complex callback-based API; error-prone migration handling
- Firebase Firestore: Violates "no backend" requirement; introduces costs

---

## 4. PWA Offline Strategy with Workbox

### Decision: Runtime caching for UI assets + offline fallback for AI features

**Rationale**:
- Workbox is the industry-standard service worker library (backed by Google Chrome team)
- Supports multiple caching strategies: cache-first for static assets, network-first for API calls
- Provides offline fallback page/component patterns
- Vite PWA plugin integrates Workbox seamlessly

**Caching Strategy**:
```javascript
// Workbox config (in vite.config.js PWA plugin)
{
  runtimeCaching: [
    // Static assets: cache-first (shell, components, icons)
    {
      urlPattern: /^https:\/\/your-domain\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }  // 30 days
      }
    },
    // OpenAI API: network-only (never cache AI responses)
    {
      urlPattern: /^https:\/\/api\.openai\.com\/.*/,
      handler: 'NetworkOnly',
      options: {
        networkTimeoutSeconds: 15,
        plugins: [
          {
            handlerDidError: async () => {
              return new Response(JSON.stringify({ error: 'offline' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
        ]
      }
    }
  ]
}
```

**Offline Behavior**:
- **UI**: Fully functional offline (view meals, edit, delete)
- **Camera**: Available offline (capture image, queue for later analysis)
- **AI Analysis**: Disabled offline with clear messaging ("Go online to analyze photos")
- **Fallback**: Show cached meals + "You're offline" banner

**Update Strategy**:
- Service worker checks for updates on app launch
- Prompt user to reload when new version available
- Skip waiting pattern for critical fixes

**Alternatives Considered**:
- Custom service worker: Reinventing the wheel; error-prone; missing edge cases
- No offline support: Violates PWA best practices and user expectations
- Pre-caching everything: Wastes storage; unnecessary for infrequently-used assets

---

## 5. React State Management for PWA

### Decision: React Context API + custom hooks (no Redux/MobX)

**Rationale**:
- App state is simple: current meal being edited, user settings, online/offline status
- React Context API sufficient for prop drilling avoidance
- Custom hooks (`useIndexedDB`, `useOnlineStatus`, `useCamera`) encapsulate logic
- Avoids Redux boilerplate for small-scale app
- State persistence handled by IndexedDB (via Dexie), not in-memory state

**State Architecture**:
```javascript
// AppContext.jsx
const AppContext = createContext({
  settings: null,  // Loaded from IndexedDB on mount
  isOnline: true,  // navigator.onLine + event listeners
  currentMeal: null,  // Meal being edited (before save)
  updateSettings: () => {},
  saveMeal: () => {},
  clearCurrentMeal: () => {}
});

// Custom hooks
function useSettings() {
  const { settings, updateSettings } = useContext(AppContext);
  return { settings, updateSettings };
}

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
}
```

**Why Not Redux**:
- No complex async flows (IndexedDB is Promise-based, handled in services)
- No time-travel debugging needed
- No global state shared across disconnected components (most state is local)

**Alternatives Considered**:
- Zustand: Simpler than Redux but still overkill for this app
- Jotai/Recoil: Atomic state management unnecessary; adds complexity
- Redux Toolkit: Heavy for MVP; learning curve for contributors

---

## 6. Testing Strategy for PWA

### Decision: Vitest + React Testing Library + Playwright

**Rationale**:
- **Vitest**: Fast, Vite-native, ESM-compatible (vs Jest's CommonJS legacy)
- **React Testing Library**: User-centric testing (vs Enzyme's implementation details)
- **Playwright**: Best-in-class E2E with PWA support (install prompts, offline mode testing)

**Test Coverage Priorities** (per constitution):
1. **Security boundaries**: API key storage/retrieval, EXIF stripping
2. **Data migrations**: IndexedDB schema upgrades (test v1→v2 migration)
3. **Regressions**: Bug fixes MUST include failing test first

**Test Structure**:
```
tests/
  unit/
    imageService.test.js       # Image compression, EXIF stripping
    storageService.test.js     # IndexedDB CRUD, migrations
    aiService.test.js          # OpenAI API call formatting (mocked)
  integration/
    PhotoToResults.test.jsx    # Camera → AI → Results flow
    EditAndSave.test.jsx       # Results → Edit → Save to IndexedDB
  e2e/
    pwa-install.spec.js        # PWA installability, manifest
    offline-mode.spec.js       # Offline behavior, service worker
```

**MVP Testing Trade-Off**:
- Unit tests for services (security, data) are REQUIRED (per constitution)
- E2E tests for PWA features are REQUIRED (install, offline)
- Component unit tests MAY be deferred for non-critical UI components
- Integration tests for happy-path user flows RECOMMENDED but not blocking

**Alternatives Considered**:
- Jest: Slower than Vitest; poor ESM support; legacy tech
- Cypress: Less mature PWA support than Playwright
- No E2E tests: Violates offline/PWA testing requirements

---

## 7. Security & Privacy: API Key Handling

### Decision: Encrypt API key with SubtleCrypto API (Web Crypto API)

**Rationale**:
- SubtleCrypto API provides hardware-backed encryption where available
- Key derivation from user-provided passphrase (future enhancement: passphrase on Settings screen)
- Falls back to plaintext storage with clear warning if SubtleCrypto unavailable
- API key never transmitted except to OpenAI API (HTTPS only)

**Implementation Pattern**:
```javascript
async function storeApiKey(apiKey) {
  if (window.crypto && window.crypto.subtle) {
    // Encrypt with AES-GCM
    const key = await deriveKey('default-passphrase');  // TODO: user passphrase
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: generateIV() },
      key,
      new TextEncoder().encode(apiKey)
    );
    await db.settings.put({ key: 'apiKey', value: encrypted, encrypted: true });
  } else {
    // Fallback: plaintext with warning
    await db.settings.put({ key: 'apiKey', value: apiKey, encrypted: false });
    console.warn('SubtleCrypto unavailable - API key stored in plaintext');
  }
}
```

**User Education**:
- Settings screen: "Your API key is stored locally on this device only"
- Privacy notice: "MealLens never transmits your API key to our servers (we don't have servers)"
- Clear button: "Delete API key and all data" (factory reset)

**Alternatives Considered**:
- Plaintext storage only: Poor security posture; user API key at risk if device compromised
- Backend key management: Violates "no backend" requirement; introduces costs/complexity
- OAuth flow: OpenAI doesn't support OAuth for user-generated API keys

---

## Summary of Research Decisions

| Area | Decision | Key Libraries/Tools |
|------|----------|---------------------|
| AI Integration | OpenAI GPT-4 Vision API with structured JSON | `openai` SDK |
| Image Processing | Canvas API + pica for compression, piexifjs for EXIF stripping | `pica`, `piexifjs` |
| Storage | IndexedDB via Dexie.js with versioned schema | `dexie` |
| Offline/PWA | Workbox service worker with runtime caching | `vite-plugin-pwa`, `workbox` |
| State Management | React Context API + custom hooks (no Redux) | React built-ins |
| Testing | Vitest + RTL + Playwright for E2E/PWA tests | `vitest`, `@testing-library/react`, `playwright` |
| Security | SubtleCrypto API for API key encryption | Web Crypto API (native) |

All decisions align with constitution requirements: simple architecture (no backend), secure defaults (encrypted keys, EXIF stripping), scalable foundations (versioned schema, indexed queries), and production-ready patterns (offline support, error handling, testing).

**Next Steps**: Proceed to Phase 1 - Data Model, Contracts, and Quickstart generation.
