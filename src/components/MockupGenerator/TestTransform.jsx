import React, { useEffect, useRef, useState } from 'react';
import { processImageForEngraving } from './utils/imageProcessing';
import VisualControls from './components/VisualControls';
import SettingsExport from './components/SettingsExport';

const TestTransform = () => {
  const canvasRef = useRef(null);
  const [testImage, setTestImage] = useState(null);
  const [glassImage, setGlassImage] = useState(null);
  
  // Transform parameters - Optimized defaults for rocks glass mapping
  const [arcAmount, setArcAmount] = useState(0.64); // How much the top curves (0 = flat, 1 = very curved)
  const [bottomArcAmount, setBottomArcAmount] = useState(1.0); // How much the bottom curves (0 = flat, 1 = very curved)
  const [topWidth, setTopWidth] = useState(425); // Width at top of overlay
  const [bottomWidth, setBottomWidth] = useState(430); // Width at bottom of overlay  
  const [verticalPosition, setVerticalPosition] = useState(80); // Y position of top of overlay
  const [mapHeight, setMapHeight] = useState(460); // Height of overlay area (no distortion)
  const [bottomCornerRadius, setBottomCornerRadius] = useState(0); // Radius for bottom left/right corners
  const [perspectiveTaper, setPerspectiveTaper] = useState(0.8); // Bottom width relative to top (1 = rectangle, 0.5 = strong taper) - LEGACY
  const [verticalSquash, setVerticalSquash] = useState(1.0); // Vertical compression for ellipse effect
  
  // Smoothing parameters - Reset to defaults for clean rendering
  const [horizontalOverlap, setHorizontalOverlap] = useState(0); // Horizontal strip overlap in pixels
  const [bottomArcCompensation, setBottomArcCompensation] = useState(0); // Additional bottom arc compensation
  const [verticalOverlap, setVerticalOverlap] = useState(0); // Vertical slice overlap in pixels
  const [blurAmount, setBlurAmount] = useState(0); // Post-processing blur amount
  const [blendOpacity, setBlendOpacity] = useState(1.0); // Overlap blending opacity
  
  // Tab state
  const [activeSide, setActiveSide] = useState('front'); // Main side selector (front or back)
  
  // Layer visibility states
  const [showFront, setShowFront] = useState(true);
  const [showBack, setShowBack] = useState(true);
  
  // Cylindrical image portion controls
  const [frontPortionSize, setFrontPortionSize] = useState(0.4); // 40% of image width
  const [sideGapSize, setSideGapSize] = useState(0.1); // 10% gap on each side
  const [backPortionSize, setBackPortionSize] = useState(0.4); // 40% of image width
  
  // Visual effects parameters - Simplified binary approach
  const [whiteThreshold, setWhiteThreshold] = useState(240); // Brightness level that counts as "white" (0-255)
  const [engravingOpacity, setEngravingOpacity] = useState(0.3); // 0 = fully transparent, 1 = fully opaque (for all non-white pixels)
  
  // BACK LAYER: Transform parameters - Starting with same defaults as front
  const [backArcAmount, setBackArcAmount] = useState(0.64);
  const [backBottomArcAmount, setBackBottomArcAmount] = useState(1.0);
  const [backTopWidth, setBackTopWidth] = useState(425);
  const [backBottomWidth, setBackBottomWidth] = useState(430);
  const [backVerticalPosition, setBackVerticalPosition] = useState(30);
  const [backMapHeight, setBackMapHeight] = useState(460);
  const [backBottomCornerRadius, setBackBottomCornerRadius] = useState(0);
  const [backVerticalSquash, setBackVerticalSquash] = useState(1.0);
  
  // BACK LAYER: Smoothing parameters
  const [backHorizontalOverlap, setBackHorizontalOverlap] = useState(0);
  const [backBottomArcCompensation, setBackBottomArcCompensation] = useState(0);
  const [backVerticalOverlap, setBackVerticalOverlap] = useState(0);
  const [backBlurAmount, setBackBlurAmount] = useState(0);
  const [backBlendOpacity, setBackBlendOpacity] = useState(1.0);
  
  // BACK LAYER: Visual effects parameters
  const [backWhiteThreshold, setBackWhiteThreshold] = useState(240);
  const [backEngravingOpacity, setBackEngravingOpacity] = useState(0.2); // Slightly lighter for depth effect
  
  // Load both images
  useEffect(() => {
    // Load map design (overlay) - Using optimized 1600x1200 image from Phase 1
    const mapImg = new Image();
    mapImg.onload = () => {
      console.log('Loaded optimized test image:', mapImg.width, 'x', mapImg.height);
      console.log('Pixels per strip:', mapImg.height / 80, '(should be clean integer)');
      setTestImage(mapImg);
    };
    mapImg.src = '/glass-images/rocks-test-design-optimal.png';
    
    // Load glass background
    const glassImg = new Image();
    glassImg.onload = () => {
      console.log('Glass image loaded:', glassImg.width, 'x', glassImg.height);
      setGlassImage(glassImg);
    };
    glassImg.onerror = (e) => console.error('Failed to load glass image:', e);
    glassImg.src = '/glass-images/rocks-white.jpg';
  }, []);
  
  // Cylindrical image portion selection for glass wrapping effect
  const getImagePortionForSide = (image, side) => {
    const imageWidth = image.width;
    
    if (side === 'front') {
      // Front side: shows leftmost portion (0% to frontPortionSize%)
      return {
        sourceX: 0,
        sourceWidth: imageWidth * frontPortionSize,
        flip: false
      };
    } else {
      // Back side: shows portion after front + gap, flipped horizontally
      // Calculation: skip front portion + left side gap, then take back portion
      const backStartPosition = frontPortionSize + sideGapSize;
      return {
        sourceX: imageWidth * backStartPosition,
        sourceWidth: imageWidth * backPortionSize,
        flip: true // Flip horizontally since we're viewing through glass
      };
    }
  };
  
  // Apply arc/perspective transform with configurable overlap blending
  const applyArcTransform = (ctx, image, x, y, width, height, isBackLayer = false) => {
    // Use back layer parameters if rendering back, otherwise use front
    const params = isBackLayer ? {
      arcAmount: backArcAmount,
      bottomArcAmount: backBottomArcAmount,
      topWidth: backTopWidth,
      bottomWidth: backBottomWidth,
      verticalPosition: backVerticalPosition,
      mapHeight: backMapHeight,
      bottomCornerRadius: backBottomCornerRadius,
      verticalSquash: backVerticalSquash,
      horizontalOverlap: backHorizontalOverlap,
      bottomArcCompensation: backBottomArcCompensation,
      verticalOverlap: backVerticalOverlap,
      blurAmount: backBlurAmount,
      blendOpacity: backBlendOpacity,
      whiteThreshold: backWhiteThreshold,
      engravingOpacity: backEngravingOpacity
    } : {
      arcAmount,
      bottomArcAmount,
      topWidth,
      bottomWidth,
      verticalPosition,
      mapHeight,
      bottomCornerRadius,
      verticalSquash,
      horizontalOverlap,
      bottomArcCompensation,
      verticalOverlap,
      blurAmount,
      blendOpacity,
      whiteThreshold,
      engravingOpacity
    };
    
    // Get the correct image portion for this side and apply flipping if needed
    const { sourceX: portionSourceX, sourceWidth: portionSourceWidth, flip } = getImagePortionForSide(image, isBackLayer ? 'back' : 'front');
    
    // Create a canvas with just the portion we need
    const portionCanvas = document.createElement('canvas');
    portionCanvas.width = portionSourceWidth;
    portionCanvas.height = image.height;
    const portionCtx = portionCanvas.getContext('2d');
    
    if (flip) {
      // For back side: flip horizontally
      portionCtx.scale(-1, 1);
      portionCtx.drawImage(image, portionSourceX, 0, portionSourceWidth, image.height, 
                          -portionSourceWidth, 0, portionSourceWidth, image.height);
    } else {
      // For front side: draw normally
      portionCtx.drawImage(image, portionSourceX, 0, portionSourceWidth, image.height, 
                          0, 0, portionSourceWidth, image.height);
    }
    
    // Use the portion as our working image
    let processedImage = portionCanvas;
    
    // Apply engraving effects if needed
    if (params.engravingOpacity < 1 || params.whiteThreshold < 255) {
      processedImage = processImageForEngraving(processedImage, params.whiteThreshold, params.engravingOpacity);
    }
    
    // Pre-process: Create rounded corner version of source image if needed
    if (params.bottomCornerRadius > 0) {
      // Create a temporary canvas for rounded source image
      const roundedCanvas = document.createElement('canvas');
      roundedCanvas.width = processedImage.width;
      roundedCanvas.height = processedImage.height;
      const roundedCtx = roundedCanvas.getContext('2d');
      
      // Calculate corner radius relative to image size
      const imageCornerRadius = params.bottomCornerRadius * (processedImage.width / width); // Scale radius to source image
      
      // Draw rounded rectangle mask
      roundedCtx.beginPath();
      roundedCtx.moveTo(imageCornerRadius, 0);
      roundedCtx.lineTo(processedImage.width - imageCornerRadius, 0);
      roundedCtx.arcTo(processedImage.width, 0, processedImage.width, imageCornerRadius, imageCornerRadius);
      roundedCtx.lineTo(processedImage.width, processedImage.height - imageCornerRadius);
      roundedCtx.arcTo(processedImage.width, processedImage.height, processedImage.width - imageCornerRadius, processedImage.height, imageCornerRadius);
      roundedCtx.lineTo(imageCornerRadius, processedImage.height);
      roundedCtx.arcTo(0, processedImage.height, 0, processedImage.height - imageCornerRadius, imageCornerRadius);
      roundedCtx.lineTo(0, imageCornerRadius);
      roundedCtx.arcTo(0, 0, imageCornerRadius, 0, imageCornerRadius);
      roundedCtx.closePath();
      
      // Use the path as a clipping mask
      roundedCtx.clip();
      
      // Draw the processed image within the rounded mask
      roundedCtx.drawImage(processedImage, 0, 0);
      
      processedImage = roundedCanvas;
    }
    
    // Calculate source image cropping area based on height (maintain aspect ratio)
    const sourceAspectRatio = processedImage.width / processedImage.height;
    const targetAspectRatio = width / height;
    
    let sourceWidth, sourceHeight, sourceX, sourceY;
    
    if (sourceAspectRatio > targetAspectRatio) {
      // Source is wider - crop horizontally, use full height
      sourceHeight = processedImage.height;
      sourceWidth = sourceHeight * targetAspectRatio;
      sourceX = (processedImage.width - sourceWidth) / 2; // Center crop
      sourceY = 0;
    } else {
      // Source is taller - crop vertically, use full width  
      sourceWidth = processedImage.width;
      sourceHeight = sourceWidth / targetAspectRatio;
      sourceX = 0;
      sourceY = (processedImage.height - sourceHeight) / 2; // Center crop
    }
    // Enable minimal smoothing for binary images - helps blend strip boundaries without gray artifacts
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low'; // Minimal smoothing
    
    // Use strip count that evenly divides common resolutions
    // For integration with Phase 1, we'll generate images at optimal sizes
    const strips = 80; // Will work perfectly with 1600px height from Phase 1
    const stripHeight = height / strips;
    const sourceStripHeight = sourceHeight / strips;
    
    for (let i = 0; i < strips; i++) {
      const progress = i / (strips - 1); // 0 to 1 from top to bottom
      
      // Smart overlap compensation: increase overlap in arc areas where strips get distorted
      let currentHorizontalOverlap = params.horizontalOverlap;
      
      // Top arc area compensation - mathematical precision  
      if (progress < 0.4 && params.arcAmount > 0) {
        const arcProgress = progress / 0.4; // 0 at top, 1 at 40% down
        
        // Calculate exact gap created by top arc curvature
        const arcCurvature = params.arcAmount * height * 0.1 * (1 - arcProgress); // Inverse of bottom arc
        
        // Gap expansion factor - strips spread more at the very top
        const gapExpansion = Math.pow((1 - arcProgress), 1.2); // Max expansion at top
        const calculatedOverlap = arcCurvature * gapExpansion * 0.8; // Same precision as bottom
        
        currentHorizontalOverlap = params.horizontalOverlap + calculatedOverlap;
      } 
      // Bottom arc area compensation - mathematical precision
      else if (progress > 0.6 && params.bottomArcAmount > 0) {
        const bottomArcProgress = (progress - 0.6) / 0.4; // 0 at 60%, 1 at bottom
        
        // Calculate exact gap created by arc curvature
        const arcCurvature = params.bottomArcAmount * height * 0.1 * bottomArcProgress;
        const stripSpacing = stripHeight;
        
        // Gap expansion factor - strips spread more as they curve
        const gapExpansion = Math.pow(bottomArcProgress, 1.2); // Less steep curve for more consistent compensation
        const calculatedOverlap = arcCurvature * gapExpansion * 0.8; // Much more aggressive compensation
        
        currentHorizontalOverlap = params.horizontalOverlap + calculatedOverlap + params.bottomArcCompensation;
      }
      
      // Add overlap to source sampling using dynamic overlap (within cropped area)
      const cropSourceY = sourceY + Math.max(0, i * sourceStripHeight - currentHorizontalOverlap/2);
      const actualSourceHeight = Math.min(sourceStripHeight + currentHorizontalOverlap, sourceHeight - (cropSourceY - sourceY));
      
      // Calculate width at this height using linear interpolation (no per-strip corner radius)
      const currentWidth = params.topWidth + (params.bottomWidth - params.topWidth) * progress;
      
      // Calculate Y position with optional vertical squash and overlap
      const destY = y + (i * stripHeight * params.verticalSquash) - (i > 0 ? currentHorizontalOverlap/2 : 0);
      const actualDestHeight = stripHeight * params.verticalSquash + (i > 0 ? currentHorizontalOverlap/2 : 0);
      
      // Calculate arc offset for this row
      let arcOffsetForRow = 0;
      
      // Top arc (affects top 40%)
      if (progress < 0.4) {
        const arcProgress = progress / 0.4;
        arcOffsetForRow = params.arcAmount * height * 0.1 * (1 - arcProgress);
      }
      
      // Bottom arc (affects bottom 40%) - negative offset to compress strips
      if (progress > 0.6) {
        const bottomArcProgress = (progress - 0.6) / 0.4;
        const bottomArcOffset = params.bottomArcAmount * height * 0.1 * bottomArcProgress;
        arcOffsetForRow -= bottomArcOffset; // Subtract to bring strips closer together
      }
      
      // Center the strip horizontally based on its width
      const destX = x + (width - currentWidth) / 2;
      
      // Apply blending for overlapped areas
      if (i > 0) {
        // Create gradient mask for smooth blending using dynamic overlap
        const gradient = ctx.createLinearGradient(0, destY, 0, destY + currentHorizontalOverlap);
        gradient.addColorStop(0, 'rgba(255,255,255,0.5)'); // Semi-transparent at edge
        gradient.addColorStop(1, 'rgba(255,255,255,1)');   // Fully opaque
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = params.blendOpacity; // Configurable blending opacity
      } else {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // For the arc rows (top or bottom), apply arc warping
      const needsArcWarping = (progress < 0.4 && params.arcAmount > 0) || (progress > 0.6 && params.bottomArcAmount > 0);
      if (needsArcWarping) {
        // Draw this row with arc distortion and overlap - reduced density for binary mode
        const subStrips = 50; // Reduced from 100
        const subStripWidth = currentWidth / subStrips;
        
        for (let j = 0; j < subStrips; j++) {
          const subX = j / (subStrips - 1);
          const centerOffset = Math.abs(subX - 0.5) * 2;
          
          // Calculate arc distortion (separate from strip positioning)
          let arcDip = 0;
          if (progress < 0.4) {
            // Top arc: positive offset curves downward
            const arcProgress = progress / 0.4;
            const topArcOffset = params.arcAmount * height * 0.1 * (1 - arcProgress);
            arcDip = topArcOffset * (1 - centerOffset * centerOffset);
          } else if (progress > 0.6) {
            // Bottom arc: positive offset curves downward (like glass bottom)
            const bottomArcProgress = (progress - 0.6) / 0.4;
            const bottomArcDistortion = params.bottomArcAmount * height * 0.1 * bottomArcProgress;
            arcDip = bottomArcDistortion * (1 - centerOffset * centerOffset);
          }
          
          // Add configurable horizontal overlap for vertical slices (within cropped area)
          const actualSubWidth = subStripWidth + (j > 0 ? params.verticalOverlap : 0);
          const subSourceX = sourceX + Math.max(0, (j / subStrips) * sourceWidth - (j > 0 ? params.verticalOverlap/2 : 0));
          const subSourceWidth = Math.min(sourceWidth / subStrips + params.verticalOverlap, sourceWidth - (subSourceX - sourceX));
          
          ctx.drawImage(
            processedImage,
            subSourceX, cropSourceY, subSourceWidth, actualSourceHeight,
            destX + j * subStripWidth - (j > 0 ? params.verticalOverlap/2 : 0), destY + arcDip, 
            actualSubWidth, actualDestHeight
          );
        }
      } else {
        // Draw normal horizontal strip with overlap (from cropped area)
        ctx.drawImage(
          processedImage,
          sourceX, cropSourceY, sourceWidth, actualSourceHeight,
          destX, destY, currentWidth, actualDestHeight
        );
      }
    }
    
    // Reset blending
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  };
  
  useEffect(() => {
    if (!canvasRef.current || !testImage || !glassImage) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Clear canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw glass background image scaled to fit canvas while preserving aspect ratio
    const glassAspect = glassImage.width / glassImage.height;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight;
    if (glassAspect > canvasAspect) {
      // Image is wider than canvas - fit to canvas width
      drawWidth = canvas.width;
      drawHeight = canvas.width / glassAspect;
    } else {
      // Image is taller than canvas - fit to canvas height  
      drawWidth = canvas.height * glassAspect;
      drawHeight = canvas.height;
    }
    
    // Center the scaled image
    const glassX = (canvas.width - drawWidth) / 2;
    const glassY = (canvas.height - drawHeight) / 2;
    
    console.log('Drawing glass at:', glassX, glassY, 'scaled to:', drawWidth, 'x', drawHeight);
    ctx.drawImage(glassImage, glassX, glassY, drawWidth, drawHeight);
    
    // Render back layer first (if visible) - using back parameters
    if (showBack) {
      ctx.save();
      ctx.globalAlpha = 0.5; // Make back layer semi-transparent for depth effect
      applyArcTransform(ctx, testImage, 200, backVerticalPosition, 400, backMapHeight, true);
      ctx.restore();
    }
    
    // Render front layer (if visible)
    if (showFront) {
      applyArcTransform(ctx, testImage, 200, verticalPosition, 400, mapHeight, false);
    }
    
    
    // Post-processing: Apply configurable blur to smooth seams
    if (blurAmount > 0) {
      // Create a temporary canvas for blur effect
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = mapHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Copy the transformed area to temp canvas
      const transformedData = ctx.getImageData(200, verticalPosition, 400, mapHeight);
      tempCtx.putImageData(transformedData, 0, 0);
      
      // Apply blur filter and draw back
      ctx.save();
      ctx.filter = `blur(${blurAmount}px)`;
      ctx.drawImage(tempCanvas, 200, verticalPosition);
      ctx.restore();
    }
    
    // Draw reference bounds for active side
    const activeParams = activeSide === 'front' ? {
      arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, mapHeight
    } : {
      arcAmount: backArcAmount, bottomArcAmount: backBottomArcAmount, 
      topWidth: backTopWidth, bottomWidth: backBottomWidth, 
      verticalPosition: backVerticalPosition, mapHeight: backMapHeight
    };
    
    ctx.strokeStyle = activeSide === 'front' ? 'red' : 'blue';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw arc guide at top using actual overlay dimensions
    ctx.beginPath();
    const steps = 20;
    const topStartX = 200 + (400 - activeParams.topWidth) / 2; // Center the top width within the 400px area
    for (let i = 0; i <= steps; i++) {
      const x = topStartX + (i / steps) * activeParams.topWidth;
      const normalizedX = i / steps;
      const centerOffset = Math.abs(normalizedX - 0.5) * 2;
      const arcOffset = activeParams.arcAmount * activeParams.mapHeight * 0.15 * (1 - centerOffset * centerOffset);
      const y = activeParams.verticalPosition + arcOffset;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw bottom arc guide using actual bottom width
    ctx.beginPath();
    const actualBottomWidth = activeParams.bottomWidth;
    const bottomStartX = 200 + (400 - actualBottomWidth) / 2; // Center the bottom width within the 400px area
    
    if (activeParams.bottomArcAmount > 0) {
      // Draw bottom arc
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const x = bottomStartX + (i / steps) * actualBottomWidth;
        const normalizedX = i / steps;
        const centerOffset = Math.abs(normalizedX - 0.5) * 2;
        const bottomArcOffset = activeParams.bottomArcAmount * activeParams.mapHeight * 0.1 * (1 - centerOffset * centerOffset);
        const y = (activeParams.verticalPosition + activeParams.mapHeight) + bottomArcOffset; // Add to curve downward (glass bottom shape)
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      // Draw straight bottom line
      ctx.moveTo(bottomStartX, activeParams.verticalPosition + activeParams.mapHeight);
      ctx.lineTo(bottomStartX + actualBottomWidth, activeParams.verticalPosition + activeParams.mapHeight);
    }
    ctx.stroke();
    
  }, [testImage, glassImage, arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, mapHeight, bottomCornerRadius, verticalSquash, horizontalOverlap, bottomArcCompensation, verticalOverlap, blurAmount, blendOpacity, whiteThreshold, engravingOpacity, showFront, showBack, backArcAmount, backBottomArcAmount, backTopWidth, backBottomWidth, backVerticalPosition, backMapHeight, backBottomCornerRadius, backVerticalSquash, backHorizontalOverlap, backBottomArcCompensation, backVerticalOverlap, backBlurAmount, backBlendOpacity, backWhiteThreshold, backEngravingOpacity, activeSide, frontPortionSize, sideGapSize, backPortionSize]);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Arc/Perspective Transform for Tilted Glass</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        {/* Controls */}
        <div style={{ background: '#f9f9f9', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Visibility Toggle Buttons */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '10px 16px', 
            borderBottom: '1px solid #dee2e6',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#666', marginRight: '8px' }}>
              Show:
            </span>
            <button
              onClick={() => setShowFront(!showFront)}
              style={{
                padding: '5px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                background: showFront ? '#28a745' : '#fff',
                color: showFront ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {showFront ? '✓' : ''} Front
            </button>
            <button
              onClick={() => setShowBack(!showBack)}
              style={{
                padding: '5px 12px',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                background: showBack ? '#28a745' : '#fff',
                color: showBack ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {showBack ? '✓' : ''} Back
            </button>
          </div>
          
          {/* Main Side Navigation */}
          <div style={{ display: 'flex', background: '#d6d8db', borderBottom: '2px solid #bbb' }}>
            <button
              onClick={() => setActiveSide('front')}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: 'none',
                background: activeSide === 'front' ? '#28a745' : 'transparent',
                color: activeSide === 'front' ? 'white' : '#555',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '1px solid #bbb'
              }}
            >
              FRONT
            </button>
            <button
              onClick={() => setActiveSide('back')}
              style={{
                flex: 1,
                padding: '14px 16px',
                border: 'none',
                background: activeSide === 'back' ? '#28a745' : 'transparent',
                color: activeSide === 'back' ? 'white' : '#555',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              BACK
            </button>
          </div>
          
          {/* Tab Content */}
          <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            {activeSide === 'front' && (
              <>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Position Controls</h4>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Top Arc: {arcAmount.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={arcAmount}
                    onChange={(e) => setArcAmount(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Bottom Arc: {bottomArcAmount.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bottomArcAmount}
                    onChange={(e) => setBottomArcAmount(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Top Width: {topWidth}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="5"
                    value={topWidth}
                    onChange={(e) => setTopWidth(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Bottom Width: {bottomWidth}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="5"
                    value={bottomWidth}
                    onChange={(e) => setBottomWidth(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Vertical Position: {verticalPosition}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={verticalPosition}
                    onChange={(e) => setVerticalPosition(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Map Height: {mapHeight}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="10"
                    value={mapHeight}
                    onChange={(e) => setMapHeight(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Corner Radius: {bottomCornerRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="2"
                    value={bottomCornerRadius}
                    onChange={(e) => setBottomCornerRadius(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Vertical Squash: {verticalSquash.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.01"
                    value={verticalSquash}
                    onChange={(e) => setVerticalSquash(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '16px' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Fine Tuning</h5>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      H-Overlap: {horizontalOverlap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      value={horizontalOverlap}
                      onChange={(e) => setHorizontalOverlap(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Bottom Compensation: {bottomArcCompensation.toFixed(1)}px
                    </label>
                    <input
                      type="range"
                      min="-8"
                      max="8"
                      step="0.5"
                      value={bottomArcCompensation}
                      onChange={(e) => setBottomArcCompensation(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      V-Overlap: {verticalOverlap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={verticalOverlap}
                      onChange={(e) => setVerticalOverlap(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Blur: {blurAmount.toFixed(1)}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={blurAmount}
                      onChange={(e) => setBlurAmount(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Blend: {blendOpacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.01"
                      value={blendOpacity}
                      onChange={(e) => setBlendOpacity(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                
                {/* Visual Controls Section */}
                <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '16px', marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Visual Effects</h4>
                  <VisualControls
                    whiteThreshold={whiteThreshold}
                    setWhiteThreshold={setWhiteThreshold}
                    engravingOpacity={engravingOpacity}
                    setEngravingOpacity={setEngravingOpacity}
                  />
                  
                  {/* Cylindrical Wrapping Controls */}
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Cylindrical Wrapping</h5>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                        Front Portion: {(frontPortionSize * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="0.6"
                        step="0.05"
                        value={frontPortionSize}
                        onChange={(e) => setFrontPortionSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                        Side Gap: {(sideGapSize * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.2"
                        step="0.01"
                        value={sideGapSize}
                        onChange={(e) => setSideGapSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                        Back Portion: {(backPortionSize * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="0.6"
                        step="0.05"
                        value={backPortionSize}
                        onChange={(e) => setBackPortionSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* BACK tab controls */}
            {activeSide === 'back' && (
              <>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Back Side - Position Controls</h4>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Top Arc: {backArcAmount.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={backArcAmount}
                    onChange={(e) => setBackArcAmount(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Bottom Arc: {backBottomArcAmount.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={backBottomArcAmount}
                    onChange={(e) => setBackBottomArcAmount(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Top Width: {backTopWidth}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="5"
                    value={backTopWidth}
                    onChange={(e) => setBackTopWidth(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Bottom Width: {backBottomWidth}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="5"
                    value={backBottomWidth}
                    onChange={(e) => setBackBottomWidth(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Vertical Position: {backVerticalPosition}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="5"
                    value={backVerticalPosition}
                    onChange={(e) => setBackVerticalPosition(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Map Height: {backMapHeight}px
                  </label>
                  <input
                    type="range"
                    min="200"
                    max="600"
                    step="10"
                    value={backMapHeight}
                    onChange={(e) => setBackMapHeight(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Corner Radius: {backBottomCornerRadius}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="2"
                    value={backBottomCornerRadius}
                    onChange={(e) => setBackBottomCornerRadius(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
          
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    Vertical Squash: {backVerticalSquash.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.7"
                    max="1.3"
                    step="0.01"
                    value={backVerticalSquash}
                    onChange={(e) => setBackVerticalSquash(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '16px' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Fine Tuning</h5>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      H-Overlap: {backHorizontalOverlap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="8"
                      step="1"
                      value={backHorizontalOverlap}
                      onChange={(e) => setBackHorizontalOverlap(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Bottom Compensation: {backBottomArcCompensation.toFixed(1)}px
                    </label>
                    <input
                      type="range"
                      min="-8"
                      max="8"
                      step="0.5"
                      value={backBottomArcCompensation}
                      onChange={(e) => setBackBottomArcCompensation(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      V-Overlap: {backVerticalOverlap}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="4"
                      step="1"
                      value={backVerticalOverlap}
                      onChange={(e) => setBackVerticalOverlap(parseInt(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Blur: {backBlurAmount.toFixed(1)}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="0.1"
                      value={backBlurAmount}
                      onChange={(e) => setBackBlurAmount(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Blend: {backBlendOpacity.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.01"
                      value={backBlendOpacity}
                      onChange={(e) => setBackBlendOpacity(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
                
                {/* Visual Controls Section */}
                <div style={{ borderTop: '2px solid #dee2e6', paddingTop: '16px', marginTop: '20px' }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Visual Effects</h4>
                  <VisualControls
                    whiteThreshold={backWhiteThreshold}
                    setWhiteThreshold={setBackWhiteThreshold}
                    engravingOpacity={backEngravingOpacity}
                    setEngravingOpacity={setBackEngravingOpacity}
                  />
                  
                  {/* Cylindrical Wrapping Controls */}
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginTop: '16px' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Cylindrical Wrapping</h5>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                        Front Portion: {(frontPortionSize * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="0.6"
                        step="0.05"
                        value={frontPortionSize}
                        onChange={(e) => setFrontPortionSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                        Side Gap: {(sideGapSize * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.2"
                        step="0.01"
                        value={sideGapSize}
                        onChange={(e) => setSideGapSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                        Back Portion: {(backPortionSize * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0.2"
                        max="0.6"
                        step="0.05"
                        value={backPortionSize}
                        onChange={(e) => setBackPortionSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Export/Import - Outside of tabs */}
          <SettingsExport settings={{
            arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, 
            mapHeight, bottomCornerRadius, verticalSquash, horizontalOverlap, 
            bottomArcCompensation, verticalOverlap, blurAmount, blendOpacity,
            whiteThreshold, engravingOpacity
          }} />
        </div>
        
        {/* Canvas */}
        <div>
          <canvas 
            ref={canvasRef}
            style={{ border: '1px solid #ccc', background: 'white' }}
          />
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            <p>Red dashed line = transformed bounds</p>
            <p>Top arc simulates tilted glass rim view</p>
            <p>Bottom arc simulates base curve distortion</p>
            <p>Taper simulates perspective</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTransform;