import { useMapConfig } from '../../contexts/MapConfigContext';
import MapSelector from '../MapBuilder/MapSelector';
import './ShopifyStep1.css';

const ShopifyStep1 = () => {
  const { nextStep, prevStep, currentStep, totalSteps } = useMapConfig();

  const canGoNext = () => {
    // Add validation logic here if needed
    return currentStep < totalSteps;
  };

  const canGoPrev = () => {
    return currentStep > 1;
  };

  return (
    <div className="shopify-step1">
      <div className="shopify-step1-content">
        {/* Map selection with margins */}
        <div className="shopify-map-panel">
          <div className="shopify-map-container">
            <MapSelector />
          </div>
          <div className="shopify-map-description">
            <p>This map will be engraved 360° around your glass. When your map parameters are correct, proceed to the next step to add optional design elements and preview the glass.</p>
          </div>
        </div>
      </div>
      
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

export default ShopifyStep1;