import React, { useEffect, useRef, useState } from 'react';
import './GlassMockup2D.css';

const GlassMockup2D = ({ mapCanvas, glassType = 'rocks', rotation = 0 }) => {
  const canvasRef = useRef(null);
  const [glassImage, setGlassImage] = useState(null);
  
  // Load glass base image
  useEffect(() => {
    const img = new Image();
    img.onload = () => setGlassImage(img);
    img.src = '/glass-images/rocks-white.jpg';
  }, [glassType]);

  // Apply cylindrical warp to simulate glass curve
  const applyWarp = (ctx, imageData, x, y, width, height, warpAmount = 0.1) => {
    // Create temporary canvas for warped image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;
    
    // Apply cylindrical distortion
    const centerX = width / 2;
    
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        // Calculate cylindrical distortion
        const distFromCenter = (px - centerX) / centerX;
        const warpFactor = 1 - Math.abs(distFromCenter) * warpAmount;
        const warpedX = centerX + (px - centerX) * warpFactor;
        
        // Sample from original and draw to warped
        tempCtx.drawImage(imageData, 
          px, py, 1, 1,
          warpedX, py, 1, 1
        );
      }
    }
    
    return tempCanvas;
  };

  useEffect(() => {
    if (!canvasRef.current || !glassImage || !mapCanvas) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match glass image
    canvas.width = glassImage.width;
    canvas.height = glassImage.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw base glass image
    ctx.drawImage(glassImage, 0, 0);
    
    // Define engraving area on glass (adjust these values based on your glass image)
    const engravingArea = {
      x: canvas.width * 0.15,      // Left offset
      y: canvas.height * 0.25,      // Top offset  
      width: canvas.width * 0.7,    // Width of engraving area
      height: canvas.height * 0.45  // Height of engraving area
    };
    
    // Layer 1: Back of glass (reversed, seen through glass)
    ctx.save();
    
    // Flip horizontally for back view
    ctx.translate(engravingArea.x + engravingArea.width, engravingArea.y);
    ctx.scale(-1, 1);
    
    // Draw back layer with reduced opacity and blur effect
    ctx.globalAlpha = 0.3;
    ctx.filter = 'blur(1px)';
    ctx.globalCompositeOperation = 'multiply';
    
    // Apply warp and draw back map
    const warpedBack = applyWarp(
      ctx, 
      mapCanvas,
      0, 0,
      engravingArea.width,
      engravingArea.height,
      0.15 // More warp for back layer
    );
    
    ctx.drawImage(
      warpedBack,
      0, 0, warpedBack.width, warpedBack.height,
      0, 0, engravingArea.width, engravingArea.height
    );
    
    ctx.restore();
    
    // Layer 2: Front of glass (main engraving)
    ctx.save();
    
    // Position front layer
    ctx.translate(engravingArea.x, engravingArea.y);
    
    // Draw front layer with higher opacity
    ctx.globalAlpha = 0.85;
    ctx.globalCompositeOperation = 'multiply';
    
    // Apply slight warp for cylindrical effect
    const warpedFront = applyWarp(
      ctx,
      mapCanvas,
      0, 0,
      engravingArea.width,
      engravingArea.height,
      0.08 // Less warp for front layer
    );
    
    ctx.drawImage(
      warpedFront,
      0, 0, warpedFront.width, warpedFront.height,
      0, 0, engravingArea.width, engravingArea.height
    );
    
    ctx.restore();
    
    // Layer 3: Glass reflections and highlights (optional)
    ctx.save();
    ctx.globalAlpha = 0.1;
    ctx.globalCompositeOperation = 'overlay';
    
    // Add subtle gradient for glass shine
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
      engravingArea.x,
      engravingArea.y,
      engravingArea.width,
      engravingArea.height
    );
    
    ctx.restore();
    
  }, [glassImage, mapCanvas, rotation]);

  return (
    <div className="glass-mockup-container">
      <canvas 
        ref={canvasRef}
        className="glass-mockup-canvas"
        style={{
          transform: `rotateY(${rotation}deg)`,
          transition: 'transform 0.3s ease'
        }}
      />
      <div className="mockup-controls">
        <p>Drag to rotate view</p>
      </div>
    </div>
  );
};

export default GlassMockup2D;