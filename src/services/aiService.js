import OpenAI from 'openai';

/**
 * AI Service
 * OpenAI Vision API integration for food detection and calorie estimation
 */

/**
 * Analyze food image using OpenAI Vision API
 * @param {string} base64Image - Base64 encoded image
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Array>} Array of food items with name, grams, calories, confidence
 */
export async function analyzeImage(base64Image, apiKey) {
  if (!apiKey) {
    throw new Error('API key is required. Please configure it in Settings.');
  }

  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid API key format. Key must start with "sk-".');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  const prompt = `Analyze this food photo. Return a JSON object with an 'items' array. Each item should have: 'name' (string, food name), 'grams' (number, estimated portion in grams), 'calories' (number, estimated calories), 'confidence' (string: 'high', 'medium', or 'low'). Return up to 10 food items. If no food is detected, return an empty array. Example: {"items": [{"name": "White Rice", "grams": 180, "calories": 230, "confidence": "high"}]}`;

  try {
    const response = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 500
      }),
      // 30 second timeout
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000)
      )
    ]);

    return parseAIResponse(response);
  } catch (error) {
    throw handleAIError(error);
  }
}

/**
 * Parse OpenAI API response
 * @param {object} response - OpenAI API response
 * @returns {Array} Array of food items
 */
function parseAIResponse(response) {
  try {
    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from AI');
    }

    const parsed = JSON.parse(content);
    
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Invalid response format from AI');
    }

    // Validate and normalize each item
    const items = parsed.items.map((item, index) => {
      if (!item.name || typeof item.name !== 'string') {
        throw new Error(`Item ${index}: missing or invalid name`);
      }
      
      if (!item.grams || typeof item.grams !== 'number' || item.grams < 1) {
        throw new Error(`Item ${index}: grams must be >= 1`);
      }
      
      if (typeof item.calories !== 'number' || item.calories < 0) {
        throw new Error(`Item ${index}: calories must be non-negative`);
      }
      
      if (!['high', 'medium', 'low'].includes(item.confidence)) {
        throw new Error(`Item ${index}: confidence must be high, medium, or low`);
      }

      return {
        name: item.name.substring(0, 100), // Enforce max length
        grams: Math.round(item.grams),
        calories: Math.round(item.calories),
        confidence: item.confidence
      };
    });

    return items;
  } catch (error) {
    console.error('AI response parsing error:', error);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}

/**
 * Handle OpenAI API errors with user-friendly messages
 * @param {Error} error - Original error
 * @returns {Error} User-friendly error
 */
function handleAIError(error) {
  console.error('OpenAI API error:', error);

  // Authentication error
  if (error.status === 401 || error.message?.includes('Incorrect API key')) {
    return new Error('Invalid API key. Please check your API key in Settings.');
  }

  // Rate limit error
  if (error.status === 429 || error.message?.includes('Rate limit')) {
    return new Error('Rate limit exceeded. Please wait a moment and try again.');
  }

  // Server error
  if (error.status >= 500) {
    return new Error('OpenAI service is currently unavailable. Please try again later.');
  }

  // Timeout
  if (error.message?.includes('timeout')) {
    return new Error('Request timeout. Please check your connection and try again.');
  }

  // Network error
  if (error.message?.includes('fetch') || error.message?.includes('network')) {
    return new Error('Network error. Please check your internet connection.');
  }

  // Generic error
  return new Error(error.message || 'An unexpected error occurred. Please try again.');
}

/**
 * Retry with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} Result of successful call
 */
export async function retryWithBackoff(fn, maxRetries = 3) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry auth errors or client errors
      if (error.status === 401 || error.status === 400) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
