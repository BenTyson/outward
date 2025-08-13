// Image processing utilities for texture manipulation

/**
 * Apply grain effect to image data
 * @param {ImageData} imageData - The image data to modify
 * @param {number} grainAmount - Amount of grain (0-1)
 */
export const applyGrain = (imageData, grainAmount) => {
  if (grainAmount <= 0) return;
  
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * grainAmount * 50;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
  }
};

/**
 * Apply blur effect to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} blurAmount - Blur amount in pixels
 */
export const applyBlur = (ctx, canvas, blurAmount) => {
  if (blurAmount <= 0) return;
  
  ctx.filter = `blur(${blurAmount}px)`;
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(tempCanvas, 0, 0);
};

/**
 * Create a canvas with 2D context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
 */
export const createCanvasContext = (width, height) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx };
};

/**
 * Process pixels for white extraction and darkening
 * @param {Uint8ClampedArray} data - Pixel data array
 * @param {Object} options - Processing options
 * @returns {{processedPixels: number, darkenedPixels: number}}
 */
export const processPixels = (data, options = {}) => {
  const {
    whiteThreshold = 248,
    grayThreshold = 235,
    darkenFactor = 0.4
  } = options;
  
  let processedPixels = 0;
  let darkenedPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    
    if (brightness > whiteThreshold) {
      data[i + 3] = 0; // Make transparent
      processedPixels++;
    } else if (brightness > grayThreshold) {
      data[i + 3] = 0; // Make transparent
      processedPixels++;
    } else {
      // Darken remaining pixels
      data[i] = Math.floor(r * darkenFactor);
      data[i + 1] = Math.floor(g * darkenFactor);
      data[i + 2] = Math.floor(b * darkenFactor);
      darkenedPixels++;
    }
  }
  
  return { processedPixels, darkenedPixels };
};