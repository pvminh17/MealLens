# Quickstart: Calorie Counting App - MVP Features

**Feature**: 001-calorie-tracker  
**Date**: 2026-01-05  
**Purpose**: Validate that all implemented features work end-to-end

---

## Prerequisites

Before running this quickstart, ensure:
- ✅ ReactJS PWA is built and deployed (or running locally via `npm run dev`)
- ✅ Modern mobile browser available (iOS Safari 15+, Chrome Android 90+)
- ✅ Valid OpenAI API key (starts with `sk-...`)
- ✅ Sample food photos available for testing (or camera access)

---

## Setup

### 1. Access the App

**Local Development**:
```bash
npm run dev
```
Navigate to: `http://localhost:5173` (or displayed port)

**Production**:
Navigate to: `https://your-domain.com/meallens`

### 2. Configure API Key

1. Tap **Settings** icon (gear icon in top-right)
2. Paste your OpenAI API key into the input field
3. Tap **Save**
4. Verify: "API key saved successfully" message appears

**Expected Result**: API key stored in IndexedDB (encrypted if SubtleCrypto available)

---

## User Story 1: Photo Capture & AI Detection (P1)

### Test 1.1: Capture Photo with Camera

1. From home screen, tap **Take Photo** button
2. Grant camera permission if prompted
3. Point camera at a meal (e.g., rice + chicken)
4. Tap **Capture** button
5. Review preview image
6. Tap **Confirm**

**Expected Result**:
- Camera opens and captures image
- Preview shows captured image with "Retake" and "Confirm" buttons
- After "Confirm", loading indicator appears with "Analyzing photo..." message

### Test 1.2: Upload Photo from Gallery

1. From home screen, tap **Upload Photo** button
2. Grant photo library permission if prompted
3. Select a food photo from gallery
4. Review preview image
5. Tap **Confirm**

**Expected Result**:
- Photo picker opens
- Selected image appears in preview
- After "Confirm", loading indicator appears

### Test 1.3: AI Detection Results

**Wait for AI processing to complete** (5-10 seconds)

**Expected Result**:
- Loading indicator disappears
- List of detected food items appears:
  - Item 1: Name (e.g., "White Rice"), Portion (e.g., "180g"), Calories (e.g., "230 kcal"), Confidence (High/Medium/Low)
  - Item 2: Name (e.g., "Grilled Chicken"), Portion (e.g., "120g"), Calories (e.g., "200 kcal"), Confidence (High/Medium/Low)
- Total calories displayed at bottom: e.g., "Total: 430 kcal"
- Confidence indicators displayed with color coding:
  - High = Green badge
  - Medium = Yellow badge
  - Low = Red badge

### Test 1.4: Retake Photo

1. From capture preview, tap **Retake** button

**Expected Result**:
- Camera reopens for new capture
- Previous image discarded

### Test 1.5: Error Handling - No Food Detected

1. Upload a photo with no food (e.g., empty plate, landscape)
2. Confirm upload

**Expected Result**:
- After AI processing: "No food detected. Try retaking the photo with better lighting or a clearer angle"
- Button to "Try Again" returns to camera/upload screen

---

## User Story 2: Calorie Correction & Editing (P2)

### Test 2.1: Edit Food Item Name

1. Complete Test 1.3 to get AI detection results
2. Tap on a food item (e.g., "White Rice")
3. Edit form appears with name, grams, calories
4. Change name to "Brown Rice"
5. Tap **Save**

**Expected Result**:
- Food item name updates to "Brown Rice" in list
- Total calories recalculated if calorie value changed

### Test 2.2: Adjust Portion Size

1. From edit form (or tap food item again), locate portion slider/input
2. Drag slider or type new value: e.g., change 180g → 200g
3. Observe calories update in real-time
4. Tap **Save**

**Expected Result**:
- Calories recalculate automatically as slider moves (e.g., 180g/230 kcal → 200g/255 kcal)
- Total calories at bottom updates instantly
- Changes persist after save

### Test 2.3: Remove Incorrect Item

1. From detection results, swipe left on a food item (or tap "Remove" icon)
2. Confirm deletion if prompted

