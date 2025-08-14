import { useState } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import CustomizationPanel from './CustomizationPanel';
import './ProductPageLayout.css';

const ProductPageLayout = () => {
  const [activeStep, setActiveStep] = useState('location'); // location, customize, preview
  const { modelImageUrl } = useMapConfig();

  return (
    <div className="product-page">
      <div className="product-container">
        {/* Left Side - Product Gallery/Preview */}
        <div className="product-gallery-section">
          <ProductGallery activeStep={activeStep} />
        </div>

        {/* Right Side - Product Info & Customization */}
        <div className="product-details-section">
          <ProductInfo />
          
          <div className="customization-section">
            <CustomizationPanel 
              activeStep={activeStep}
              setActiveStep={setActiveStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPageLayout;