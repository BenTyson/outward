import React, { useEffect, useRef, useState } from 'react';
import './GlassMockup2D.css';

const GlassMockupWrap = ({ rotation = 0 }) => {
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
    // Adjusted based on the red marking in Rocks_height1.jpg
    const glassArea = {
      // The cylindrical part of the glass (from lip to just above base)
      centerX: canvas.width * 0.5,     // Center of glass
      topY: canvas.height * 0.095,     // Top of engraving area (at the lip/rim)
      bottomY: canvas.height * 0.87,    // Bottom of engraving area (just above thick base)
      widthTop: canvas.width * 0.64,   // Width at top (slightly wider due to tilt)
      widthBottom: canvas.width * 0.60, // Width at bottom (slightly narrower)
    };
    
    // Calculate engraving dimensions
    const engravingHeight = glassArea.bottomY - glassArea.topY;
    // Use average width for now
    const engravingWidth = (glassArea.widthTop + glassArea.widthBottom) / 2;
    
    // The map design represents 360 degrees around the glass
    // At rotation=0, we see the center portion of the design
    // The visible portion is approximately 180 degrees (half the circumference)
    
    // Calculate what portion of the map to show based on rotation
    const mapWidth = mapDesign.width;
    const mapHeight = mapDesign.height;
    
    // Scale map height to match glass engraving height
    const scale = engravingHeight / mapHeight;
    const scaledMapWidth = mapWidth * scale;
    
    // For now, just place the center portion of the map on the front
    // The visible portion is about 50% of the total wrap
    const visiblePortion = 0.5; // We see about half the circumference from front
    const visibleWidth = scaledMapWidth * visiblePortion;
    
    // Calculate source X position based on rotation
    // Rotation of 0 = center of map, rotation of 180 = opposite side
    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const sourceXPercent = normalizedRotation / 360;
    const sourceX = mapWidth * sourceXPercent;
    
    // Draw the visible portion of the map
    ctx.save();
    
    // Set up clipping region for glass area
    ctx.beginPath();
    ctx.rect(
      glassArea.centerX - engravingWidth / 2,
      glassArea.topY,
      engravingWidth,
      engravingHeight
    );
    ctx.clip();
    
    // Apply engraving effect
    ctx.globalAlpha = 0.7;
    ctx.globalCompositeOperation = 'multiply';
    
    // Draw the map section that should be visible
    // Handle wrap-around at edges
    const drawWidth = mapWidth * visiblePortion;
    
    if (sourceX + drawWidth <= mapWidth) {
      // Normal case - no wrap needed
      ctx.drawImage(
        mapDesign,
        sourceX, 0, drawWidth, mapHeight,
        glassArea.centerX - engravingWidth / 2, glassArea.topY,
        engravingWidth, engravingHeight
      );
    } else {
      // Wrap case - need to draw from two parts of the image
      const firstPartWidth = mapWidth - sourceX;
      const secondPartWidth = drawWidth - firstPartWidth;
      
      // Draw first part (right side of map)
      ctx.drawImage(
        mapDesign,
        sourceX, 0, firstPartWidth, mapHeight,
        glassArea.centerX - engravingWidth / 2, glassArea.topY,
        engravingWidth * (firstPartWidth / drawWidth), engravingHeight
      );
      
      // Draw second part (left side of map)
      ctx.drawImage(
        mapDesign,
        0, 0, secondPartWidth, mapHeight,
        glassArea.centerX - engravingWidth / 2 + engravingWidth * (firstPartWidth / drawWidth), 
        glassArea.topY,
        engravingWidth * (secondPartWidth / drawWidth), engravingHeight
      );
    }
    
    ctx.restore();
    
    // Debug overlay to show engraving area (remove this in production)
    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    // Draw trapezoid to show perspective
    ctx.beginPath();
    ctx.moveTo(glassArea.centerX - glassArea.widthTop / 2, glassArea.topY);
    ctx.lineTo(glassArea.centerX + glassArea.widthTop / 2, glassArea.topY);
    ctx.lineTo(glassArea.centerX + glassArea.widthBottom / 2, glassArea.bottomY);
    ctx.lineTo(glassArea.centerX - glassArea.widthBottom / 2, glassArea.bottomY);
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
    
  }, [glassImage, mapDesign, rotation]);

  return (
    <div className="glass-mockup-container">
      <canvas 
        ref={canvasRef}
        className="glass-mockup-canvas"
      />
      <div className="mockup-info" style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
        <p>Rotation: {rotation}°</p>
        <p>Red trapezoid = engraving area | Blue line = center</p>
        <p>Height now extends from lip to base as requested</p>
      </div>
    </div>
  );
};

export default GlassMockupWrap;