**Expected Result**:
- Food item disappears from list
- Total calories decreases by removed item's calories
- If last item removed: "Please add at least one food item before saving" message

### Test 2.4: Validation - Minimum Portion Size

1. Edit a food item
2. Try to set portion size to 0g or negative value
3. Attempt to save

**Expected Result**:
- Validation error: "Portion size must be at least 1g"
- Save button disabled or error message shown
- Value resets to minimum (1g) if entered

---

## User Story 3: Daily Meal Logging (P3)

### Test 3.1: Save Meal to Log

1. Complete Test 1.3 and optionally Test 2.2 (edit items)
2. Tap **Save to Log** button
3. Meal type selection appears: Breakfast, Lunch, Dinner, Snack
4. Select **Lunch**
5. Confirm save

**Expected Result**:
- "Meal saved successfully" message appears
- Redirect to Daily Log screen (or home screen with log button)
- Current timestamp recorded with meal

### Test 3.2: Auto-Detect Meal Type

1. Capture photo at different times of day:
   - 7:00 AM → Should suggest "Breakfast"
   - 12:00 PM → Should suggest "Lunch"
   - 6:00 PM → Should suggest "Dinner"
2. Verify auto-suggestion matches time

**Expected Result**:
- Meal type pre-selected based on current time
- User can override selection

### Test 3.3: View Logged Meal

1. Navigate to **Daily Log** screen (or **Today** tab)
2. Locate the meal just saved

**Expected Result**:
- Meal appears with:
  - Timestamp (e.g., "12:45 PM")
  - Meal type (e.g., "Lunch")
  - Food items list (names + calories)
  - Total calories (e.g., "430 kcal")

### Test 3.4: Multiple Meals Per Day

1. Log 3 different meals (Breakfast, Lunch, Dinner)
2. View Daily Log

**Expected Result**:
- All 3 meals appear in chronological order
- Each meal shows individual calorie count
- No duplicate or missing meals

---

## User Story 4: Daily Calorie Summary (P4)

### Test 4.1: View Daily Total

1. From Daily Log screen, scroll to top
2. Locate **Daily Summary** section

**Expected Result**:
- Total calories displayed: e.g., "Total Today: 1,580 kcal"
- Count of meals: e.g., "3 meals logged"

### Test 4.2: Empty Day

1. Navigate to Daily Log
2. If meals exist, delete all meals (or use a fresh install)

**Expected Result**:
- Summary shows: "0 calories"
- Message: "No meals logged today. Tap 'Take Photo' to get started!"

### Test 4.3: Meal List in Summary

1. Log multiple meals
2. Scroll through Daily Log

**Expected Result**:
- Chronological list of meals:
  - 7:30 AM - Breakfast - 420 kcal
  - 12:45 PM - Lunch - 650 kcal
  - 7:15 PM - Dinner - 510 kcal
- Each item tappable to view/edit details

---

## Offline Mode (PWA Requirement)

### Test 5.1: Install PWA

**iOS Safari**:
1. Tap Share button
2. Tap "Add to Home Screen"
3. Confirm installation

**Chrome Android**:
1. Tap menu (⋮)
2. Tap "Install app" or "Add to Home Screen"
3. Confirm installation

**Expected Result**:
- App icon appears on home screen
- Tapping icon opens app in standalone mode (no browser UI)

### Test 5.2: Offline - View Logged Meals

1. Turn on Airplane Mode (or disable Wi-Fi/cellular)
2. Open MealLens PWA
3. Navigate to Daily Log

**Expected Result**:
- App loads successfully (service worker serves cached assets)
- Previously logged meals are visible
- "You're offline" banner appears at top

### Test 5.3: Offline - AI Analysis Disabled

1. While offline, tap **Take Photo**
2. Capture or upload a photo
3. Tap **Confirm**

**Expected Result**:
- Photo captures successfully
- Message: "You're offline. Go online to analyze photos."
- "Analyze" button disabled or shows "Retry when online"

### Test 5.4: Offline - Edit/Delete Meals

