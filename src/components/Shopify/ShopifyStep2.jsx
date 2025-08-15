import { useRef } from 'react';
import ShopifyMapRenderer from './ShopifyMapRenderer';
import ShopifyTextIconControls from './ShopifyTextIconControls';
import CylinderMapTest from '../CylinderTest/CylinderMapTest';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './ShopifyStep2.css';

const ShopifyStep2 = ({ onCheckout }) => {
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
    previewImage,
    nextStep,
    prevStep,
    currentStep,
    totalSteps
  } = useMapConfig();

  const canGoNext = () => {
    return currentStep < totalSteps;
  };

  const canGoPrev = () => {
    return currentStep > 1;
  };

  // Function to capture 3D model preview
  const capture3DModelImage = async () => {
    if (cylinderRef.current) {
      try {
        // Wait longer for the 3D model to finish rendering
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the canvas element in the 3D component
        const canvas = cylinderRef.current.querySelector('canvas');
        
        if (canvas) {
          try {
            // Force a render if possible
            const event = new Event('resize');
            window.dispatchEvent(event);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            return dataUrl;
          } catch (webglError) {
            console.error('WebGL canvas capture failed:', webglError);
            return null;
          }
        }
      } catch (error) {
        console.error('Failed to capture 3D model:', error);
      }
    }
    return null;
  };

  return (
    <div className="shopify-step2">
      {/* Design Controls Above Map */}
      <div className="shopify-controls-section">
        <ShopifyTextIconControls />
      </div>
      
      {/* Full Width Map */}
      <div className="shopify-map-section">
        <ShopifyMapRenderer />
      </div>
      
      {/* 3D Model Preview - Appears for rocks glass after generating final image */}
      {glassType === 'rocks' && modelPreviewAvailable && modelImageUrl && (
        <div className="shopify-model-preview-section">
          <h3 className="shopify-model-preview-title">3D Preview</h3>
          <div className="shopify-model-preview-container" ref={cylinderRef}>
            <CylinderMapTest 
              textureSource={modelImageUrl} 
              hideControls={true} 
            />
          </div>
        </div>
      )}
      
      {/* Add to Cart Button - Shows after design is generated */}
      {highResImage && previewImage && (
        <div className="shopify-checkout-section">
          <button 
            className="shopify-add-to-cart-btn"
            onClick={onCheckout}
          >
            Add to Cart
          </button>
        </div>
      )}
      
      {/* Navigation Footer */}
      <div className="shopify-wizard-footer">
        <button
          className="shopify-wizard-btn shopify-wizard-btn-secondary"
          onClick={prevStep}
          disabled={!canGoPrev()}
        >
          ← Back
        </button>
        
        <div className="shopify-step-indicator">
          {currentStep} of {totalSteps}
        </div>

        <button
          className="shopify-wizard-btn shopify-wizard-btn-primary"
          onClick={nextStep}
          disabled={!canGoNext()}
        >
          {currentStep === totalSteps ? 'Finish' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default ShopifyStep2;