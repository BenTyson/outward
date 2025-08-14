import { useRef } from 'react';
import MapRenderer from '../MapBuilder/MapRenderer';
import TextIconControls from '../UI/TextIconControls';
import CylinderMapTest from '../CylinderTest/CylinderMapTest';
import { CheckoutButton } from '../Checkout/CheckoutButton';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './Step2.css';

const Step2 = () => {
  const cylinderRef = useRef(null);
  const { 
    glassType, 
    modelPreviewAvailable, 
    modelImageUrl,
    location,
    coordinates,
    zoom,
    text1,
    text2,
    icons,
    highResImage,
    previewImage
  } = useMapConfig();

  // Function to capture 3D model preview
  const capture3DModelImage = async () => {
    if (cylinderRef.current) {
      try {
        // Wait longer for the 3D model to finish rendering
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the canvas element in the 3D component
        const canvas = cylinderRef.current.querySelector('canvas');
        console.log('=== 3D CANVAS CAPTURE DEBUG ===');
        console.log('Found canvas:', !!canvas);
        console.log('Canvas parent:', cylinderRef.current);
        
        if (canvas) {
          console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('Canvas style:', canvas.style.cssText);
          console.log('Canvas context type:', canvas.getContext ? 'supported' : 'not supported');
          
          // Check if it's a WebGL canvas
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          if (gl) {
            console.log('WebGL context found');
            console.log('WebGL drawing buffer size:', gl.drawingBufferWidth, 'x', gl.drawingBufferHeight);
          }
          
          // Try to capture the canvas
          try {
            // Force a render if possible
            const event = new Event('resize');
            window.dispatchEvent(event);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            console.log('3D canvas captured successfully');
            console.log('Data URL length:', dataUrl.length);
            console.log('Data URL valid:', dataUrl.startsWith('data:image/png;base64,'));
            
            // Check if image is just blank/empty
            if (dataUrl.length < 1000) {
              console.warn('Captured image appears to be very small/blank');
            }
            
            return dataUrl;
          } catch (webglError) {
            console.error('WebGL canvas capture failed:', webglError);
            return null;
          }
        } else {
          console.warn('Canvas element not found in 3D component');
          const allCanvases = document.querySelectorAll('canvas');
          console.log('All canvases on page:', allCanvases.length);
          allCanvases.forEach((c, i) => {
            console.log(`Canvas ${i}:`, c.width, 'x', c.height, 'parent:', c.parentElement?.className);
          });
        }
      } catch (error) {
        console.error('Failed to capture 3D model:', error);
      }
    } else {
      console.warn('cylinderRef.current not available');
    }
    return null;
  };

  return (
    <div className="step2">
      <div className="step2-content">
        {/* Left Side - Map Preview */}
        <div className="preview-panel">
          <div className="preview-container">
            <MapRenderer />
          </div>
        </div>
        
        {/* Right Side - Design Tools */}
        <div className="tools-panel">
          <div className="tool-section">
            <TextIconControls />
          </div>
        </div>
      </div>
      
      {/* 3D Model Preview - Appears for rocks glass after generating final image */}
      {glassType === 'rocks' && modelPreviewAvailable && modelImageUrl && (
        <div className="model-preview-section">
          <h3 className="model-preview-title">3D Preview</h3>
          <div className="model-preview-container" ref={cylinderRef}>
            <CylinderMapTest 
              textureSource={modelImageUrl} 
              hideControls={true} 
            />
          </div>
        </div>
      )}
      
      {/* Checkout Button - Shows after design is complete */}
      {modelImageUrl && (
        <CheckoutButton 
          configuration={{
            glassType
          }}
          images={{
            preview: previewImage || modelImageUrl,
            highRes: highResImage,
            modelPreview: capture3DModelImage
          }}
          disabled={!modelImageUrl}
        />
      )}
    </div>
  );
};

export default Step2;