1. While offline, edit a logged meal (change food item portion)
2. Delete a logged meal

**Expected Result**:
- Edits save successfully (IndexedDB works offline)
- Deletions work (no network required)
- Changes persist when coming back online

### Test 5.5: Return Online

1. Turn off Airplane Mode (re-enable network)
2. Capture new photo and analyze

**Expected Result**:
- "You're online" message appears (banner disappears)
- AI analysis works again
- All offline edits still present

---

## Security & Privacy Validation

### Test 6.1: API Key Encryption

1. Open browser DevTools → Application → IndexedDB → MealLensDB → settings
2. Locate `apiKey` record
3. Inspect `value` field

**Expected Result** (if SubtleCrypto supported):
- Value is ArrayBuffer or encrypted blob (not plaintext)
- `encrypted: true` flag present

**Fallback** (if SubtleCrypto unavailable):
- Value is plaintext
- `encrypted: false` flag present
- Console warning: "SubtleCrypto unavailable - API key stored in plaintext"

### Test 6.2: EXIF Metadata Stripping

1. Upload photo with EXIF data (location, camera model, etc.)
2. Monitor network request to OpenAI API (DevTools → Network)
3. Inspect request payload (base64 image data)

**Expected Result**:
- No EXIF metadata in transmitted image
- Use EXIF reader tool on transmitted image: should show "No EXIF data"

### Test 6.3: No Image Storage

1. Capture multiple photos and analyze
2. Open DevTools → Application → IndexedDB → MealLensDB → meals, foodItems
3. Inspect all records

**Expected Result**:
- NO image data in any table
- Only text data: names, numbers, timestamps
- Images exist only in memory during processing

### Test 6.4: API Key Never Logged

1. Open DevTools → Console
2. Perform actions: save API key, analyze photo
3. Search console logs for "sk-"

**Expected Result**:
- NO API key appears in console logs
- Logs show: "API key saved", "Analyzing photo...", "AI response received"
- API key transmitted only to `https://api.openai.com` (check Network tab)

---

## Error Handling Validation

### Test 7.1: Invalid API Key

1. In Settings, enter invalid API key: `sk-invalid-key-123`
2. Capture photo and try to analyze

**Expected Result**:
- Error message: "Invalid API key. Please check your API key in Settings."
- Link/button to Settings screen

### Test 7.2: Rate Limit Exceeded

*Requires exceeding OpenAI rate limit (e.g., 3 requests in 1 minute for free tier)*

1. Analyze 4 photos in quick succession

**Expected Result**:
- First 3 succeed
- 4th shows: "Rate limit exceeded. Please wait a moment and try again."
- Retry button available

### Test 7.3: Network Timeout

*Simulate slow network in DevTools → Network → Throttling → Slow 3G*

1. Capture photo and analyze

**Expected Result**:
- Loading indicator for ~15 seconds
- After timeout: "Request timed out. Check your connection and try again."
- Retry button available

### Test 7.4: Poor Image Quality

1. Upload very dark or blurry photo
2. Analyze

**Expected Result**:
- AI returns results with "Low" confidence indicators
- Message: "Image quality is low. Try retaking with better lighting."
- Results still shown (user can edit)

---

## Performance Validation

### Test 8.1: Image Compression

1. Upload large photo (e.g., 5MB from modern phone camera)
2. Monitor processing time in DevTools → Performance

**Expected Result**:
- Compression completes in <2 seconds
- Output image <500KB
- Max dimension ≤1024px
- UI remains responsive during compression

### Test 8.2: AI Analysis Speed

1. Capture standard meal photo
2. Measure time from "Confirm" to results display

**Expected Result**:
- Total time <10 seconds for typical photo (network-dependent)
- Progress indicator shows status
- User can navigate away or cancel during processing

### Test 8.3: Storage Performance

1. Log 100 meals (script or manual)
2. Navigate to Daily Log for today
3. Measure page load time

**Expected Result**:
- Daily log loads in <100ms
- Scrolling remains smooth (60 fps)
- No noticeable lag when adding/editing meals

---

## Edge Cases

