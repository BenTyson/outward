import { useState, useEffect } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import MapRenderer from '../MapBuilder/MapRenderer';
import CylinderMapTest from '../CylinderTest/CylinderMapTest';
import './ProductGallery.css';

const ProductGallery = ({ activeStep }) => {
  const { 
    glassType, 
    modelImageUrl, 
    modelPreviewAvailable,
    location 
  } = useMapConfig();
  
  const [thumbnailIndex, setThumbnailIndex] = useState(0);

  // Gallery images for when no customization is active
  const defaultImages = [
    '/glass-images/rocks-white.jpg',
    '/glass-images/rocks-test-3.png',
    '/glass-images/rocks-test-2.png'
  ];

  // Determine what to show based on active step
  const renderMainView = () => {
    if (activeStep === 'preview' && modelPreviewAvailable && modelImageUrl) {
      // Show 3D preview
      return (
        <div className="preview-3d-container">
          <CylinderMapTest 
            textureSource={modelImageUrl} 
            hideControls={true} 
          />
        </div>
      );
    } else if (activeStep === 'customize' && location) {
      // Show map builder
      return (
        <div className="map-builder-container">
          <MapRenderer />
        </div>
      );
    } else {
      // Show default product images
      return (
        <div className="default-gallery">
          <img 
            src={defaultImages[thumbnailIndex]} 
            alt="Custom Map Glass"
            className="main-product-image"
          />
        </div>
      );
    }
  };

  return (
    <div className="product-gallery">
      <div className="main-image-container">
        {renderMainView()}
      </div>
      
      {/* Thumbnail navigation for default view */}
      {activeStep === 'location' && (
        <div className="thumbnail-nav">
          {defaultImages.map((img, index) => (
            <button
              key={index}
              className={`thumbnail ${thumbnailIndex === index ? 'active' : ''}`}
              onClick={() => setThumbnailIndex(index)}
            >
              <img src={img} alt={`View ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
      
      {/* Helper text based on step */}
      {activeStep === 'customize' && (
        <p className="helper-text">Design your custom map above</p>
      )}
      {activeStep === 'preview' && modelImageUrl && (
        <p className="helper-text">3D preview of your design</p>
      )}
    </div>
  );
};

export default ProductGallery;