import { useMapConfig } from '../../contexts/MapConfigContext';
import { GLASS_RATIOS } from '../../utils/canvas';
import './GlassTypeSelector.css';

const GlassTypeSelector = () => {
  const { glassType, setGlassType } = useMapConfig();
  
  return (
    <div className="glass-type-selector">
      <h3>Select Glass Type</h3>
      <div className="glass-options">
        {Object.entries(GLASS_RATIOS).map(([type, config]) => (
          <button
            key={type}
            className={`glass-option ${glassType === type ? 'active' : ''}`}
            onClick={() => setGlassType(type)}
            aria-pressed={glassType === type}
          >
            <div className="glass-icon">
              <div 
                className="glass-preview"
                style={{
                  aspectRatio: `${config.width} / ${config.height}`
                }}
              />
            </div>
            <span className="glass-name">{config.name}</span>
            <span className="glass-ratio">{config.width}:{config.height}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default GlassTypeSelector;