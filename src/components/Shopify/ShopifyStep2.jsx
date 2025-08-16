import { useRef, useEffect } from 'react';
import ShopifyMapRenderer from './ShopifyMapRenderer';
import ShopifyTextIconControls from './ShopifyTextIconControls';
import CylinderMapTest from '../CylinderTest/CylinderMapTest';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './ShopifyStep2.css';

const ShopifyStep2 = ({ onFinish, onCheckout }) => {
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
    totalSteps,
    // Phase D: Checkout flow
    designComplete,
    model3dComplete,
    finishEnabled,
    setModel3dComplete,
    updateGeneratedImage,
    setFinishEnabled
  } = useMapConfig();

  const canGoNext = () => {
    return currentStep < totalSteps;
  };

  const canGoPrev = () => {
    return currentStep > 1;
  };

  // Function to capture 3D model preview
  const capture3DModelImage = async () => {
    console.log('[FINISH-BUTTON-DEBUG] capture3DModelImage called, cylinderRef.current:', !!cylinderRef.current);
    
    if (cylinderRef.current) {
      try {
        // Wait longer for the 3D model to finish rendering
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the canvas element in the 3D component
        const canvas = cylinderRef.current.querySelector('canvas');
        console.log('[FINISH-BUTTON-DEBUG] Found canvas element:', !!canvas);
        
        if (canvas) {
          try {
            // Force a render if possible
            const event = new Event('resize');
            window.dispatchEvent(event);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const dataUrl = canvas.toDataURL('image/png', 0.9);
            console.log('[FINISH-BUTTON-DEBUG] Canvas dataURL generated, length:', dataUrl.length);
            
            // Phase D: Store the 3D model image and mark as complete
            if (dataUrl && dataUrl !== 'data:,') {
              updateGeneratedImage('model3d', dataUrl);
              setModel3dComplete(true);
              console.log('[FINISH-BUTTON-DEBUG] 3D model captured successfully, setModel3dComplete(true) called');
            } else {
              console.warn('[FINISH-BUTTON-DEBUG] Canvas dataURL was empty or invalid');
            }
            
            return dataUrl;
          } catch (webglError) {
            console.error('[FINISH-BUTTON-DEBUG] WebGL canvas capture failed:', webglError);
            return null;
          }
        } else {
          console.warn('[FINISH-BUTTON-DEBUG] No canvas element found in 3D component');
        }
      } catch (error) {
        console.error('[FINISH-BUTTON-DEBUG] Failed to capture 3D model:', error);
      }
    } else {
      console.warn('[FINISH-BUTTON-DEBUG] cylinderRef.current is null/undefined');
    }
    return null;
  };

  // Phase D: Auto-capture 3D model when it becomes available
  useEffect(() => {
    console.log('[FINISH-BUTTON-DEBUG] 3D Auto-capture check:', {
      modelPreviewAvailable,
      modelImageUrl: !!modelImageUrl,
      glassType,
      model3dComplete,
      shouldCapture: modelPreviewAvailable && modelImageUrl && glassType === 'rocks' && !model3dComplete
    });
    
    if (modelPreviewAvailable && modelImageUrl && glassType === 'rocks' && !model3dComplete) {
      console.log('[FINISH-BUTTON-DEBUG] Starting 3D model auto-capture...');
      // Wait for the 3D component to mount and render
      const captureTimer = setTimeout(() => {
        capture3DModelImage();
      }, 1500); // Give extra time for 3D rendering

      return () => clearTimeout(captureTimer);
    }
  }, [modelPreviewAvailable, modelImageUrl, glassType, model3dComplete]);

  // Phase D: Enable finish button when both design and 3D model are complete
  useEffect(() => {
    console.log('[FINISH-BUTTON-DEBUG] Finish button state check:', {
      glassType,
      designComplete,
      model3dComplete,
      shouldEnable: glassType === 'rocks' ? (designComplete && model3dComplete) : designComplete
    });
    
    if (glassType === 'rocks') {
      // For rocks glass, need both design and 3D model complete
      setFinishEnabled(designComplete && model3dComplete);
    } else {
      // For other glass types, only need design complete
      setFinishEnabled(designComplete);
    }
  }, [designComplete, model3dComplete, glassType, setFinishEnabled]);

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
          className={`shopify-wizard-btn ${finishEnabled ? 'shopify-wizard-btn-primary' : 'shopify-wizard-btn-disabled'}`}
          onClick={finishEnabled ? (onFinish || onCheckout || nextStep) : undefined}
          disabled={!finishEnabled}
          title={!finishEnabled ? 'Complete design and 3D preview to finish' : ''}
        >
          {finishEnabled ? 'Finish' : 'Generating...'}
        </button>
      </div>
    </div>
  );
};

export default ShopifyStep2;