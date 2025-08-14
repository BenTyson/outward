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
        // Wait a moment for the 3D model to finish rendering
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the canvas element in the 3D component
        const canvas = cylinderRef.current.querySelector('canvas');
        console.log('Found canvas:', canvas);
        console.log('Canvas parent:', cylinderRef.current);
        
        if (canvas) {
          console.log('Capturing 3D canvas:', canvas.width, 'x', canvas.height);
          console.log('Canvas style:', canvas.style.cssText);
          
          // For WebGL canvases, we need to be careful about preserveDrawingBuffer
          try {
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            console.log('3D canvas captured, data URL length:', dataUrl.length);
            console.log('Data URL preview:', dataUrl.substring(0, 100) + '...');
            return dataUrl;
          } catch (webglError) {
            console.error('WebGL canvas capture failed:', webglError);
            return null;
          }
        } else {
          console.warn('Canvas element not found in 3D component');
          const allCanvases = document.querySelectorAll('canvas');
          console.log('All canvases on page:', allCanvases);
        }
      } catch (error) {
        console.error('Failed to capture 3D model:', error);
      }
    }
    console.warn('cylinderRef.current not available');
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