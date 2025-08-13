import MapRenderer from '../MapBuilder/MapRenderer';
import TextIconControls from '../UI/TextIconControls';
import CylinderMapTest from '../CylinderTest/CylinderMapTest';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './Step2.css';

const Step2 = () => {
  const { glassType, modelPreviewAvailable, modelImageUrl } = useMapConfig();

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
          <div className="model-preview-container">
            <CylinderMapTest 
              textureSource={modelImageUrl} 
              hideControls={true} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2;