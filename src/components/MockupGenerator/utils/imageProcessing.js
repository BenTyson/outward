/**
 * Image processing utilities for engraving effects
 */

/**
 * Clean binary image using blur + re-threshold to eliminate grid artifacts
 * @param {HTMLCanvasElement} binaryCanvas - Binary image with potential grid artifacts
 * @param {number} engravingOpacity - Target opacity for final black pixels
 * @returns {HTMLCanvasElement} - Cleaned image canvas
 */
const cleanBinaryImage = (binaryCanvas, engravingOpacity) => {
  const cleanCanvas = document.createElement('canvas');
  cleanCanvas.width = binaryCanvas.width;
  cleanCanvas.height = binaryCanvas.height;
  const cleanCtx = cleanCanvas.getContext('2d');
  
  // Step 1: Apply blur to merge nearby pixels and smooth grid artifacts
  cleanCtx.filter = 'blur(1px)';
  cleanCtx.drawImage(binaryCanvas, 0, 0);
  cleanCtx.filter = 'none';
  
  // Step 2: Re-threshold the blurred result back to binary
  const imageData = cleanCtx.getImageData(0, 0, cleanCanvas.width, cleanCanvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    
    // Re-threshold: if pixel has any opacity, make it pure black with target opacity
    if (alpha > 10) { // Small threshold to catch blurred edges
      data[i] = 0;     // Pure black
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = Math.round(255 * engravingOpacity); // Target opacity
    } else {
      data[i + 3] = 0; // Full transparency
    }
  }
  
  // Put cleaned data back
  cleanCtx.putImageData(imageData, 0, 0);
  
  return cleanCanvas;
};

/**
 * Process image for engraving: convert to binary, clean artifacts, then apply opacity
 * @param {HTMLImageElement|HTMLCanvasElement} image - Source image to process
 * @param {number} whiteThreshold - Brightness level that counts as "white" (0-255)
 * @param {number} engravingOpacity - Opacity for non-white pixels (0-1)
 * @returns {HTMLCanvasElement} - Processed and cleaned image canvas
 */
export const processImageForEngraving = (image, whiteThreshold, engravingOpacity) => {
  console.log('Visual processing:', { whiteThreshold, engravingOpacity });
  
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = image.width;
  tempCanvas.height = image.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  // Draw original image
  tempCtx.drawImage(image, 0, 0);
  
  // Get image data for pixel manipulation
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  const data = imageData.data;
  
  // Process each pixel: Binary approach - white becomes transparent, everything else becomes black
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Calculate brightness (0-255)
    const brightness = (r + g + b) / 3;
    
    // Binary processing: white or black, no grays
    if (brightness > whiteThreshold) {
      // White pixels: make fully transparent
      data[i + 3] = 0;
    } else {
      // Everything else: convert to pure black and apply engraving opacity
      data[i] = 0;     // Red = 0 (black)
      data[i + 1] = 0; // Green = 0 (black)  
      data[i + 2] = 0; // Blue = 0 (black)
      data[i + 3] = Math.round(data[i + 3] * engravingOpacity); // Apply opacity
    }
  }
  
  // Put modified data back
  tempCtx.putImageData(imageData, 0, 0);
  
  // No aggressive cleaning - keep the clean binary result
  return tempCanvas;
};