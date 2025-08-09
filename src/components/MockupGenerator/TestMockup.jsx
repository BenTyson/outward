import React, { useEffect, useRef, useState } from 'react';
import MockupViewer from './MockupViewer';

const TestMockup = () => {
  const [mapCanvas, setMapCanvas] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // Create a test map design
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size (aspect ratio for glass)
    canvas.width = 800;
    canvas.height = 600;
    
    // Draw a test map pattern
    // Background
    ctx.fillStyle = '#f0e6d2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some "map" elements
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    
    // Draw roads/lines
    ctx.beginPath();
    ctx.moveTo(100, 100);
    ctx.lineTo(400, 200);
    ctx.lineTo(600, 150);
    ctx.lineTo(700, 300);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(200, 50);
    ctx.lineTo(300, 400);
    ctx.lineTo(500, 450);
    ctx.stroke();
    
    // Draw some circles (locations)
    ctx.fillStyle = '#e74c3c';
    const locations = [
      { x: 100, y: 100 },
      { x: 400, y: 200 },
      { x: 600, y: 150 },
      { x: 300, y: 400 },
      { x: 500, y: 450 }
    ];
    
    locations.forEach(loc => {
      ctx.beginPath();
      ctx.arc(loc.x, loc.y, 8, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Add some text
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PORTLAND', canvas.width / 2, 100);
    
    ctx.font = '24px Arial';
    ctx.fillText('45.5152° N, 122.6784° W', canvas.width / 2, 140);
    
    // Add decorative border
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    
    // Add corner decorations
    const cornerSize = 30;
    ctx.lineWidth = 3;
    
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(20, 20 + cornerSize);
    ctx.lineTo(20, 20);
    ctx.lineTo(20 + cornerSize, 20);
    ctx.stroke();
    
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - 20 - cornerSize, 20);
    ctx.lineTo(canvas.width - 20, 20);
    ctx.lineTo(canvas.width - 20, 20 + cornerSize);
    ctx.stroke();
    
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20 - cornerSize);
    ctx.lineTo(20, canvas.height - 20);
    ctx.lineTo(20 + cornerSize, canvas.height - 20);
    ctx.stroke();
    
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(canvas.width - 20 - cornerSize, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20);
    ctx.lineTo(canvas.width - 20, canvas.height - 20 - cornerSize);
    ctx.stroke();
    
    setMapCanvas(canvas);
    
    // Also display the test canvas in the preview
    if (canvasRef.current) {
      const displayCtx = canvasRef.current.getContext('2d');
      canvasRef.current.width = canvas.width;
      canvasRef.current.height = canvas.height;
      displayCtx.drawImage(canvas, 0, 0);
    }
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Glass Mockup Test</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h3>Test Map Design:</h3>
        <canvas 
          ref={canvasRef}
          style={{ 
            border: '1px solid #ddd',
            maxWidth: '400px',
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
        />
      </div>

      {mapCanvas && (
        <MockupViewer 
          mapCanvas={mapCanvas}
          glassType="rocks"
        />
      )}
    </div>
  );
};

export default TestMockup;