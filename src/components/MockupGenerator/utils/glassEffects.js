/**
 * Glass effect utilities for 2D mockup rendering
 */

/**
 * Apply cylindrical warp to simulate glass curvature
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement|HTMLImageElement} source - Source image/canvas
 * @param {number} curvature - Amount of cylindrical distortion (0-1)
 * @param {boolean} isBackLayer - Whether this is the back layer (seen through glass)
 */
export function applyCylindricalWarp(ctx, source, curvature = 0.1, isBackLayer = false) {
  const width = source.width;
  const height = source.height;
  
  // Create temporary canvas for warped result
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = width;
  tempCanvas.height = height;
  
  // Get image data
  tempCtx.drawImage(source, 0, 0);
  const imageData = tempCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Create output image data
  const outputData = tempCtx.createImageData(width, height);
  const output = outputData.data;
  
  const centerX = width / 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate distance from center
      const normalizedX = (x - centerX) / centerX;
      
      // Apply cylindrical transformation
      const angle = normalizedX * Math.PI / 2 * curvature;
      const warpedX = centerX + Math.sin(angle) * centerX / curvature;
      
      // Adjust for perspective (edges appear narrower)
      const perspectiveFactor = Math.cos(angle);
      const finalX = centerX + (warpedX - centerX) * perspectiveFactor;
      
      // Bilinear interpolation for smooth sampling
      const srcX = isBackLayer ? width - 1 - finalX : finalX;
      const x0 = Math.floor(srcX);
      const x1 = Math.ceil(srcX);
      const dx = srcX - x0;
      
      if (x0 >= 0 && x1 < width) {
        const idx = (y * width + x) * 4;
        const idx0 = (y * width + x0) * 4;
        const idx1 = (y * width + x1) * 4;
        
        // Interpolate color values
        output[idx] = data[idx0] * (1 - dx) + data[idx1] * dx;
        output[idx + 1] = data[idx0 + 1] * (1 - dx) + data[idx1 + 1] * dx;
        output[idx + 2] = data[idx0 + 2] * (1 - dx) + data[idx1 + 2] * dx;
        output[idx + 3] = data[idx0 + 3] * (1 - dx) + data[idx1 + 3] * dx;
      }
    }
  }
  
  tempCtx.putImageData(outputData, 0, 0);
  return tempCanvas;
}

/**
 * Apply glass refraction effect to back layer
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {HTMLCanvasElement} source - Source canvas
 * @param {number} refractionIndex - Glass refraction index (1.5 typical)
 */
export function applyRefraction(ctx, source, refractionIndex = 1.5) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  tempCanvas.width = source.width;
  tempCanvas.height = source.height;
  
  // Apply slight distortion and color shift
  tempCtx.globalAlpha = 0.95;
  tempCtx.drawImage(source, 0, 0);
  
  // Add chromatic aberration (slight color separation)
  tempCtx.globalCompositeOperation = 'screen';
  tempCtx.globalAlpha = 0.02;
  tempCtx.fillStyle = 'cyan';
  tempCtx.fillRect(1, 0, source.width, source.height);
  tempCtx.fillStyle = 'magenta';
  tempCtx.fillRect(-1, 0, source.width, source.height);
  
  return tempCanvas;
}

/**
 * Create glass highlight overlay
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} intensity - Highlight intensity (0-1)
 */
export function createGlassHighlight(width, height, intensity = 0.3) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width;
  canvas.height = height;
  
  // Create diagonal highlight
  const gradient = ctx.createLinearGradient(0, 0, width, height * 0.5);
  gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
  gradient.addColorStop(0.3, `rgba(255, 255, 255, ${intensity})`);
  gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
  gradient.addColorStop(0.7, `rgba(255, 255, 255, ${intensity})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Add rim lighting
  const rimGradient = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.3,
    width / 2, height / 2, Math.min(width, height) * 0.5
  );
  rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  rimGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)');
  rimGradient.addColorStop(1, `rgba(255, 255, 255, ${intensity * 0.5})`);
  
  ctx.fillStyle = rimGradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas;
}

/**
 * Composite all layers for final glass effect
 * @param {Object} params - Compositing parameters
 */
export function compositeGlassLayers({
  baseGlass,
  frontMap,
  backMap,
  engravingArea,
  rotation = 0
}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = baseGlass.width;
  canvas.height = baseGlass.height;
  
  // Draw base glass
  ctx.drawImage(baseGlass, 0, 0);
  
  // Calculate rotation-based opacity adjustments
  const rotationRad = (rotation * Math.PI) / 180;
  const frontOpacity = 0.85 - Math.abs(Math.sin(rotationRad)) * 0.2;
  const backOpacity = 0.3 + Math.abs(Math.sin(rotationRad)) * 0.2;
  
  // Draw back layer (reversed, refracted, lower opacity)
  if (backMap && Math.abs(rotation) > 10) {
    ctx.save();
    ctx.globalAlpha = backOpacity;
    ctx.globalCompositeOperation = 'multiply';
    ctx.filter = 'blur(1.5px)';
    
    // Apply warp and refraction
    const warpedBack = applyCylindricalWarp(ctx, backMap, 0.15, true);
    const refractedBack = applyRefraction(ctx, warpedBack);
    
    ctx.drawImage(
      refractedBack,
      engravingArea.x,
      engravingArea.y,
      engravingArea.width,
      engravingArea.height
    );
    ctx.restore();
  }
  
  // Draw front layer (main engraving)
  ctx.save();
  ctx.globalAlpha = frontOpacity;
  ctx.globalCompositeOperation = 'multiply';
  
  // Apply cylindrical warp
  const warpedFront = applyCylindricalWarp(ctx, frontMap, 0.08, false);
  
  ctx.drawImage(
    warpedFront,
    engravingArea.x,
    engravingArea.y,
    engravingArea.width,
    engravingArea.height
  );
  ctx.restore();
  
  // Add glass highlights
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.1;
  
  const highlight = createGlassHighlight(
    engravingArea.width,
    engravingArea.height,
    0.3
  );
  
  ctx.drawImage(
    highlight,
    engravingArea.x,
    engravingArea.y,
    engravingArea.width,
    engravingArea.height
  );
  ctx.restore();
  
  return canvas;
}