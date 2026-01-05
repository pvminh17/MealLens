# MealLens - AI-Powered Calorie Tracker

A Progressive Web App (PWA) that estimates meal calories from photos using OpenAI Vision API.

## Features

- 📸 **Photo Capture**: Take photos or upload from gallery
- 🤖 **AI Detection**: OpenAI Vision API analyzes food and estimates calories
- ✏️ **Manual Editing**: Adjust portions and correct AI results
- 📊 **Meal Logging**: Save meals to local storage
- 📱 **PWA Support**: Install as mobile app, works offline for viewing meals
- 🔒 **Privacy First**: All data stored locally, API key encrypted

## Tech Stack

- **Frontend**: React 18 + Vite
- **Storage**: IndexedDB (via Dexie.js)
- **AI**: OpenAI GPT-4 Vision API
- **PWA**: Workbox service worker
- **Testing**: Vitest + Playwright

## Setup

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (get one at [platform.openai.com](https://platform.openai.com))

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Configuration

1. Open the app in your browser
2. Go to Settings
3. Enter your OpenAI API key (starts with `sk-`)
4. Start capturing meals!

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Project Structure

```
src/
├── components/          # React UI components
│   ├── camera/         # Photo capture flow
│   ├── results/        # AI detection results
│   ├── editor/         # Food item editing
│   ├── log/            # Meal log and summary
│   ├── settings/       # Settings page
│   └── common/         # Shared components
├── services/           # Business logic
│   ├── aiService.js    # OpenAI API integration
│   ├── imageService.js # Image processing
│   └── storageService.js # IndexedDB operations
├── models/             # Data models (TypeScript)
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── db.js               # Dexie database setup
├── App.jsx             # Main app component
└── main.jsx            # React entry point
```

## Usage

### 1. Capture a Meal

- Tap "Take Photo" to use camera, or "Upload Photo" to select from gallery
- Confirm the photo when ready

### 2. Review AI Detection

- AI will analyze the photo and detect food items
- Each item shows: name, portion size, calories, and confidence level
- Review the total calories

### 3. Edit (Optional)

- Tap any food item to edit name, portion, or calories
- Remove incorrect items
- Add missing items manually

### 4. Save to Log

- Tap "Save" to log the meal
- View all meals in the Meal Log
- See daily calorie summary

## Privacy & Security

- ✅ All data stored locally on your device (IndexedDB)
- ✅ API key encrypted using SubtleCrypto
- ✅ EXIF metadata stripped from photos
- ✅ Images never stored (memory-only during analysis)
- ✅ No backend server, no data collection
- ⚠️ API key only transmitted to OpenAI API (HTTPS)

## Offline Capabilities

- View saved meals offline
- Edit existing meals offline
- AI analysis requires internet connection

## Browser Support

- ✅ iOS Safari 15+
- ✅ Chrome Android 90+
- ✅ Chrome Desktop
- ✅ Firefox Desktop/Android
- ✅ Edge Desktop

## Known Limitations

- AI accuracy depends on image quality and lighting
- Portion sizes are estimates, not exact measurements
- OpenAI API costs apply (user pays for their own usage)
- Maximum image size: 10MB upload, compressed to <500KB before AI

## Contributing

This is a feature implementation for the MealLens project. See `.specify/` for development workflow.

## License

MIT

## Support

For issues or questions, open an issue on GitHub.
