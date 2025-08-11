import React, { useEffect, useRef, useState } from 'react';
import './GlassMockup2D.css';

const GlassMockupWrap = ({ rotation = 0, frontLayer = {}, backLayer = {}, layerControls = {} }) => {
  const canvasRef = useRef(null);
  const [glassImage, setGlassImage] = useState(null);
  const [mapDesign, setMapDesign] = useState(null);
  
  // Load glass base image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setGlassImage(img);
    img.src = '/glass-images/rocks-white.jpg';
  }, []);

  // Load map design that wraps 360 degrees
  useEffect(() => {
    const img = new Image();
    img.onload = () => setMapDesign(img);
    img.src = '/glass-images/rocks-test-design.png';
  }, []);

  // Clean, simple map preparation - no warping yet
  const createSimpleMap = (sourceMap, sourceX, visiblePortion) => {
    if (!sourceMap) {
      return null;
    }
    
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) {
      console.error('Could not get 2D context');
      return null;
    }

    // Get source dimensions
    const mapWidth = sourceMap.width || 100;
    const mapHeight = sourceMap.height || 100;
    const drawWidth = mapWidth * visiblePortion;
    
    tempCanvas.width = Math.floor(drawWidth);
    tempCanvas.height = Math.floor(mapHeight);

    // Calculate source position with wrapping
    let sourceMapX = sourceX;
    if (sourceMapX >= mapWidth) {
      sourceMapX -= mapWidth;
    }

    // Simple rectangular draw - no warping
    tempCtx.drawImage(
      sourceMap,
      sourceMapX, 0, drawWidth, mapHeight,
      0, 0, drawWidth, mapHeight
    );

    return tempCanvas;
  };


  useEffect(() => {
    if (!canvasRef.current || !glassImage || !mapDesign) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match glass image
    canvas.width = glassImage.width;
    canvas.height = glassImage.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base glass image
    ctx.drawImage(glassImage, 0, 0);
    
    // Define the visible area of the glass where engraving appears
    // Render both front and back layers if enabled
    const renderLayer = (layerData, isBackLayer = false) => {
      const glassArea = {
        centerX: canvas.width * 0.5,
        topY: canvas.height * (layerData.topY || 0.130),
        bottomY: canvas.height * (layerData.bottomY || 0.890),
        widthTop: canvas.width * (layerData.widthTop || 0.664),
        widthBottom: canvas.width * (layerData.widthBottom || 0.658),
        rimDipY: canvas.height * (layerData.rimDip || 0.250),
        bottomDipY: canvas.height * (layerData.bottomDip || 1.057),
      };

      // Calculate engraving dimensions
      const engravingHeight = glassArea.bottomY - glassArea.topY;
      const engravingWidth = (glassArea.widthTop + glassArea.widthBottom) / 2;
      
      // Calculate source position based on rotation
      const mapWidth = mapDesign.width;
      const mapHeight = mapDesign.height;
      const visiblePortion = 0.5;
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      const sourceXPercent = normalizedRotation / 360;
      let sourceX = mapWidth * sourceXPercent;
      
      // For back layer, offset by 180 degrees (half the map width)
      if (isBackLayer) {
        sourceX = (sourceX + mapWidth * 0.5) % mapWidth;
      }

      ctx.save();
      
      // Apply different visual effects for back layer
      if (isBackLayer) {
        ctx.globalAlpha = 0.4; // Much dimmer for back layer
        ctx.filter = 'blur(1px)'; // Slight blur for depth
      } else {
        ctx.globalAlpha = 0.7; // Standard front layer opacity
      }
      
      ctx.globalCompositeOperation = 'multiply';

      try {
        const simpleMap = createSimpleMap(
          mapDesign,
          sourceX,
          visiblePortion
        );
        
        if (simpleMap) {
          // Apply smooth trapezoid with gradual strips
          ctx.save();
          
          const height = glassArea.bottomY - glassArea.topY;
          const topWidth = glassArea.widthTop;
          const bottomWidth = glassArea.widthBottom;
          
          // Use 10 thin strips for smooth transition
          const strips = 10;
          const stripHeight = height / strips;
          const sourceStripHeight = simpleMap.height / strips;
          
          for (let i = 0; i < strips; i++) {
            const progress = i / (strips - 1); // 0 to 1
            
            // Interpolate width from top to bottom
            const currentWidth = topWidth + progress * (bottomWidth - topWidth);
            
            // Calculate Y position with rim curve
            let destY = glassArea.topY + i * stripHeight;
            
            // Add rim curve for top strips (first 30% of strips)
            if (progress < 0.3) {
              const rimProgress = progress / 0.3; // 0 to 1 within rim area
              const maxRimCurve = (glassArea.rimDipY - glassArea.topY);
              
              // Apply curve - strongest at center (50% of width), weaker at edges
              // For each strip, calculate curve based on X position across the width
              const curveAmount = maxRimCurve * (1 - rimProgress); // Fade curve as we go down
              
              // Apply the curve by shifting Y position down
              destY += curveAmount;
            }
            
            const sourceY = i * sourceStripHeight;
            
            ctx.drawImage(
              simpleMap,
              0, sourceY, simpleMap.width, sourceStripHeight,
              glassArea.centerX - currentWidth / 2, destY,
              currentWidth, stripHeight
            );
          }
          
          ctx.restore();
        } else {
          throw new Error('Could not create simple map');
        }
      } catch (error) {
        console.error(`Error creating ${isBackLayer ? 'back' : 'front'} layer:`, error);
        
        // Fallback: simple map without distortion
        const drawWidth = mapWidth * visiblePortion;
        ctx.drawImage(
          mapDesign,
          sourceX, 0, drawWidth, mapHeight,
          glassArea.centerX - engravingWidth / 2, glassArea.topY,
          engravingWidth, engravingHeight
        );
      }
      
      ctx.restore();
      
      return glassArea; // Return for debug outline
    };

    // Render layers based on visibility settings
    let debugGlassArea = null;
    
    // Back layer first (so it appears behind)
    if (layerControls.showBack) {
      debugGlassArea = renderLayer(backLayer, true);
    }
    
    // Front layer on top
    if (layerControls.showFront) {
      debugGlassArea = renderLayer(frontLayer, false);
    }
    
    // Use active layer for debug outline
    const activeLayerData = layerControls.activeLayer === 'front' ? frontLayer : backLayer;
    const glassArea = {
      centerX: canvas.width * 0.5,
      topY: canvas.height * (activeLayerData.topY || 0.130),
      bottomY: canvas.height * (activeLayerData.bottomY || 0.890),
      widthTop: canvas.width * (activeLayerData.widthTop || 0.664),
      widthBottom: canvas.width * (activeLayerData.widthBottom || 0.658),
      rimDipY: canvas.height * (activeLayerData.rimDip || 0.250),
      bottomDipY: canvas.height * (activeLayerData.bottomDip || 1.057),
    };
    
    // Debug overlay to show engraving area (remove this in production)
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 5]);
    
    // Draw shape with curved top and bottom to match clipping region
    ctx.beginPath();
    
    // Start at bottom left
    ctx.moveTo(glassArea.centerX - glassArea.widthBottom / 2, glassArea.bottomY);
    
    // Line to top left
    ctx.lineTo(glassArea.centerX - glassArea.widthTop / 2, glassArea.topY);
    
    // Curved top edge (concave dip for rim)
    ctx.quadraticCurveTo(
      glassArea.centerX,                    // Control point X (center)
      glassArea.rimDipY,                    // Control point Y (dipped down to this Y position)
      glassArea.centerX + glassArea.widthTop / 2,  // End point X
      glassArea.topY                        // End point Y
    );
    
    // Line to bottom right
    ctx.lineTo(glassArea.centerX + glassArea.widthBottom / 2, glassArea.bottomY);
    
    // Curved bottom edge (concave dip down at center - same direction as top)
    // bottomDipY should be LESS than bottomY to dip DOWN (smaller Y = higher on screen)
    ctx.quadraticCurveTo(
      glassArea.centerX,                    // Control point X (center)
      glassArea.bottomDipY,                 // Control point Y (should be less than bottomY to dip down)
      glassArea.centerX - glassArea.widthBottom / 2,  // End point X (back to start)
      glassArea.bottomY                     // End point Y
    );
    
    // Close and stroke
    ctx.closePath();
    ctx.stroke();
    
    // Add center line for reference
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(glassArea.centerX, glassArea.topY);
    ctx.lineTo(glassArea.centerX, glassArea.bottomY);
    ctx.stroke();
    
    ctx.restore();
    
  }, [glassImage, mapDesign, rotation, frontLayer, backLayer, layerControls]);

  return (
    <div className="glass-mockup-container">
      <canvas 
        ref={canvasRef}
        className="glass-mockup-canvas"
      />
      <div className="mockup-info" style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        <p>Rotation: {rotation}° | Active Layer: {layerControls.activeLayer}</p>
        <p>Layers: {layerControls.showFront ? 'Front ' : ''}{layerControls.showBack ? 'Back' : ''}</p>
        <p>Red outline = {layerControls.activeLayer} layer bounds | Blue = center line</p>
      </div>
    </div>
  );
};

export default GlassMockupWrap;