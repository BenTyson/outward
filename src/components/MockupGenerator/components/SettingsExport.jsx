import React from 'react';

const SettingsExport = ({ settings }) => {
  const handleJsonCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    alert('Settings copied!');
  };

  const handleLineCopy = () => {
    const settingsLine = Object.entries(settings)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    navigator.clipboard.writeText(settingsLine);
    alert('One-line copied!');
  };

  return (
    <div style={{ borderTop: '1px solid #ddd', padding: '12px', background: '#f8f9fa' }}>
      <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>Export Settings</h5>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <button 
          onClick={handleJsonCopy}
          style={{ 
            flex: 1, padding: '6px 10px', backgroundColor: '#007bff', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
          }}
        >
          Copy JSON
        </button>
        
        <button 
          onClick={handleLineCopy}
          style={{ 
            flex: 1, padding: '6px 10px', backgroundColor: '#28a745', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'
          }}
        >
          Copy Line
        </button>
      </div>
    </div>
  );
};

export default SettingsExport;