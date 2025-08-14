import { useState } from 'react';
import shopifyService from '../../utils/shopify';
import cloudinaryService from '../../utils/cloudinary';
import './CheckoutButton.css';

// Generate high-resolution laser file from preview image
const generateHighResLaserFile = async (previewImage) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Create high-res canvas at 4800px width (1200 DPI equivalent)
      const aspectRatio = img.width / img.height;
      const width = 4800;
      const height = Math.round(width / aspectRatio);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // High quality settings
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image at high resolution
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as high quality PNG
      const highResDataUrl = canvas.toDataURL('image/png', 1.0);
      console.log(`Generated high-res laser file: ${width}x${height}px, size: ~${Math.round(highResDataUrl.length / 1024)}KB`);
      resolve(highResDataUrl);
    };
    img.src = previewImage;
  });
};

export function CheckoutButton({ configuration, images, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Check if Shopify is configured
      if (!shopifyService.isConfigured()) {
        setError('Checkout is not yet available. Please check back soon!');
        return;
      }
      
      let finalConfig = { ...configuration };
      
      // Upload images to Cloudinary if configured
      if (cloudinaryService.isConfigured() && images) {
        console.log('Uploading design files to Cloudinary...');
        
        // Capture 3D model preview if function provided
        let modelPreviewImage = null;
        if (images.modelPreview && typeof images.modelPreview === 'function') {
          try {
            modelPreviewImage = await images.modelPreview();
            console.log('3D model preview captured');
          } catch (error) {
            console.error('Failed to capture 3D model preview:', error);
          }
        }
        
        // Generate high-resolution laser file
        let highResImage = images.highRes;
        if (!highResImage && images.preview) {
          console.log('Generating high-resolution laser file...');
          // Generate actual high-res image at 4800px for laser engraving
          highResImage = await generateHighResLaserFile(images.preview);
        }
        
        const uploadedUrls = await cloudinaryService.uploadDesignFiles(
          configuration,
          {
            preview: images.preview,
            highRes: highResImage,
            modelPreview: modelPreviewImage
          }
        );
        
        // Add uploaded URLs to configuration
        finalConfig = {
          ...finalConfig,
          ...uploadedUrls
        };
      } else {
        console.log('Cloudinary not configured, skipping image upload');
      }
      
      // Create Shopify checkout
      console.log('Creating Shopify checkout...');
      const checkout = await shopifyService.createCheckout(finalConfig);
      
      // Open checkout in new tab
      if (checkout && checkout.webUrl) {
        window.open(checkout.webUrl, '_blank');
        setSuccess(true);
        
        // Log for debugging
        console.log('Checkout created successfully:', {
          id: checkout.id,
          url: checkout.webUrl,
          lineItems: checkout.lineItems
        });
      } else {
        throw new Error('Checkout URL not received');
      }
      
    } catch (err) {
      console.error('Checkout failed:', err);
      
      // Simple error message for now
      setError('Unable to create checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Don't show button if required configuration is missing
  if (!configuration || !configuration.glassType) {
    return null;
  }
  
  return (
    <div className="checkout-container">
      <button 
        onClick={handleCheckout}
        disabled={disabled || loading}
        className={`checkout-button ${loading ? 'loading' : ''} ${success ? 'success' : ''}`}
      >
        {loading ? 'Creating Order...' : success ? 'Checkout Opened!' : 'Proceed to Checkout'}
      </button>
      
      {error && (
        <div className="checkout-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="checkout-success">
          <p>Your checkout has opened in a new tab.</p>
          <p className="checkout-hint">If it didn't open, please disable your popup blocker and try again.</p>
        </div>
      )}
      
      {!shopifyService.isConfigured() && (
        <div className="checkout-info">
          <p className="checkout-coming-soon">Checkout coming soon! Currently in testing mode.</p>
        </div>
      )}
    </div>
  );
}