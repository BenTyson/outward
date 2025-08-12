/**
 * BinaryRenderer - Renders pure binary images with clean opacity control
 * Eliminates strip line artifacts by using solid black pixels only
 */

// Render binary image with zero-overlap strip system
export const renderBinaryLayer = (ctx, binaryImage, x, y, width, height, params, isBackLayer = false) => {
    if (!binaryImage || !ctx) return;
    
    console.log(`Rendering binary layer (${isBackLayer ? 'back' : 'front'}) with ${Math.floor(500 * params.renderQuality)} strips`);
    
    // Get binary image portion for this layer (front/back cylindrical wrapping)
    const portion = getImagePortionForSide(binaryImage, isBackLayer ? 'back' : 'front');
    const { canvas: sourceImage, sourceX, sourceY, sourceWidth, sourceHeight } = portion;
    
    // Apply high-quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Zero-overlap even distribution system
    const totalStripCount = Math.floor(500 * params.renderQuality);
    const stripHeight = height / totalStripCount;
    const sourceStripHeight = sourceHeight / totalStripCount;
    
    console.log(`Binary rendering: ${totalStripCount} strips, ${stripHeight.toFixed(3)}px each`);
    
    // Set opacity for entire layer (binary pixels are solid black, so opacity controls visibility)
    ctx.globalAlpha = params.engravingOpacity;
    ctx.globalCompositeOperation = 'source-over';
    
    // Single loop through all strips with perfect mathematical placement
    for (let stripIndex = 0; stripIndex < totalStripCount; stripIndex++) {
      const stripProgress = stripIndex / (totalStripCount - 1);
      
      // Perfect strip positioning - no overlap, no gaps
      const destY = y + stripIndex * stripHeight;
      const cropSourceY = sourceY + stripIndex * sourceStripHeight;
      
      // Interpolate width based on top/bottom settings  
      const currentWidth = params.topWidth + (params.bottomWidth - params.topWidth) * stripProgress;
      const centerOffsetX = x + (width - currentWidth) / 2;
      
      // Calculate continuous arc distortion using single smooth curve
      const arcDirection = isBackLayer ? -1 : 1;
      // Use inverted parabolic curve: maximum at edges, minimum at center
      const arcDip = params.arcAmount * height * 0.15 * (1 - 4 * stripProgress * (1 - stripProgress)) * arcDirection;
      
      // Apply vertical squash effect
      const squashedStripHeight = stripHeight * params.verticalSquash;
      const verticalSquashOffset = (stripHeight - squashedStripHeight) / 2;
      
      // Final destination calculations with arc
      const finalDestX = centerOffsetX;
      const finalDestY = destY + arcDip + verticalSquashOffset;
      const finalDestWidth = currentWidth;
      const finalDestHeight = squashedStripHeight;
      
      // SIMPLIFIED BINARY RENDERING: Single drawImage per strip
      // No horizontal subdivisions to eliminate micro-alignment artifacts
      ctx.drawImage(
        sourceImage,
        sourceX, cropSourceY, sourceWidth, sourceStripHeight,
        finalDestX, finalDestY + arcDip,
        finalDestWidth, finalDestHeight
      );
    }
    
    // Reset rendering state
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
};

// Get image portion for cylindrical wrapping (front/back)
export const getImagePortionForSide = (image, side) => {
  // For now, use full image - cylindrical wrapping can be added later
  return {
    canvas: image,
    sourceX: 0,
    sourceY: 0, 
    sourceWidth: image.width,
    sourceHeight: image.height
  };
};