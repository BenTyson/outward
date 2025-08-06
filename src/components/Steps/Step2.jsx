import MapRenderer from '../MapBuilder/MapRenderer';
import TextIconControls from '../UI/TextIconControls';
import './Step2.css';

const Step2 = () => {
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
    </div>
  );
};

export default Step2;