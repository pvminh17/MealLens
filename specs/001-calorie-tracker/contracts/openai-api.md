# OpenAI Vision API Contract

**Service**: OpenAI GPT-4 Vision API  
**Purpose**: Analyze food photos and return structured JSON with detected food items, portions, calories, and confidence scores  
**Feature**: 001-calorie-tracker  
**Date**: 2026-01-05

---

## Endpoint

```
POST https://api.openai.com/v1/chat/completions
```

**Authentication**: Bearer token (user-provided API key in Authorization header)

---

## Request Specification

### Headers

```http
Content-Type: application/json
Authorization: Bearer sk-...
```

### Request Body

```json
{
  "model": "gpt-4-vision-preview",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Analyze this food photo. Return a JSON object with an 'items' array. Each item should have: 'name' (string, food name), 'grams' (number, estimated portion in grams), 'calories' (number, estimated calories), 'confidence' (string: 'high', 'medium', or 'low'). Return up to 10 food items. If no food is detected, return an empty array. Example: {\"items\": [{\"name\": \"White Rice\", \"grams\": 180, \"calories\": 230, \"confidence\": \"high\"}]}"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/jpeg;base64,<BASE64_ENCODED_IMAGE>"
          }
        }
      ]
    }
  ],
  "response_format": { "type": "json_object" },
  "max_tokens": 500
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `model` | string | Yes | Model identifier: `gpt-4-vision-preview` or newer |
| `messages[].role` | string | Yes | Always "user" for this use case |
| `messages[].content[].type` | string | Yes | "text" for prompt, "image_url" for image |
| `messages[].content[].text` | string | Conditional | Prompt instructions (required for text type) |
| `messages[].content[].image_url.url` | string | Conditional | Data URI with base64-encoded image (required for image_url type) |
| `response_format.type` | string | Yes | "json_object" to enforce JSON response |
| `max_tokens` | number | No | Token limit for response (500 recommended for this use case) |

### Image Requirements

- **Format**: JPEG or WebP (PNG supported but larger)
- **Encoding**: Base64 in data URI format: `data:image/jpeg;base64,<base64_string>`
- **Max Dimensions**: 1024px longest side (enforced client-side before API call)
- **Max Size**: <500KB after compression (enforced client-side)
- **EXIF Metadata**: Must be stripped before encoding (privacy requirement)

---

## Response Specification

### Success Response (HTTP 200)

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1704470400,
  "model": "gpt-4-vision-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"items\": [{\"name\": \"White Rice\", \"grams\": 180, \"calories\": 230, \"confidence\": \"high\"}, {\"name\": \"Grilled Chicken\", \"grams\": 120, \"calories\": 200, \"confidence\": \"medium\"}]}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 1250,
    "completion_tokens": 85,
    "total_tokens": 1335
  }
}
```

### Parsed Content Schema

The `choices[0].message.content` string should be parsed as JSON with this structure:

```typescript
interface AIResponse {
  items: FoodItem[];
}

interface FoodItem {
  name: string;        // Food name (e.g., "White Rice", "Grilled Chicken")
  grams: number;       // Estimated portion size in grams (integer, >= 1)
  calories: number;    // Estimated calories for this portion (integer, >= 0)
  confidence: "high" | "medium" | "low";  // AI confidence in detection
}
```

### Response Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `items` | array | Array of detected food items (0-10 items) |
| `items[].name` | string | Human-readable food name |
| `items[].grams` | number | Portion size estimate in grams |
| `items[].calories` | number | Calorie estimate for the specified portion |
| `items[].confidence` | enum | Confidence level: "high", "medium", or "low" |

### Edge Cases

**No food detected**:
```json
{
  "items": []
}
```

**Single item**:
```json
{
  "items": [
    {"name": "Banana", "grams": 120, "calories": 105, "confidence": "high"}
  ]
}
```

**Multiple items with varying confidence**:
```json
{
  "items": [
    {"name": "Caesar Salad", "grams": 250, "calories": 350, "confidence": "medium"},
    {"name": "Croutons", "grams": 30, "calories": 120, "confidence": "low"},
    {"name": "Parmesan Cheese", "grams": 15, "calories": 65, "confidence": "medium"}
  ]
}
```

---

## Error Responses

### 401 Unauthorized (Invalid API Key)

```json
{
  "error": {
    "message": "Incorrect API key provided: sk-*****. You can find your API key at https://platform.openai.com/account/api-keys.",
    "type": "invalid_request_error",
    "param": null,
    "code": "invalid_api_key"
  }
}
```

**Client Handling**: Show error "Invalid API key. Please check your API key in Settings."

### 429 Rate Limit Exceeded

