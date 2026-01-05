import Pica from 'pica';
import piexif from 'piexifjs';

const pica = new Pica();

/**
 * Image Service
 * Handles image compression, EXIF stripping, and format conversion
 */

/**
 * Strip EXIF metadata from image for privacy
 * @param {Blob} imageBlob - Original image blob
 * @returns {Promise<Blob>} Image blob without EXIF data
 */
export async function stripExif(imageBlob) {
  try {
    // Read blob as data URL
    const dataUrl = await blobToDataUrl(imageBlob);
    
    // Remove EXIF data
    const stripped = piexif.remove(dataUrl);
    
    // Convert back to blob
    return dataUrlToBlob(stripped);
  } catch (error) {
    console.warn('EXIF stripping failed, using original:', error);
    // Return original if stripping fails (better than blocking the flow)
    return imageBlob;
  }
}

/**
 * Compress image to meet size and dimension requirements
 * Target: <500KB, max 1024px on longest side
 * @param {Blob} imageBlob - Original image blob
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(imageBlob) {
  const img = await loadImage(imageBlob);
  
  // Calculate target dimensions (max 1024px on longest side)
  let { width, height } = img;
  const maxDimension = 1024;
  
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }
  
  // Create canvas for resized image
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Use Pica for high-quality resize
  await pica.resize(img, canvas, {
    quality: 3,
    alpha: false,
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2
  });
  
  // Compress to JPEG with quality adjustment to reach <500KB
  let quality = 0.85;
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  
  const maxSize = 500 * 1024; // 500KB
  const minQuality = 0.5;
  
  while (blob.size > maxSize && quality > minQuality) {
    quality -= 0.05;
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
  }
  
  console.log(`Image compressed: ${imageBlob.size} -> ${blob.size} bytes (quality: ${quality})`);
  
  return blob;
}

/**
 * Convert Blob to base64 string
 * @param {Blob} blob - Image blob
 * @returns {Promise<string>} Base64 encoded string (without data URL prefix)
 */
export async function blobToBase64(blob) {
  const dataUrl = await blobToDataUrl(blob);
  // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
  return dataUrl.split(',')[1];
}

/**
 * Load image from blob
 * @param {Blob} blob - Image blob
 * @returns {Promise<HTMLImageElement>} Loaded image element
 */
function loadImage(blob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Convert blob to data URL
 * @param {Blob} blob - Blob to convert
 * @returns {Promise<string>} Data URL string
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert data URL to blob
 * @param {string} dataUrl - Data URL string
 * @returns {Blob} Blob object
 */
function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

/**
 * Convert canvas to blob
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {string} type - MIME type (e.g., 'image/jpeg')
 * @param {number} quality - Quality (0-1)
 * @returns {Promise<Blob>} Blob object
 */
function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to blob conversion failed'));
      },
      type,
      quality
    );
  });
}

/**
 * Process image through full pipeline: strip EXIF, compress, convert to base64
 * @param {Blob} imageBlob - Original image blob
 * @returns {Promise<string>} Base64 encoded compressed image
 */
export async function processImageForAI(imageBlob) {
  // Strip EXIF metadata first
  const cleanedBlob = await stripExif(imageBlob);
  
  // Compress image
  const compressedBlob = await compressImage(cleanedBlob);
  
  // Convert to base64
  const base64 = await blobToBase64(compressedBlob);
  
  return base64;
}
