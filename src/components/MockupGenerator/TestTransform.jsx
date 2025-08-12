import React, { useEffect, useRef, useState } from 'react';
import { processImageForEngraving } from './utils/imageProcessing';
import VisualControls from './components/VisualControls';
import SettingsExport from './components/SettingsExport';

const TestTransform = () => {
  const canvasRef = useRef(null);
  const [testImage, setTestImage] = useState(null);
  const [glassImage, setGlassImage] = useState(null);
  
  // Transform parameters - Optimized defaults for rocks glass mapping  
  const [arcAmount, setArcAmount] = useState(0.36); // Continuous parabolic arc across full height (0 = flat, 1 = very curved)
  const [topWidth, setTopWidth] = useState(425); // Width at top of overlay
  const [bottomWidth, setBottomWidth] = useState(430); // Width at bottom of overlay  
  const [verticalPosition, setVerticalPosition] = useState(60); // Y position of top of overlay
  const [mapHeight, setMapHeight] = useState(460); // Height of overlay area (no distortion)
  const [bottomCornerRadius, setBottomCornerRadius] = useState(0); // Radius for bottom left/right corners
  const [perspectiveTaper, setPerspectiveTaper] = useState(0.8); // Bottom width relative to top (1 = rectangle, 0.5 = strong taper) - LEGACY
  const [verticalSquash, setVerticalSquash] = useState(1.0); // Vertical compression for ellipse effect
  
  // New adaptive rendering parameters
  const [renderQuality, setRenderQuality] = useState(1.5); // Overall strip density multiplier (0.5-2.0) - Higher default
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
  const [backArcAmount, setBackArcAmount] = useState(0.47); // Continuous parabolic arc across full height
  const [backTopWidth, setBackTopWidth] = useState(425);
  const [backBottomWidth, setBackBottomWidth] = useState(430);
  const [backVerticalPosition, setBackVerticalPosition] = useState(100);
  const [backMapHeight, setBackMapHeight] = useState(460);
  const [backBottomCornerRadius, setBackBottomCornerRadius] = useState(0);
  const [backVerticalSquash, setBackVerticalSquash] = useState(1.0);
  
  // BACK LAYER: Adaptive rendering parameters
  const [backRenderQuality, setBackRenderQuality] = useState(1.5);
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
  // Calculate continuous arc distortion - single smooth curve across full height
  const calculateDistortionFactor = (progress, arcAmount, arcProfile = 'parabolic') => {
    if (arcAmount <= 0) return 0;
    
    let distortionFactor = 0;
    
    switch (arcProfile) {
      case 'parabolic':
        // Inverted parabolic curve: maximum at edges (glass rim), minimum at center
        // Formula: arcAmount * (1 - 4 * progress * (1 - progress))
        // This curves the top and bottom edges outward to match glass rim curvature
        distortionFactor = arcAmount * 0.15 * (1 - 4 * progress * (1 - progress));
        break;
        
      case 'sinusoidal':
        // Sinusoidal curve: smooth bell shape
        distortionFactor = arcAmount * 0.15 * Math.sin(Math.PI * progress);
        break;
        
      default:
        // Parabolic as default
        distortionFactor = arcAmount * 0.15 * 4 * progress * (1 - progress);
        break;
    }
    
    return distortionFactor;
  };

  // Generate precise strip distribution based on mathematical arc analysis
  const getPreciseStripDistribution = (quality, adaptiveStrength, arcAmount, arcProfile, totalHeight) => {
    const baseStripCount = Math.floor(200 * quality); // Much higher base count for precision
    const samplePoints = 200; // Sample distortion at 200 points for precision
    
    // Calculate distortion factor at each sample point
    const distortionProfile = [];
    let totalDistortion = 0;
    let maxDistortion = 0;
    
    for (let i = 0; i < samplePoints; i++) {
      const progress = i / (samplePoints - 1);
      const distortion = calculateDistortionFactor(progress, arcAmount, arcProfile);
      
      // Apply exponential adaptive strength for extreme concentration in distorted areas
      const adaptedDistortion = distortion > 0 ? 
        Math.pow(distortion * 3, 1 + adaptiveStrength * 2) : 0; // Much more aggressive concentration
      
      maxDistortion = Math.max(maxDistortion, distortion);
      distortionProfile.push(adaptedDistortion);
      totalDistortion += adaptedDistortion;
    }
    
    console.log(`Distortion Debug - Max distortion: ${maxDistortion.toFixed(4)}, Total adapted: ${totalDistortion.toFixed(2)}, Arc amount: ${arcAmount}, Profile: ${arcProfile} (INVERTED - max at edges)`);
    
    // Distribute strips proportional to distortion, with minimum density for flat areas
    const minStripDensity = 0.3; // Minimum 30% of average density even in flat areas
    const averageDensity = baseStripCount / samplePoints;
    const stripCounts = [];
    let allocatedStrips = 0;
    
    for (let i = 0; i < samplePoints; i++) {
      let density;
      
      if (totalDistortion > 0) {
        // Proportional allocation based on distortion
        const proportionalDensity = (distortionProfile[i] / totalDistortion) * baseStripCount;
        density = Math.max(proportionalDensity, averageDensity * minStripDensity);
      } else {
        // Uniform distribution if no distortion
        density = averageDensity;
      }
      
      const strips = Math.max(1, Math.round(density));
      stripCounts.push(strips);
      allocatedStrips += strips;
    }
    
    // Normalize to exact target count
    const scaleFactor = baseStripCount / allocatedStrips;
    for (let i = 0; i < stripCounts.length; i++) {
      stripCounts[i] = Math.max(1, Math.round(stripCounts[i] * scaleFactor));
    }
    
    return {
      stripCounts,
      distortionProfile,
      totalStrips: stripCounts.reduce((sum, count) => sum + count, 0)
    };
  };
  
  // Calculate precise overlap based on local distortion gradient
  const calculatePreciseOverlap = (currentDistortion, nextDistortion, stripHeight, overlapMultiplier) => {
    // Much more aggressive base overlap
    const baseOverlap = stripHeight * 0.4; // Increased to 40% base overlap
    
    // Dramatic overlap increase based on distortion difference
    const distortionGradient = Math.abs(nextDistortion - currentDistortion);
    const gradientBonus = distortionGradient * stripHeight * 5.0; // Much stronger gradient compensation
    
    // Exponential overlap in high-distortion areas - much more aggressive for smaller distortions
    const maxDistortion = Math.max(currentDistortion, nextDistortion);
    // Scale up small distortions dramatically - anything above 0.01 gets massive bonus
    const scaledDistortion = maxDistortion > 0.01 ? Math.pow(maxDistortion * 20, 2) : maxDistortion;
    const distortionBonus = scaledDistortion * stripHeight * 8.0; // Much higher multiplier
    
    const totalOverlap = (baseOverlap + gradientBonus + distortionBonus) * overlapMultiplier;
    const finalOverlap = Math.min(stripHeight * 1.5, Math.max(stripHeight * 0.2, totalOverlap)); // Min 20%, Max 150%
    
    // Debug high overlap areas
    if (maxDistortion > 0.03) {
      console.log(`High overlap: distortion=${maxDistortion.toFixed(4)}, overlap=${(finalOverlap/stripHeight).toFixed(2)}x strip height`);
    }
    
    return finalOverlap;
  };

  const applyArcTransform = (ctx, image, x, y, width, height, isBackLayer = false) => {
    // Use back layer parameters if rendering back, otherwise use front
    const params = isBackLayer ? {
      arcAmount: backArcAmount,
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
    
    // Generate precise strip distribution based on exact arc math
    console.log(`Arc Debug - Arc Amount: ${params.arcAmount}, Quality: ${params.renderQuality}`);
    const stripDistribution = getPreciseStripDistribution(
      params.renderQuality, 
      params.adaptiveStrength, 
      params.arcAmount, 
      'parabolic', // Start with parabolic profile
      height
    );
    
    const { stripCounts, distortionProfile } = stripDistribution;
    const samplePoints = stripCounts.length;
    
    // Convert sample-based distribution to actual strips
    let currentY = y;
    let currentSourceY = sourceY;
    let stripIndex = 0;
    
    for (let sampleIndex = 0; sampleIndex < samplePoints; sampleIndex++) {
      const stripsInSample = stripCounts[sampleIndex];
      if (stripsInSample === 0) continue;
      
      const sampleProgress = sampleIndex / (samplePoints - 1);
      const nextSampleProgress = Math.min(1, (sampleIndex + 1) / (samplePoints - 1));
      
      const sampleHeight = height * (nextSampleProgress - sampleProgress);
      const sampleSourceHeight = sourceHeight * (nextSampleProgress - sampleProgress);
      
      const stripHeight = sampleHeight / stripsInSample;
      const sourceStripHeight = sampleSourceHeight / stripsInSample;
      
      // Get distortion factors for overlap calculation
      const currentDistortion = distortionProfile[sampleIndex];
      const nextDistortion = sampleIndex < samplePoints - 1 ? 
        distortionProfile[sampleIndex + 1] : currentDistortion;
      
      for (let stripInSample = 0; stripInSample < stripsInSample; stripInSample++) {
        const stripProgress = sampleProgress + (stripInSample / stripsInSample) * (nextSampleProgress - sampleProgress);
        
        // Calculate precise overlap based on distortion analysis
        const currentOverlap = calculatePreciseOverlap(
          currentDistortion, 
          nextDistortion, 
          stripHeight, 
          params.overlapMultiplier
        );
        
        // Source sampling with precise overlap
        const cropSourceY = currentSourceY + Math.max(0, stripInSample * sourceStripHeight - currentOverlap / 2);
        const cropSourceHeight = Math.min(
          sourceStripHeight + currentOverlap,
          sampleSourceHeight - (cropSourceY - currentSourceY)
        );
        
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
        
        // Final destination calculations
        const destX = centerOffsetX;
        const destY = currentY + stripInSample * stripHeight + arcDip + verticalSquashOffset;
        const destWidth = currentWidth;
        const destHeight = squashedStripHeight;
        
        // Apply aggressive blending based on overlap and distortion
        if (currentOverlap > stripHeight * 0.2 && stripIndex > 0) {
          ctx.globalCompositeOperation = 'source-over';
          // Much more aggressive alpha scaling based on overlap amount
          const overlapRatio = Math.min(1.0, currentOverlap / stripHeight);
          ctx.globalAlpha = Math.max(0.3, 1.0 - overlapRatio * 0.7); // Alpha from 30% to 100%
        } else if (currentDistortion > 0.01 && stripIndex > 0) {
          // Even in low overlap, use blending in distorted areas
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.7;
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1.0;
        }
        
        // Ultra-high precision horizontal subdivision based on distortion level
        const subStrips = currentDistortion > 0.05 ? 200 : 
                         currentDistortion > 0.01 ? 120 : 40; // Much more subdivisions in highly distorted areas
        const subStripWidth = destWidth / subStrips;
        
        for (let j = 0; j < subStrips; j++) {
          const subHorizontalNormalized = j / (subStrips - 1);
          const subCenterDistance = Math.abs(subHorizontalNormalized - 0.5) * 2;
          
          // Calculate continuous sub-arc effects
          const subArcDip = params.arcAmount * height * 0.15 * (1 - 4 * stripProgress * (1 - stripProgress)) * 
                           (1 - subCenterDistance * subCenterDistance) * arcDirection;
          
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
      
      // Advance Y positions for next sample
      currentY += sampleHeight;
      currentSourceY += sampleSourceHeight;
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
      arcAmount, topWidth, bottomWidth, verticalPosition, mapHeight
    } : {
      arcAmount: backArcAmount, topWidth: backTopWidth, bottomWidth: backBottomWidth, 
      verticalPosition: backVerticalPosition, mapHeight: backMapHeight
    };
    
    ctx.strokeStyle = activeSide === 'front' ? 'red' : 'blue';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw continuous parabolic arc guide across full height
    ctx.beginPath();
    const steps = 40; // More steps for smooth parabolic curve
    const topStartX = 200 + (400 - activeParams.topWidth) / 2;
    
    for (let i = 0; i <= steps; i++) {
      const progress = i / steps; // 0 to 1 from top to bottom
      
      // Interpolate X position based on width change
      const currentWidth = activeParams.topWidth + (activeParams.bottomWidth - activeParams.topWidth) * progress;
      const currentStartX = 200 + (400 - currentWidth) / 2;
      const x = currentStartX + (i / steps) * currentWidth;
      
      // Calculate inverted parabolic arc offset: maximum at edges (glass rim style)
      const arcOffset = activeParams.arcAmount * activeParams.mapHeight * 0.15 * (1 - 4 * progress * (1 - progress));
      const y = activeParams.verticalPosition + progress * activeParams.mapHeight + arcOffset;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw straight boundary lines (top and bottom of glass area)
    ctx.setLineDash([2, 2]); // Dotted lines for boundaries
    // Top boundary
    ctx.beginPath();
    ctx.moveTo(topStartX, activeParams.verticalPosition);
    ctx.lineTo(topStartX + activeParams.topWidth, activeParams.verticalPosition);
    ctx.stroke();
    
    // Bottom boundary  
    const bottomStartX = 200 + (400 - activeParams.bottomWidth) / 2;
    ctx.beginPath();
    ctx.moveTo(bottomStartX, activeParams.verticalPosition + activeParams.mapHeight);
    ctx.lineTo(bottomStartX + activeParams.bottomWidth, activeParams.verticalPosition + activeParams.mapHeight);
    ctx.stroke();
    
  }, [testImage, glassImage, arcAmount, topWidth, bottomWidth, verticalPosition, mapHeight, bottomCornerRadius, verticalSquash, renderQuality, adaptiveStrength, overlapMultiplier, whiteThreshold, engravingOpacity, showFront, showBack, backArcAmount, backTopWidth, backBottomWidth, backVerticalPosition, backMapHeight, backBottomCornerRadius, backVerticalSquash, backRenderQuality, backAdaptiveStrength, backOverlapMultiplier, backWhiteThreshold, backEngravingOpacity, activeSide, frontPortionSize, sideGapSize, backPortionSize]);
  
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
                    Arc Amount: {arcAmount.toFixed(2)}
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
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    Curves top/bottom edges outward (glass rim style)
                  </div>
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
                    Arc Amount: {backArcAmount.toFixed(2)}
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
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                    Curves top/bottom edges outward (glass rim style)
                  </div>
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
              arcAmount, topWidth, bottomWidth, verticalPosition, 
              mapHeight, bottomCornerRadius, verticalSquash, renderQuality, 
              adaptiveStrength, overlapMultiplier, whiteThreshold, engravingOpacity
            },
            // Back layer parameters  
            back: {
              arcAmount: backArcAmount, topWidth: backTopWidth, bottomWidth: backBottomWidth, 
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