import React, { useEffect, useRef, useState } from 'react';

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
  
  // Smoothing parameters - Optimized defaults for rocks glass mapping
  const [horizontalOverlap, setHorizontalOverlap] = useState(1); // Horizontal strip overlap in pixels
  const [bottomArcCompensation, setBottomArcCompensation] = useState(2); // Additional bottom arc compensation
  const [verticalOverlap, setVerticalOverlap] = useState(1); // Vertical slice overlap in pixels
  const [blurAmount, setBlurAmount] = useState(0); // Post-processing blur amount
  const [blendOpacity, setBlendOpacity] = useState(0.85); // Overlap blending opacity
  
  // Tab state
  const [activeTab, setActiveTab] = useState('position');
  
  // Visual effects parameters
  const [whiteTransparency, setWhiteTransparency] = useState(0.8); // 0 = no transparency, 1 = full white removal
  
  // Load both images
  useEffect(() => {
    // Load map design (overlay)
    const mapImg = new Image();
    mapImg.onload = () => setTestImage(mapImg);
    mapImg.src = '/glass-images/rocks-test-design.png';
    
    // Load glass background
    const glassImg = new Image();
    glassImg.onload = () => {
      console.log('Glass image loaded:', glassImg.width, 'x', glassImg.height);
      setGlassImage(glassImg);
    };
    glassImg.onerror = (e) => console.error('Failed to load glass image:', e);
    glassImg.src = '/glass-images/rocks-white.jpg';
  }, []);
  
  // Apply arc/perspective transform with configurable overlap blending
  const applyArcTransform = (ctx, image, x, y, width, height) => {
    // Pre-process: Apply white transparency first
    let processedImage = image;
    if (whiteTransparency > 0) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      // Draw original image
      tempCtx.drawImage(image, 0, 0);
      
      // Get image data for pixel manipulation
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;
      
      // Process each pixel to make white areas transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate brightness (0-255)
        const brightness = (r + g + b) / 3;
        
        // If pixel is bright (close to white), make it transparent
        const whitenessThreshold = 200; // Adjust this to control what counts as "white"
        if (brightness > whitenessThreshold) {
          const transparency = ((brightness - whitenessThreshold) / (255 - whitenessThreshold)) * whiteTransparency;
          data[i + 3] = Math.max(0, data[i + 3] * (1 - transparency)); // Reduce alpha
        }
      }
      
      // Put modified data back
      tempCtx.putImageData(imageData, 0, 0);
      processedImage = tempCanvas;
    }
    
    // Pre-process: Create rounded corner version of source image if needed
    if (bottomCornerRadius > 0) {
      // Create a temporary canvas for rounded source image
      const roundedCanvas = document.createElement('canvas');
      roundedCanvas.width = processedImage.width;
      roundedCanvas.height = processedImage.height;
      const roundedCtx = roundedCanvas.getContext('2d');
      
      // Calculate corner radius relative to image size
      const imageCornerRadius = bottomCornerRadius * (processedImage.width / width); // Scale radius to source image
      
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
    // Enable canvas smoothing for better blending
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Use horizontal strips with configurable overlap - maximum density for perfect smoothness
    const strips = 160;
    const stripHeight = height / strips;
    const sourceStripHeight = sourceHeight / strips;
    
    for (let i = 0; i < strips; i++) {
      const progress = i / (strips - 1); // 0 to 1 from top to bottom
      
      // Calculate dynamic overlap based on arc distortion FIRST
      let currentHorizontalOverlap = horizontalOverlap;
      if (progress < 0.4 && arcAmount > 0) {
        const arcProgress = progress / 0.4;
        const distortionFactor = arcAmount * (1 - arcProgress);
        currentHorizontalOverlap = horizontalOverlap + (distortionFactor * 4); // Scale factor for compensation
      } else if (progress > 0.6 && bottomArcAmount > 0) {
        const bottomArcProgress = (progress - 0.6) / 0.4;
        const distortionFactor = bottomArcAmount * bottomArcProgress;
        // Use manual compensation slider instead of automatic calculation
        currentHorizontalOverlap = horizontalOverlap + (bottomArcCompensation * bottomArcProgress);
      }
      
      // Add overlap to source sampling using dynamic overlap (within cropped area)
      const cropSourceY = sourceY + Math.max(0, i * sourceStripHeight - currentHorizontalOverlap/2);
      const actualSourceHeight = Math.min(sourceStripHeight + currentHorizontalOverlap, sourceHeight - (cropSourceY - sourceY));
      
      // Calculate width at this height using linear interpolation (no per-strip corner radius)
      const currentWidth = topWidth + (bottomWidth - topWidth) * progress;
      
      // Calculate Y position with optional vertical squash and overlap
      const destY = y + (i * stripHeight * verticalSquash) - (i > 0 ? currentHorizontalOverlap/2 : 0);
      const actualDestHeight = stripHeight * verticalSquash + (i > 0 ? currentHorizontalOverlap/2 : 0);
      
      // Calculate arc offset for this row
      let arcOffsetForRow = 0;
      
      // Top arc (affects top 40%)
      if (progress < 0.4) {
        const arcProgress = progress / 0.4;
        arcOffsetForRow = arcAmount * height * 0.1 * (1 - arcProgress);
      }
      
      // Bottom arc (affects bottom 40%) - negative offset to compress strips
      if (progress > 0.6) {
        const bottomArcProgress = (progress - 0.6) / 0.4;
        const bottomArcOffset = bottomArcAmount * height * 0.1 * bottomArcProgress;
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
        ctx.globalAlpha = blendOpacity; // Configurable blending opacity
      } else {
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
      }
      
      // For the arc rows (top or bottom), apply arc warping
      const needsArcWarping = (progress < 0.4 && arcAmount > 0) || (progress > 0.6 && bottomArcAmount > 0);
      if (needsArcWarping) {
        // Draw this row with arc distortion and overlap - maximum density
        const subStrips = 100; // Subdivide for arc
        const subStripWidth = currentWidth / subStrips;
        
        for (let j = 0; j < subStrips; j++) {
          const subX = j / (subStrips - 1);
          const centerOffset = Math.abs(subX - 0.5) * 2;
          
          // Calculate arc distortion (separate from strip positioning)
          let arcDip = 0;
          if (progress < 0.4) {
            // Top arc: positive offset curves downward
            const arcProgress = progress / 0.4;
            const topArcOffset = arcAmount * height * 0.1 * (1 - arcProgress);
            arcDip = topArcOffset * (1 - centerOffset * centerOffset);
          } else if (progress > 0.6) {
            // Bottom arc: positive offset curves downward (like glass bottom)
            const bottomArcProgress = (progress - 0.6) / 0.4;
            const bottomArcDistortion = bottomArcAmount * height * 0.1 * bottomArcProgress;
            arcDip = bottomArcDistortion * (1 - centerOffset * centerOffset);
          }
          
          // Add configurable horizontal overlap for vertical slices (within cropped area)
          const actualSubWidth = subStripWidth + (j > 0 ? verticalOverlap : 0);
          const subSourceX = sourceX + Math.max(0, (j / subStrips) * sourceWidth - (j > 0 ? verticalOverlap/2 : 0));
          const subSourceWidth = Math.min(sourceWidth / subStrips + verticalOverlap, sourceWidth - (subSourceX - sourceX));
          
          ctx.drawImage(
            processedImage,
            subSourceX, cropSourceY, subSourceWidth, actualSourceHeight,
            destX + j * subStripWidth - (j > 0 ? verticalOverlap/2 : 0), destY + arcDip, 
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
    
    // Apply arc transform over the glass background using dynamic positioning and height
    applyArcTransform(ctx, testImage, 200, verticalPosition, 400, mapHeight);
    
    
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
    
    // Draw reference bounds (modified to show arc)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw arc guide at top using actual overlay dimensions
    ctx.beginPath();
    const steps = 20;
    const topStartX = 200 + (400 - topWidth) / 2; // Center the top width within the 400px area
    for (let i = 0; i <= steps; i++) {
      const x = topStartX + (i / steps) * topWidth;
      const normalizedX = i / steps;
      const centerOffset = Math.abs(normalizedX - 0.5) * 2;
      const arcOffset = arcAmount * mapHeight * 0.15 * (1 - centerOffset * centerOffset);
      const y = verticalPosition + arcOffset;
      
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Draw bottom arc guide using actual bottom width
    ctx.beginPath();
    const actualBottomWidth = bottomWidth;
    const bottomStartX = 200 + (400 - actualBottomWidth) / 2; // Center the bottom width within the 400px area
    
    if (bottomArcAmount > 0) {
      // Draw bottom arc
      const steps = 20;
      for (let i = 0; i <= steps; i++) {
        const x = bottomStartX + (i / steps) * actualBottomWidth;
        const normalizedX = i / steps;
        const centerOffset = Math.abs(normalizedX - 0.5) * 2;
        const bottomArcOffset = bottomArcAmount * mapHeight * 0.1 * (1 - centerOffset * centerOffset);
        const y = (verticalPosition + mapHeight) + bottomArcOffset; // Add to curve downward (glass bottom shape)
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
    } else {
      // Draw straight bottom line
      ctx.moveTo(bottomStartX, verticalPosition + mapHeight);
      ctx.lineTo(bottomStartX + actualBottomWidth, verticalPosition + mapHeight);
    }
    ctx.stroke();
    
  }, [testImage, glassImage, arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, mapHeight, bottomCornerRadius, verticalSquash, horizontalOverlap, bottomArcCompensation, verticalOverlap, blurAmount, blendOpacity, whiteTransparency]);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Arc/Perspective Transform for Tilted Glass</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '20px' }}>
        {/* Controls */}
        <div style={{ background: '#f9f9f9', borderRadius: '8px', overflow: 'hidden' }}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', background: '#e9ecef' }}>
            <button
              onClick={() => setActiveTab('position')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: activeTab === 'position' ? '#007bff' : 'transparent',
                color: activeTab === 'position' ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Position
            </button>
            <button
              onClick={() => setActiveTab('visual')}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: activeTab === 'visual' ? '#007bff' : 'transparent',
                color: activeTab === 'visual' ? 'white' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Visual
            </button>
          </div>
          
          {/* Tab Content */}
          <div style={{ padding: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
            {activeTab === 'position' && (
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
              </>
            )}
            
            {activeTab === 'visual' && (
              <>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Visual Effects</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
                    White Transparency: {whiteTransparency.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={whiteTransparency}
                    onChange={(e) => setWhiteTransparency(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                    0 = no transparency, 1 = full white removal
                  </div>
                </div>
                
                <div style={{ padding: '20px', textAlign: 'center', color: '#666', borderTop: '1px solid #eee', marginTop: '16px' }}>
                  Additional visual effects coming next:
                  <br />
                  <small>Engraving depth, highlights, shadows, etc.</small>
                </div>
              </>
            )}
          </div>
          
          {/* Export/Import - Outside of tabs */}
          <div style={{ borderTop: '1px solid #ddd', padding: '12px', background: '#f8f9fa' }}>
            <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>Export Settings</h5>
          
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <button 
                onClick={() => {
                  const settings = {
                    arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, 
                    mapHeight, bottomCornerRadius, verticalSquash, horizontalOverlap, 
                    bottomArcCompensation, verticalOverlap, blurAmount, blendOpacity,
                    whiteTransparency
                  };
                  navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
                  alert('Settings copied!');
                }}
                style={{ 
                  flex: 1, padding: '6px 10px', backgroundColor: '#007bff', color: 'white', 
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                }}
              >
                Copy JSON
              </button>
              
              <button 
                onClick={() => {
                  const settings = `arcAmount: ${arcAmount}, bottomArcAmount: ${bottomArcAmount}, topWidth: ${topWidth}, bottomWidth: ${bottomWidth}, verticalPosition: ${verticalPosition}, mapHeight: ${mapHeight}, bottomCornerRadius: ${bottomCornerRadius}, verticalSquash: ${verticalSquash}, horizontalOverlap: ${horizontalOverlap}, bottomArcCompensation: ${bottomArcCompensation}, verticalOverlap: ${verticalOverlap}, blurAmount: ${blurAmount}, blendOpacity: ${blendOpacity}, whiteTransparency: ${whiteTransparency}`;
                  navigator.clipboard.writeText(settings);
                  alert('One-line copied!');
                }}
                style={{ 
                  flex: 1, padding: '6px 10px', backgroundColor: '#28a745', color: 'white', 
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
                }}
              >
                Copy Line
              </button>
            </div>
          </div>
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