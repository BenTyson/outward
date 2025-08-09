import React, { useState } from 'react';
import GlassMockupWrap from './GlassMockupWrap';

const TestWrap = () => {
  const [rotation, setRotation] = useState(0);
  
  // Front layer parameters with final optimized values
  const [frontLayer, setFrontLayer] = useState({
    topY: 0.130,      // Top edge position (0-1)
    bottomY: 0.890,   // Bottom edge position (0-1)
    widthTop: 0.664,  // Width at top (0-1)
    widthBottom: 0.658, // Width at bottom (0-1) - refined
    rimDip: 0.250,    // Top rim dip depth (0-1)
    bottomDip: 1.057, // Bottom rim dip position - final tuned value
  });

  // Back layer parameters (optimized values for through-glass view)
  const [backLayer, setBackLayer] = useState({
    topY: 0.106,      // Top edge position (0-1)
    bottomY: 0.813,   // Bottom edge position (0-1)
    widthTop: 0.659,  // Width at top (0-1)
    widthBottom: 0.656, // Width at bottom (0-1)
    rimDip: 0.007,    // Top rim dip depth (0-1)
    bottomDip: 0.700, // Bottom rim dip position
  });

  // Layer visibility controls
  const [layerControls, setLayerControls] = useState({
    showFront: true,
    showBack: true,
    activeLayer: 'front' // Which layer the sliders currently control
  });

  const updateAdjustment = (key, value) => {
    const numValue = parseFloat(value);
    if (layerControls.activeLayer === 'front') {
      setFrontLayer(prev => ({ ...prev, [key]: numValue }));
    } else {
      setBackLayer(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const toggleLayerVisibility = (layer) => {
    setLayerControls(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const setActiveLayer = (layer) => {
    setLayerControls(prev => ({ ...prev, activeLayer: layer }));
  };

  // Get current layer values for sliders
  const currentLayer = layerControls.activeLayer === 'front' ? frontLayer : backLayer;

  // Copy values to clipboard for logging
  const copyValues = () => {
    const values = `
// Front Layer Settings
frontLayer: {
  topY: ${frontLayer.topY.toFixed(3)}
  bottomY: ${frontLayer.bottomY.toFixed(3)}
  widthTop: ${frontLayer.widthTop.toFixed(3)}
  widthBottom: ${frontLayer.widthBottom.toFixed(3)}
  rimDip: ${frontLayer.rimDip.toFixed(3)}
  bottomDip: ${frontLayer.bottomDip.toFixed(3)}
}

// Back Layer Settings
backLayer: {
  topY: ${backLayer.topY.toFixed(3)}
  bottomY: ${backLayer.bottomY.toFixed(3)}
  widthTop: ${backLayer.widthTop.toFixed(3)}
  widthBottom: ${backLayer.widthBottom.toFixed(3)}
  rimDip: ${backLayer.rimDip.toFixed(3)}
  bottomDip: ${backLayer.bottomDip.toFixed(3)}
}
    `.trim();
    
    navigator.clipboard.writeText(values);
    alert('Front and Back layer values copied to clipboard!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>Glass Wrap Test - Fine Tuning</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', marginBottom: '30px' }}>
        {/* Adjustment Controls */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px' }}>
          <h3>Fine-Tune Adjustments</h3>

          {/* Layer Controls */}
          <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f4f8', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Layer Controls</h4>
            
            {/* Active Layer Selector */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '5px', display: 'block' }}>
                Editing: {layerControls.activeLayer === 'front' ? '🔵 Front Layer' : '🔴 Back Layer'}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setActiveLayer('front')}
                  style={{
                    padding: '8px 16px',
                    background: layerControls.activeLayer === 'front' ? '#007acc' : '#ccc',
                    color: layerControls.activeLayer === 'front' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Front Layer
                </button>
                <button 
                  onClick={() => setActiveLayer('back')}
                  style={{
                    padding: '8px 16px',
                    background: layerControls.activeLayer === 'back' ? '#cc4400' : '#ccc',
                    color: layerControls.activeLayer === 'back' ? 'white' : 'black',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Back Layer
                </button>
              </div>
            </div>

            {/* Visibility Toggles */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={layerControls.showFront}
                  onChange={() => toggleLayerVisibility('showFront')}
                />
                Show Front
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <input
                  type="checkbox"
                  checked={layerControls.showBack}
                  onChange={() => toggleLayerVisibility('showBack')}
                />
                Show Back
              </label>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Top Rim Dip: {currentLayer.rimDip.toFixed(3)}
            </label>
            <input
              type="range"
              min={layerControls.activeLayer === 'back' ? "-1.0" : "0.05"}
              max="0.25"
              step="0.001"
              value={currentLayer.rimDip}
              onChange={(e) => updateAdjustment('rimDip', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>{layerControls.activeLayer === 'back' ? 'Back layer: negative values curve opposite direction' : 'Controls how deep the top center dips down'}</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Bottom Rim Dip: {currentLayer.bottomDip.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.70"
              max="2.00"
              step="0.001"
              value={currentLayer.bottomDip}
              onChange={(e) => updateAdjustment('bottomDip', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>Bottom dip position (lower value = more dip up, higher = dips down)</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Top Y: {currentLayer.topY.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.05"
              max="0.20"
              step="0.001"
              value={currentLayer.topY}
              onChange={(e) => updateAdjustment('topY', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>Top edge position (at rim edges)</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Bottom Y: {currentLayer.bottomY.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.60"
              max="0.95"
              step="0.001"
              value={currentLayer.bottomY}
              onChange={(e) => updateAdjustment('bottomY', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>Bottom edge position</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Width Top: {currentLayer.widthTop.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.50"
              max="0.80"
              step="0.001"
              value={currentLayer.widthTop}
              onChange={(e) => updateAdjustment('widthTop', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>Width at top of glass</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Width Bottom: {currentLayer.widthBottom.toFixed(3)}
            </label>
            <input
              type="range"
              min="0.50"
              max="0.75"
              step="0.001"
              value={currentLayer.widthBottom}
              onChange={(e) => updateAdjustment('widthBottom', e.target.value)}
              style={{ width: '100%' }}
            />
            <small>Width at bottom of glass</small>
          </div>

          <button 
            onClick={copyValues}
            style={{
              width: '100%',
              padding: '10px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📋 Copy Values to Clipboard
          </button>

          {/* Original Design moved here below controls */}
          <div style={{ marginTop: '20px' }}>
            <h4>Original Design (360° wrap)</h4>
            <img 
              src="/glass-images/rocks-test-design.png" 
              style={{ 
                width: '100%', 
                border: '1px solid #ddd',
                background: 'white',
                borderRadius: '4px'
              }}
              alt="Test design"
            />
          </div>
        </div>
        
        {/* Glass Preview - Now takes more space */}
        <div>
          <h3>Glass Preview</h3>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <GlassMockupWrap 
              rotation={rotation} 
              frontLayer={frontLayer}
              backLayer={backLayer}
              layerControls={layerControls}
            />
          </div>
        </div>
      </div>

      {/* Rotation Control */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
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

      {/* Current Values Display */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#2c3e50', 
        color: '#ecf0f1',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '14px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#3498db' }}>Current Values (for logging):</h4>
        <pre style={{ margin: 0 }}>
{`topY: ${currentLayer.topY.toFixed(3)}
bottomY: ${currentLayer.bottomY.toFixed(3)}
widthTop: ${currentLayer.widthTop.toFixed(3)}
widthBottom: ${currentLayer.widthBottom.toFixed(3)}
rimDip: ${currentLayer.rimDip.toFixed(3)}
bottomDip: ${currentLayer.bottomDip.toFixed(3)}`}
        </pre>
      </div>
    </div>
  );
};

export default TestWrap;