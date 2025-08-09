import React, { useState, useRef, useEffect } from 'react';
import GlassMockup2D from './GlassMockup2D';
import './MockupViewer.css';

const MockupViewer = ({ mapCanvas, glassType = 'rocks' }) => {
  const [rotation, setRotation] = useState(0);
  const [backgroundType, setBgType] = useState('white');
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef(null);

  // Handle mouse/touch rotation
  const handleStart = (clientX) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const deltaX = clientX - startX;
    setRotation((prev) => prev + deltaX * 0.5);
    setStartX(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e) => handleStart(e.clientX);
  const handleMouseMove = (e) => handleMove(e.clientX);
  const handleMouseUp = () => handleEnd();

  // Touch events
  const handleTouchStart = (e) => handleStart(e.touches[0].clientX);
  const handleTouchMove = (e) => handleMove(e.touches[0].clientX);
  const handleTouchEnd = () => handleEnd();

  // Preset views
  const setView = (angle) => {
    setRotation(angle);
  };

  // Export high-resolution image
  const exportImage = () => {
    // Create high-res canvas
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    
    // Set high resolution
    exportCanvas.width = 2000;
    exportCanvas.height = 2000;
    
    // Render mockup at high res
    // ... rendering logic ...
    
    // Download
    exportCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glass-mockup-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="mockup-viewer">
      <div className="viewer-header">
        <h2>3D Glass Preview</h2>
        <div className="viewer-controls">
          <div className="background-selector">
            <button 
              className={backgroundType === 'white' ? 'active' : ''}
              onClick={() => setBgType('white')}
            >
              White
            </button>
            <button 
              className={backgroundType === 'black' ? 'active' : ''}
              onClick={() => setBgType('black')}
            >
              Black
            </button>
            <button 
              className={backgroundType === 'studio' ? 'active' : ''}
              onClick={() => setBgType('studio')}
            >
              Studio
            </button>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className={`mockup-stage bg-${backgroundType}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <GlassMockup2D
          mapCanvas={mapCanvas}
          glassType={glassType}
          rotation={rotation}
        />
      </div>

      <div className="viewer-footer">
        <div className="preset-views">
          <button onClick={() => setView(0)}>Front</button>
          <button onClick={() => setView(45)}>Angle</button>
          <button onClick={() => setView(90)}>Side</button>
          <button onClick={() => setView(180)}>Back</button>
        </div>
        
        <button className="export-btn" onClick={exportImage}>
          Export High-Res Image
        </button>
      </div>

      <div className="instructions">
        <p>🖱️ Click and drag to rotate • 📱 Swipe to rotate on mobile</p>
      </div>
    </div>
  );
};

export default MockupViewer;