### Test 9.1: Save Meal with No Items

1. Analyze photo → Remove all detected items
2. Try to tap "Save to Log"

**Expected Result**:
- Save button disabled
- Message: "Please add at least one food item before saving"

### Test 9.2: Non-Food Photo

1. Upload photo of non-food object (e.g., car, person)
2. Analyze

**Expected Result**:
- AI returns empty items array OR low-confidence guesses
- Message: "This doesn't appear to be a food photo. Please upload a meal image."

### Test 9.3: Storage Quota Exceeded

*Difficult to test without >50MB of data - simulate by restricting quota in DevTools*

1. Attempt to save meal when quota exceeded

**Expected Result**:
- Error: "Storage full. Delete old meals to free up space."
- Link to Daily Log to delete meals

---

## Success Criteria Validation

Based on [spec.md](spec.md) Success Criteria:

### ✅ SC-001: Photo → Results in <15 seconds
**Test**: Complete Test 1.3 and measure time  
**Pass if**: Total time from capture to results display <15s

### ✅ SC-002: 80% first-time completion rate
**Test**: Observe 5 new users completing full flow without help  
**Pass if**: At least 4/5 complete photo → detection → confirm → save

### ✅ SC-003: Corrections within 30 seconds
**Test**: Complete Test 2.2 and measure edit time  
**Pass if**: Edit 2-3 items in <30s

### ✅ SC-004: Actionable error messages
**Test**: Trigger all errors (Tests 7.1-7.4)  
**Pass if**: Every error shows clear message + next steps (retry, settings link, etc.)

### ✅ SC-005: 90% food detection success
**Test**: Analyze 10 varied food photos  
**Pass if**: At least 9/10 detect ≥1 food item

### ✅ SC-011: AI processing <10s (95th percentile)
**Test**: Analyze 20 photos, measure processing time  
**Pass if**: 19/20 complete in <10s

### ✅ SC-016: Zero data loss for saved meals
**Test**: Save 10 meals, close app, reopen  
**Pass if**: All 10 meals persist correctly with all fields intact

---

## Rollback / Cleanup

### Reset App to Clean State

1. Navigate to **Settings**
2. Scroll to bottom
3. Tap **Delete All Data** button
4. Confirm deletion

**Expected Result**:
- All meals deleted from IndexedDB
- API key deleted
- App resets to initial state (onboarding screen or empty home)

---

## Deployment Checklist

Before marking this feature as complete:

- [ ] All tests in this quickstart pass
- [ ] No console errors during normal usage
- [ ] PWA installability verified on iOS + Android
- [ ] Offline mode works as expected
- [ ] Security validations pass (EXIF stripping, API key encryption, no logging)
- [ ] Performance meets targets (image compression <2s, AI <10s, storage <100ms)
- [ ] Error messages are user-friendly (no technical jargon)
- [ ] Constitution compliance verified (see plan.md)

---

## Next Steps

After completing this quickstart:

1. ✅ If all tests pass → Feature is ready for user acceptance testing
2. ⚠️ If tests fail → Debug failures, fix issues, re-run quickstart
3. 📝 Document any deviations from spec in `plan.md` Complexity Tracking section
4. 🚀 Deploy to production once acceptance criteria met

---

## Support & Debugging

### Common Issues

| Issue | Likely Cause | Solution |
|-------|--------------|----------|
| "API key invalid" | Wrong key or typo | Re-enter key from OpenAI dashboard |
| AI analysis stuck | Network timeout | Check connection, retry |
| Photos not capturing | Camera permission denied | Grant permission in browser settings |
| Offline mode broken | Service worker not registered | Clear cache, rebuild, check console |
| Storage errors | Quota exceeded | Delete old meals or use incognito mode for testing |

### Debug Mode

Enable verbose logging in browser console:
```javascript
localStorage.setItem('DEBUG', 'meallens:*');
```

Logs will show:
- API calls (without keys)
- Storage operations
- Image processing steps
- Service worker events

---

**Quickstart Version**: 1.0  
**Last Updated**: 2026-01-05  
**Validated By**: [Name/Date after successful run]
