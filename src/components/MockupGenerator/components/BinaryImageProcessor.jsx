import React from 'react';

/**
 * BinaryImageProcessor - Converts processed image to pure binary (black/transparent)
 * This eliminates grayscale artifacts that create visible strip lines
 */
const BinaryImageProcessor = ({ 
  processedImage, 
  width, 
  height, 
  whiteThreshold = 240,
  onBinaryImageReady 
}) => {
  
  // Convert original image to pure binary (solid black on transparent)
  const createBinaryImage = React.useCallback((sourceImage) => {
    if (!sourceImage) return null;
    
    console.log('Creating binary image from original source...', sourceImage);
    
    // Create temporary canvas for binary conversion
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Handle both HTMLImageElement and Canvas
    const imageWidth = sourceImage.width || sourceImage.naturalWidth;
    const imageHeight = sourceImage.height || sourceImage.naturalHeight;
    
    tempCanvas.width = imageWidth;
    tempCanvas.height = imageHeight;
    
    // Draw source image
    tempCtx.drawImage(sourceImage, 0, 0);
    
    // Get pixel data for binary conversion
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    
    let convertedPixels = 0;
    let totalPixels = 0;
    
    // Convert all non-white pixels to solid black
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      totalPixels++;
      
      // Calculate brightness
      const brightness = (r + g + b) / 3;
      
      // Debug first few pixels
      if (totalPixels <= 10) {
        console.log(`Pixel ${totalPixels}: R=${r}, G=${g}, B=${b}, A=${a}, brightness=${brightness}, threshold=${whiteThreshold}`);
      }
      
      if (a > 0 && brightness < whiteThreshold) {
        // Convert to solid black - NO grayscale variations
        data[i] = 0;     // Red = 0
        data[i + 1] = 0; // Green = 0  
        data[i + 2] = 0; // Blue = 0
        data[i + 3] = 255; // Alpha = fully opaque
        convertedPixels++;
      } else {
        // Make completely transparent
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 0;
      }
    }
    
    // Put the binary data back
    tempCtx.putImageData(imageData, 0, 0);
    
    console.log(`Binary conversion complete: ${convertedPixels}/${totalPixels} pixels converted to solid black`);
    
    return tempCanvas;
  }, [whiteThreshold]);
  
  // Process when inputs change
  React.useEffect(() => {
    if (!processedImage) return;
    
    const binaryCanvas = createBinaryImage(processedImage);
    if (binaryCanvas && onBinaryImageReady) {
      onBinaryImageReady(binaryCanvas);
    }
  }, [processedImage, createBinaryImage, onBinaryImageReady]);
  
  // This is a processing component - no visual output
  return null;
};

export default BinaryImageProcessor;