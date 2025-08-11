import React from 'react';

const VisualControls = ({
  whiteThreshold,
  setWhiteThreshold,
  engravingOpacity,
  setEngravingOpacity
}) => {
  return (
    <>
      <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>Visual Effects</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
          White Threshold: {whiteThreshold}
        </label>
        <input
          type="range"
          min="180"
          max="250"
          step="5"
          value={whiteThreshold}
          onChange={(e) => setWhiteThreshold(parseInt(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          Lower = more pixels become transparent (includes light grays)
        </div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', fontWeight: '500' }}>
          Engraving Opacity: {engravingOpacity.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={engravingOpacity}
          onChange={(e) => setEngravingOpacity(parseFloat(e.target.value))}
          style={{ width: '100%' }}
        />
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
          0 = invisible engraving, 1 = solid black engraving
        </div>
      </div>
      
      <div style={{ padding: '20px', textAlign: 'center', color: '#666', borderTop: '1px solid #eee', marginTop: '16px' }}>
        Additional visual effects coming next:
        <br />
        <small>Engraving depth, highlights, shadows, etc.</small>
      </div>
    </>
  );
};

export default VisualControls;