import { useState } from 'react';
import shopifyService from '../../utils/shopify';
import cloudinaryService from '../../utils/cloudinary';
import './CheckoutButton.css';

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
        const uploadedUrls = await cloudinaryService.uploadDesignFiles(
          configuration,
          images
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