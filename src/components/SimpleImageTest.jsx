import React, { useEffect, useRef, useState } from 'react';

const SimpleImageTest = () => {
  const [testImage, setTestImage] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log('Test image loaded:', img.width, 'x', img.height);
      setTestImage(img);
    };
    img.onerror = (e) => {
      console.error('Failed to load test image:', e);
    };
    img.src = '/glass-images/rocks-test-design-optimal.png';
  }, []);

  return (
    <div style={{ 
      padding: '20px',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>
        Simple Image Test
      </h1>
      
      <div style={{ 
        border: '2px solid #ddd',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px'
      }}>
        {testImage ? (
          <div>
            <p style={{ marginBottom: '10px', color: '#666' }}>
              Image loaded: {testImage.width} × {testImage.height} pixels
            </p>
            <img 
              src={testImage.src}
              alt="Test design"
              style={{
                maxWidth: '100%',
                height: 'auto',
                border: '1px solid #ccc'
              }}
            />
          </div>
        ) : (
          <p style={{ color: '#999' }}>Loading test image...</p>
        )}
      </div>
    </div>
  );
};

export default SimpleImageTest;