import GlassTypeSelector from '../UI/GlassTypeSelector';
import MapSelector from '../MapBuilder/MapSelector';
import './Step1.css';

const Step1 = () => {
  return (
    <div className="step1">
      <div className="step1-content">
        {/* Left Side - Map Selection */}
        <div className="map-panel">
          <div className="panel-header">
            <h2>Choose Your Location</h2>
            <p>Search for a location or drag the map to center on your desired area</p>
          </div>
          <div className="map-container">
            <MapSelector />
          </div>
        </div>
        
        {/* Right Side - Glass Selection */}
        <div className="glass-panel">
          <div className="panel-header">
            <h2>Select Glass Type</h2>
            <p>Choose the glass that will be engraved with your map</p>
          </div>
          <div className="glass-selector-container">
            <GlassTypeSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1;