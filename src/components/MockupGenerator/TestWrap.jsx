import React, { useState } from 'react';
import GlassMockupWrap from './GlassMockupWrap';

const TestWrap = () => {
  const [rotation, setRotation] = useState(0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Glass Wrap Test - Step by Step</h1>
      
      <div style={{ marginBottom: '20px', background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
        <h3>Step 1: Center design on front of glass</h3>
        <p>The red dashed box shows where the engraving will appear.</p>
        <p>The map design wraps 360° around the glass. We're showing the center portion.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div>
          <h3>Original Design (wraps 360°)</h3>
          <img 
            src="/glass-images/rocks-test-design.png" 
            style={{ 
              width: '100%', 
              border: '1px solid #ddd',
              background: 'white'
            }}
            alt="Test design"
          />
          <p style={{ fontSize: '14px', color: '#666' }}>
            This design wraps completely around the glass cylinder.
          </p>
        </div>
        
        <div>
          <h3>Glass Preview</h3>
          <GlassMockupWrap rotation={rotation} />
        </div>
      </div>

      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
        <h3>Rotation Control</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Rotation: {rotation}°
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => setRotation(0)}>Front (0°)</button>
          <button onClick={() => setRotation(90)}>Right (90°)</button>
          <button onClick={() => setRotation(180)}>Back (180°)</button>
          <button onClick={() => setRotation(270)}>Left (270°)</button>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', background: '#e8f4f8', borderRadius: '8px' }}>
        <h4>Current Status:</h4>
        <ul>
          <li>✅ Design loaded and positioned on glass</li>
          <li>✅ Height matches glass engraving area</li>
          <li>⏳ Need to adjust: Width/position to better match glass curve</li>
          <li>⏳ Need to add: Cylindrical distortion for realism</li>
          <li>⏳ Need to add: Back layer (reversed through glass)</li>
        </ul>
      </div>
    </div>
  );
};

export default TestWrap;