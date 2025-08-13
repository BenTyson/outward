import { useMapConfig } from '../../contexts/MapConfigContext';
import CylinderMapTest from '../CylinderTest/CylinderMapTest';
import './Step3.css';

/**
 * Step3 - 3D Glass Preview Component
 * 
 * Wraps CylinderMapTest for integration into the wizard system.
 * Currently only supports rocks glass - safety checks ensure proper fallback.
 * 
 * Requirements:
 * - glassType === 'rocks' 
 * - modelImageUrl must contain Phase 1 generated image
 * - modelPreviewAvailable must be true
 */
const Step3 = () => {
  const { modelImageUrl, glassType, modelPreviewAvailable } = useMapConfig();
  
  // Safety checks - only render for rocks glass with available image
  if (glassType !== 'rocks') {
    return (
      <div className="step3-error">
        <div className="error-content">
          <h3>3D Preview Not Available</h3>
          <p>3D glass preview is currently only available for rocks glass.</p>
          <p>Selected glass type: <strong>{glassType}</strong></p>
        </div>
      </div>
    );
  }
  
  if (!modelPreviewAvailable || !modelImageUrl) {
    return (
      <div className="step3-error">
        <div className="error-content">
          <h3>3D Preview Not Ready</h3>
          <p>Please generate your map design in Step 2 first.</p>
          <p>The 3D preview will be available after creating your design.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="step3">
      <div className="step3-header">
        <h2>3D Glass Preview</h2>
        <p>Your custom map design rendered on a realistic rocks glass</p>
        <div className="step3-info">
          <span className="info-badge">Rocks Glass</span>
          <span className="info-badge">Interactive 3D Model</span>
        </div>
      </div>
      
      <div className="step3-content">
        <CylinderMapTest textureSource={modelImageUrl} />
      </div>
      
      <div className="step3-footer">
        <p className="footer-note">
          Use the controls on the right to adjust the 3D model positioning and appearance.
          This preview shows how your design will look when laser engraved on the glass.
        </p>
      </div>
    </div>
  );
};

export default Step3;