```json
{
  "error": {
    "message": "Rate limit reached for requests",
    "type": "rate_limit_error",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

**Client Handling**: Show error "Rate limit exceeded. Please wait a moment and try again."

### 400 Bad Request (Invalid Image)

```json
{
  "error": {
    "message": "Invalid image format or size",
    "type": "invalid_request_error",
    "param": "messages[1].content[1].image_url.url",
    "code": null
  }
}
```

**Client Handling**: Show error "Image format not supported. Please try a different photo."

### 500 Internal Server Error (OpenAI Service Issue)

```json
{
  "error": {
    "message": "The server had an error while processing your request. Sorry about that!",
    "type": "server_error",
    "param": null,
    "code": null
  }
}
```

**Client Handling**: Show error "OpenAI service is temporarily unavailable. Please try again later."

### Network Timeout (No Response)

**Client Handling**: After 15 second timeout, show error "Request timed out. Check your connection and try again."

---

## Client-Side Validation

**Before making API call**, validate:

1. API key exists and starts with "sk-"
2. Image is compressed to <500KB and resized to <=1024px
3. EXIF metadata has been stripped
4. User is online (navigator.onLine === true)
5. Image is in JPEG or WebP format

**After receiving response**, validate:

1. `choices[0].message.content` is valid JSON
2. Parsed JSON has `items` array
3. Each item has required fields: `name`, `grams`, `calories`, `confidence`
4. `grams` is positive integer
5. `calories` is non-negative integer
6. `confidence` is one of: "high", "medium", "low"

**If validation fails**: Log error and show user-friendly message "AI response was invalid. Please try again or report this issue."

---

## Rate Limits & Quotas

| Tier | RPM (Requests Per Minute) | TPD (Tokens Per Day) |
|------|--------------------------|----------------------|
| Free | 3 | 40,000 |
| Pay-as-you-go (Tier 1) | 60 | 1,000,000 |
| Pay-as-you-go (Tier 2+) | Higher | Higher |

**Client Behavior**:
- No rate limiting on client side (user's own quota)
- Display rate limit errors clearly to user
- Suggest user check OpenAI dashboard for quota details

---

## Cost Estimation

**Pricing** (as of 2026-01-05, subject to change):
- GPT-4 Vision: ~$0.01-0.03 per image (varies by token count)

**Token Usage**:
- Typical request: ~1200 tokens (prompt + image encoding)
- Typical response: ~50-150 tokens (depends on food item count)

**User Education**:
- Display in Settings: "Each photo analysis costs ~$0.01-0.03 using your OpenAI API key"
- Link to OpenAI pricing page for current rates

---

## Security & Privacy

### API Key Handling
- API key is user-provided (never MealLens-managed)
- Stored locally in IndexedDB (encrypted via SubtleCrypto)
- Never logged or transmitted except to OpenAI API
- Transmitted via HTTPS only (Authorization header)

### Image Privacy
- Images never stored on device or server
- EXIF metadata (location, device info) stripped before API call
- Image exists only in memory during processing
- Base64 encoding discarded after API response received

### Data Transmission
- Only transmitted to: `https://api.openai.com/v1/chat/completions`
- No intermediate proxies or MealLens servers
- User acknowledges OpenAI's data processing (via privacy notice)

---

## Testing Strategy

### Unit Tests (Mocked API)

```javascript
// Mock successful response
test('parseAIResponse extracts food items correctly', () => {
  const mockResponse = {
    choices: [{
      message: {
        content: '{"items": [{"name": "Apple", "grams": 150, "calories": 80, "confidence": "high"}]}'
      }
    }]
  };
  const result = parseAIResponse(mockResponse);
  expect(result.items).toHaveLength(1);
  expect(result.items[0].name).toBe('Apple');
});

// Mock error response
test('handleAPIError shows user-friendly message for 401', () => {
  const mockError = { response: { status: 401 } };
  const message = handleAPIError(mockError);
  expect(message).toContain('Invalid API key');
});
```

### Integration Tests

```javascript
// Test with real API (requires test API key)
test('AI service analyzes sample food photo', async () => {
  const sampleImage = loadTestImage('sample-meal.jpg');
  const result = await analyzeImage(sampleImage, testApiKey);
  expect(result.items).toBeDefined();
  expect(result.items.length).toBeGreaterThan(0);
});
```

### Contract Tests (Required per Constitution)

- Verify request format matches OpenAI API spec
- Verify response parsing handles all documented edge cases
- Verify error handling for all HTTP status codes
- Verify timeout behavior after 15 seconds

---

## Retry & Fallback Strategy

### Retry Logic

```javascript
async function analyzeImageWithRetry(image, apiKey, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callOpenAI(image, apiKey);
    } catch (error) {
      if (error.status === 429 && attempt < maxRetries) {
        // Rate limit: wait and retry
        await sleep(2000 * (attempt + 1));  // Exponential backoff
        continue;
      }
      if (error.status >= 500 && attempt < maxRetries) {
        // Server error: retry
        await sleep(1000 * (attempt + 1));
        continue;
      }
      throw error;  // Don't retry 4xx errors (except 429)
    }
  }
}
```

### Fallback Behavior

- **Network offline**: Show "Go online to analyze photos" message (no retry)
- **Invalid API key**: Redirect to Settings with error message (no retry)
- **Rate limit exceeded**: Show error + suggest waiting (retry with backoff)
- **Server error**: Retry up to 2 times with exponential backoff

---

## Versioning & Compatibility

### Model Version Strategy

- Use `gpt-4-vision-preview` for MVP
- Monitor OpenAI announcements for stable `gpt-4-vision` release
- Migration path: Update model name in code when stable version available
- No breaking changes expected (JSON response format is stable)

### Backward Compatibility

- Current contract is v1.0
- Future changes MUST maintain backward compatibility or include migration logic
- Breaking changes require user notification + app update

---

## Summary

This contract defines the integration between MealLens PWA and OpenAI Vision API:
- **Input**: Compressed, EXIF-stripped food photo (base64 JPEG/WebP)
- **Output**: Structured JSON with detected food items, portions, calories, confidence
- **Error Handling**: User-friendly messages for all error scenarios
- **Security**: API key encrypted locally, images never stored
- **Cost**: User pays ~$0.01-0.03 per analysis via their own API key

**Compliance**: Aligns with constitution requirements (privacy, security, error handling, versioning).

**Next Contract**: `storageService.contract.md` for IndexedDB operations.
