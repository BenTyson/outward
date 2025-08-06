import MapRenderer from '../MapBuilder/MapRenderer';
import TextIconControls from '../UI/TextIconControls';
import CanvasComposer from '../MapBuilder/CanvasComposer';
import './Step2.css';

const Step2 = () => {
  return (
    <div className="step2">
      <div className="step2-content">
        {/* Left Side - Map Preview */}
        <div className="preview-panel">
          <div className="panel-header">
            <h2>Your Map Design</h2>
            <p>This is how your engraved glass will look. Drag text and icons to position them perfectly.</p>
          </div>
          <div className="preview-container">
            <MapRenderer />
          </div>
        </div>
        
        {/* Right Side - Design Tools */}
        <div className="tools-panel">
          <div className="tool-section">
            <TextIconControls />
          </div>
          
          <div className="tool-section export-section">
            <CanvasComposer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;