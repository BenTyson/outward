import { useState, useEffect } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import TextIconControls from '../UI/TextIconControls';
import { CheckoutButton } from '../Checkout/CheckoutButton';
import LocationSearch from './LocationSearch';
import './CustomizationPanel.css';

const CustomizationPanel = ({ activeStep, setActiveStep }) => {
  const { 
    location,
    setLocation,
    coordinates,
    setCoordinates,
    glassType,
    setGlassType,
    modelImageUrl,
    highResImage,
    previewImage,
    setModelPreviewAvailable
  } = useMapConfig();
  
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-advance to customize step when location is selected
  useEffect(() => {
    if (location && activeStep === 'location') {
      setActiveStep('customize');
    }
  }, [location, activeStep, setActiveStep]);

  // Auto-advance to preview when model is ready
  useEffect(() => {
    if (modelImageUrl && activeStep === 'customize') {
      setActiveStep('preview');
      setModelPreviewAvailable(true);
    }
  }, [modelImageUrl, activeStep, setActiveStep, setModelPreviewAvailable]);

  const handleGenerateDesign = () => {
    setIsGenerating(true);
    // The actual generation happens in MapRenderer
    // This just triggers the UI state
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  const handleStartOver = () => {
    setLocation(null);
    setCoordinates(null);
    setActiveStep('location');
    setModelPreviewAvailable(false);
  };

  // Function to capture 3D model preview
  const capture3DModelImage = async () => {
    const container = document.querySelector('.preview-3d-container');
    if (container) {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const dataUrl = canvas.toDataURL('image/png', 0.9);
          return dataUrl;
        } catch (error) {
          console.error('Failed to capture 3D model:', error);
        }
      }
    }
    return null;
  };

  return (
    <div className="customization-panel">
      {/* Step Indicator */}
      <div className="step-indicator">
        <div className={`step ${activeStep === 'location' ? 'active' : location ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Location</span>
        </div>
        <div className={`step ${activeStep === 'customize' ? 'active' : modelImageUrl ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Customize</span>
        </div>
        <div className={`step ${activeStep === 'preview' ? 'active' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Preview</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="step-content">
        {/* Location Step */}
        {activeStep === 'location' && (
          <div className="location-step">
            <h3>Enter a location</h3>
            <LocationSearch />
            <p className="step-help">
              Search for any address, city, or landmark to create your custom map
            </p>
          </div>
        )}

        {/* Customize Step */}
        {activeStep === 'customize' && location && (
          <div className="customize-step">
            <div className="current-location">
              <span className="location-label">Location:</span>
              <span className="location-value">{location?.address || 'Unknown'}</span>
              <button className="change-location" onClick={handleStartOver}>
                Change
              </button>
            </div>
            
            <TextIconControls />
            
            <button 
              className="generate-button"
              onClick={handleGenerateDesign}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Design'}
            </button>
          </div>
        )}

        {/* Preview Step */}
        {activeStep === 'preview' && modelImageUrl && (
          <div className="preview-step">
            <div className="preview-info">
              <h3>Your Design is Ready!</h3>
              <p>Review your custom map glass design above</p>
            </div>

            {/* Glass Type Selection */}
            <div className="glass-type-selector">
              <label>Glass Type</label>
              <div className="glass-options">
                <button 
                  className={`glass-option ${glassType === 'rocks' ? 'active' : ''}`}
                  onClick={() => setGlassType('rocks')}
                >
                  Whiskey
                </button>
                <button 
                  className={`glass-option ${glassType === 'pint' ? 'active' : ''}`}
                  onClick={() => setGlassType('pint')}
                  disabled
                >
                  Pint (Coming Soon)
                </button>
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity</label>
                <div className="quantity-controls">
                  <button className="qty-btn">−</button>
                  <input type="number" value="1" readOnly className="qty-input" />
                  <button className="qty-btn">+</button>
                </div>
              </div>

              <CheckoutButton 
                configuration={{ glassType }}
                images={{
                  preview: previewImage || modelImageUrl,
                  highRes: highResImage,
                  modelPreview: capture3DModelImage
                }}
                disabled={!modelImageUrl}
              />
              
              <button className="start-over-link" onClick={handleStartOver}>
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomizationPanel;