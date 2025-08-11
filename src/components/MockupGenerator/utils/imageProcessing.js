/**
 * Image processing utilities for engraving effects
 */

/**
 * Process image for engraving: convert to binary (white transparent, rest pure black with opacity)
 * @param {HTMLImageElement|HTMLCanvasElement} image - Source image to process
 * @param {number} whiteThreshold - Brightness level that counts as "white" (0-255)
 * @param {number} engravingOpacity - Opacity for non-white pixels (0-1)
 * @returns {HTMLCanvasElement} - Processed image canvas
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
  
  // Apply slight blur to binary image to reduce harsh edges before strip processing
  tempCtx.filter = 'blur(0.5px)';
  tempCtx.drawImage(tempCanvas, 0, 0);
  tempCtx.filter = 'none';
  
  return tempCanvas;
};