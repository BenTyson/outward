import { useMapConfig } from '../../contexts/MapConfigContext';
import './ShopifyMapExportControls.css';

const ShopifyMapExportControls = ({ onGenerateFinalImage, isGenerating }) => {
  return (
    <div className="shopify-map-export-controls">
      <button 
        onClick={onGenerateFinalImage}
        className="shopify-generate-btn"
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Final Design'}
      </button>
    </div>
  );
};

export default ShopifyMapExportControls;