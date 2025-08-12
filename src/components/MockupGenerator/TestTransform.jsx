import React, { useEffect, useRef, useState } from 'react';
import { processImageForEngraving } from './utils/imageProcessing';
import VisualControls from './components/VisualControls';
import SettingsExport from './components/SettingsExport';

const TestTransform = () => {
  const canvasRef = useRef(null);
  const [testImage, setTestImage] = useState(null);
  const [glassImage, setGlassImage] = useState(null);
  
  // Transform parameters - Optimized defaults for rocks glass mapping
  const [arcAmount, setArcAmount] = useState(0.36); // How much the top curves (0 = flat, 1 = very curved)
  const [bottomArcAmount, setBottomArcAmount] = useState(0.68); // How much the bottom curves (0 = flat, 1 = very curved)
  const [topWidth, setTopWidth] = useState(425); // Width at top of overlay
  const [bottomWidth, setBottomWidth] = useState(430); // Width at bottom of overlay  
  const [verticalPosition, setVerticalPosition] = useState(60); // Y position of top of overlay
  const [mapHeight, setMapHeight] = useState(460); // Height of overlay area (no distortion)
  const [bottomCornerRadius, setBottomCornerRadius] = useState(0); // Radius for bottom left/right corners
  const [perspectiveTaper, setPerspectiveTaper] = useState(0.8); // Bottom width relative to top (1 = rectangle, 0.5 = strong taper) - LEGACY
  const [verticalSquash, setVerticalSquash] = useState(1.0); // Vertical compression for ellipse effect
  
  // New adaptive rendering parameters
  const [renderQuality, setRenderQuality] = useState(1.0); // Overall strip density multiplier (0.5-2.0)
  const [adaptiveStrength, setAdaptiveStrength] = useState(0.5); // How much to concentrate strips in curves (0-1)
  const [overlapMultiplier, setOverlapMultiplier] = useState(1.0); // Fine-tune auto-calculated overlaps (0.5-2.0)
  
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
  
  // BACK LAYER: Transform parameters - Optimized defaults for back layer
  const [backArcAmount, setBackArcAmount] = useState(0.47);
  const [backBottomArcAmount, setBackBottomArcAmount] = useState(1.0);
  const [backTopWidth, setBackTopWidth] = useState(425);
  const [backBottomWidth, setBackBottomWidth] = useState(430);
  const [backVerticalPosition, setBackVerticalPosition] = useState(100);
  const [backMapHeight, setBackMapHeight] = useState(460);
  const [backBottomCornerRadius, setBackBottomCornerRadius] = useState(0);
  const [backVerticalSquash, setBackVerticalSquash] = useState(1.0);
  
  // BACK LAYER: Adaptive rendering parameters
  const [backRenderQuality, setBackRenderQuality] = useState(1.0);
  const [backAdaptiveStrength, setBackAdaptiveStrength] = useState(0.5);
  const [backOverlapMultiplier, setBackOverlapMultiplier] = useState(1.0);
  
  // BACK LAYER: Visual effects parameters
  const [backWhiteThreshold, setBackWhiteThreshold] = useState(240);
  const [backEngravingOpacity, setBackEngravingOpacity] = useState(0.10); // Much lighter for back layer depth effect
  
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
  // Adaptive strip distribution for eliminating visible seams
  const getAdaptiveStrips = (quality, adaptiveStrength, height) => {
    const baseStrips = Math.floor(80 * quality); // Base strip count with quality multiplier
    const totalStrips = Math.max(20, baseStrips); // Minimum 20 strips
    
    // Distribute strips based on curvature areas
    const topCurveRatio = 0.35 * (1 + adaptiveStrength * 0.6); // More strips in curved areas when adaptive is high
    const middleRatio = 0.3 * (1 - adaptiveStrength * 0.4);    // Fewer strips in flat areas when adaptive is high  
    const bottomCurveRatio = 0.35 * (1 + adaptiveStrength * 0.6);
    
    // Normalize ratios
    const totalRatio = topCurveRatio + middleRatio + bottomCurveRatio;
    const normalizedTop = topCurveRatio / totalRatio;
    const normalizedMiddle = middleRatio / totalRatio;
    const normalizedBottom = bottomCurveRatio / totalRatio;
    
    return {
      topCurve: Math.max(5, Math.floor(totalStrips * normalizedTop)),
      middle: Math.max(5, Math.floor(totalStrips * normalizedMiddle)), 
      bottomCurve: Math.max(5, Math.floor(totalStrips * normalizedBottom)),
      total: totalStrips
    };
  };
  
  // Auto-calculate overlap based on strip height and curvature
  const calculateOverlap = (stripHeight, curvatureAmount, multiplier) => {
    const baseOverlap = stripHeight * 0.08; // 8% of strip height as base
    const curveBonus = curvatureAmount * stripHeight * 0.15; // Extra overlap in curved areas
    return Math.max(0, (baseOverlap + curveBonus) * multiplier);
  };

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
      renderQuality: backRenderQuality,
      adaptiveStrength: backAdaptiveStrength,
      overlapMultiplier: backOverlapMultiplier,
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
      renderQuality,
      adaptiveStrength,
      overlapMultiplier,
      whiteThreshold,
      engravingOpacity
    };
    
    // Extract portion of image for this layer (front/back cylindrical wrapping)
    const portion = getImagePortionForSide(image, isBackLayer ? 'back' : 'front');
    const portionCanvas = document.createElement('canvas');
    portionCanvas.width = portion.sourceWidth;
    portionCanvas.height = image.height;
    const portionCtx = portionCanvas.getContext('2d');
    
    const portionSourceX = portion.sourceX;
    const portionSourceWidth = portion.sourceWidth;
    
    // Handle horizontal flipping for back layer viewing through glass
    if (portion.flip) {
      // For back side: flip horizontally (viewed through glass)
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
      const imageCornerRadius = params.bottomCornerRadius * (processedImage.width / width);
      
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
      sourceX = (processedImage.width - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // Source is taller - crop vertically, use full width  
      sourceWidth = processedImage.width;
      sourceHeight = sourceWidth / targetAspectRatio;
      sourceX = 0;
      sourceY = (processedImage.height - sourceHeight) / 2;
    }
    
    // Enable high-quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Get adaptive strip distribution
    const stripDistribution = getAdaptiveStrips(params.renderQuality, params.adaptiveStrength, height);
    
    // Create strip regions with different densities
    const regions = [
      { name: 'topCurve', strips: stripDistribution.topCurve, startRatio: 0, endRatio: 0.35 },
      { name: 'middle', strips: stripDistribution.middle, startRatio: 0.35, endRatio: 0.65 },
      { name: 'bottomCurve', strips: stripDistribution.bottomCurve, startRatio: 0.65, endRatio: 1.0 }
    ];
    
    let stripIndex = 0;
    
    // Process each region with its adaptive strip count
    for (const region of regions) {
      const regionHeight = height * (region.endRatio - region.startRatio);
      const regionStripHeight = regionHeight / region.strips;
      const regionSourceHeight = sourceHeight * (region.endRatio - region.startRatio);
      const regionSourceStripHeight = regionSourceHeight / region.strips;
      
      for (let i = 0; i < region.strips; i++) {
        const localProgress = i / (region.strips - 1); // 0 to 1 within region
        const globalProgress = region.startRatio + localProgress * (region.endRatio - region.startRatio); // 0 to 1 across entire height
        
        // Calculate curvature at this position for overlap determination
        let curvatureAmount = 0;
        
        if (region.name === 'topCurve') {
          const arcProgress = localProgress; // 0 at top of region, 1 at bottom of region
          curvatureAmount = params.arcAmount * (1 - arcProgress); // Max curvature at top
        } else if (region.name === 'bottomCurve') {
          const arcProgress = localProgress; // 0 at top of region, 1 at bottom of region  
          curvatureAmount = params.bottomArcAmount * arcProgress; // Max curvature at bottom
        }
        
        // Auto-calculate overlap based on strip height and curvature
        const currentOverlap = calculateOverlap(regionStripHeight, curvatureAmount, params.overlapMultiplier);
        
        // Source sampling with overlap
        const regionSourceStart = sourceY + sourceHeight * region.startRatio;
        const cropSourceY = regionSourceStart + Math.max(0, i * regionSourceStripHeight - currentOverlap / 2);
        const cropSourceHeight = Math.min(regionSourceStripHeight + currentOverlap, 
                                         regionSourceHeight - (cropSourceY - regionSourceStart));
        
        // Calculate position and dimensions with transform applied
        const currentY = y + height * region.startRatio + i * regionStripHeight;
        
        // Interpolate width based on top/bottom settings
        const currentWidth = params.topWidth + (params.bottomWidth - params.topWidth) * globalProgress;
        const centerOffsetX = x + (width - currentWidth) / 2;
        
        // Arc distortion calculations
        const centerDistance = Math.abs(globalProgress - 0.5) * 2; // 0 at center, 1 at edges
        
        let arcDip = 0;
        if (region.name === 'topCurve') {
          const arcProgress = 1 - localProgress; // 1 at top of region, 0 at bottom
          const arcDirection = isBackLayer ? -1 : 1;
          arcDip = params.arcAmount * height * 0.15 * arcProgress * arcDirection;
        } else if (region.name === 'bottomCurve') {
          const arcProgress = localProgress; // 0 at top of region, 1 at bottom
          const arcDirection = isBackLayer ? -1 : 1;
          arcDip = params.bottomArcAmount * height * 0.1 * arcProgress * arcDirection;
        }
        
        // Apply vertical squash effect
        const squashedStripHeight = regionStripHeight * params.verticalSquash;
        const verticalSquashOffset = (regionStripHeight - squashedStripHeight) / 2;
        
        // Final destination calculations
        const destX = centerOffsetX;
        const destY = currentY + arcDip + verticalSquashOffset;
        const destWidth = currentWidth;
        const destHeight = squashedStripHeight;
        
        // Apply gentle blending for smooth transitions
        if (currentOverlap > 0 && stripIndex > 0) {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.9; // Subtle blending
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }
        
        // High-precision horizontal subdivision for arc areas
        const subStrips = region.name !== 'middle' ? 80 : 20; // More subdivisions in curved areas
        const subStripWidth = destWidth / subStrips;
        
        for (let j = 0; j < subStrips; j++) {
          const subHorizontalNormalized = j / (subStrips - 1); // 0 to 1 left to right
          const subCenterDistance = Math.abs(subHorizontalNormalized - 0.5) * 2; // 0 at center, 1 at edges
          
          // Calculate precise arc effects for this sub-strip
          let subArcDip = 0;
          if (region.name === 'topCurve') {
            const arcProgress = 1 - localProgress;
            const arcDirection = isBackLayer ? -1 : 1;
            subArcDip = params.arcAmount * height * 0.15 * arcProgress * (1 - subCenterDistance * subCenterDistance) * arcDirection;
          } else if (region.name === 'bottomCurve') {
            const arcProgress = localProgress;
            const arcDirection = isBackLayer ? -1 : 1;
            subArcDip = params.bottomArcAmount * height * 0.1 * arcProgress * (1 - subCenterDistance * subCenterDistance) * arcDirection;
          }
          
          // Source sampling for sub-strip
          const subSourceX = sourceX + (j / subStrips) * sourceWidth;
          const subSourceWidth = sourceWidth / subStrips;
          
          ctx.drawImage(
            processedImage,
            subSourceX, cropSourceY, subSourceWidth, cropSourceHeight,
            destX + j * subStripWidth, destY + subArcDip, 
            subStripWidth, destHeight
          );
        }
        
        stripIndex++;
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
    
    
    // Adaptive strip rendering eliminates the need for manual blur post-processing
    
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
    
  }, [testImage, glassImage, arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, mapHeight, bottomCornerRadius, verticalSquash, renderQuality, adaptiveStrength, overlapMultiplier, whiteThreshold, engravingOpacity, showFront, showBack, backArcAmount, backBottomArcAmount, backTopWidth, backBottomWidth, backVerticalPosition, backMapHeight, backBottomCornerRadius, backVerticalSquash, backRenderQuality, backAdaptiveStrength, backOverlapMultiplier, backWhiteThreshold, backEngravingOpacity, activeSide, frontPortionSize, sideGapSize, backPortionSize]);
  
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
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Adaptive Rendering</h5>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Render Quality: {renderQuality.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={renderQuality}
                      onChange={(e) => setRenderQuality(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Adaptive Strength: {adaptiveStrength.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={adaptiveStrength}
                      onChange={(e) => setAdaptiveStrength(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Overlap Multiplier: {overlapMultiplier.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={overlapMultiplier}
                      onChange={(e) => setOverlapMultiplier(parseFloat(e.target.value))}
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
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Adaptive Rendering</h5>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Render Quality: {backRenderQuality.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={backRenderQuality}
                      onChange={(e) => setBackRenderQuality(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Adaptive Strength: {backAdaptiveStrength.toFixed(2)}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={backAdaptiveStrength}
                      onChange={(e) => setBackAdaptiveStrength(parseFloat(e.target.value))}
                      style={{ width: '100%' }}
                    />
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '2px', fontSize: '12px', fontWeight: '500' }}>
                      Overlap Multiplier: {backOverlapMultiplier.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={backOverlapMultiplier}
                      onChange={(e) => setBackOverlapMultiplier(parseFloat(e.target.value))}
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
            // Front layer parameters
            front: {
              arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, 
              mapHeight, bottomCornerRadius, verticalSquash, renderQuality, 
              adaptiveStrength, overlapMultiplier, whiteThreshold, engravingOpacity
            },
            // Back layer parameters  
            back: {
              arcAmount: backArcAmount, bottomArcAmount: backBottomArcAmount, 
              topWidth: backTopWidth, bottomWidth: backBottomWidth, 
              verticalPosition: backVerticalPosition, mapHeight: backMapHeight, 
              bottomCornerRadius: backBottomCornerRadius, verticalSquash: backVerticalSquash, 
              renderQuality: backRenderQuality, adaptiveStrength: backAdaptiveStrength, 
              overlapMultiplier: backOverlapMultiplier, whiteThreshold: backWhiteThreshold, 
              engravingOpacity: backEngravingOpacity
            },
            // Cylindrical wrapping parameters
            cylindrical: {
              frontPortionSize, sideGapSize, backPortionSize
            }
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