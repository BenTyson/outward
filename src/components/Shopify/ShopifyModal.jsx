import { useEffect, useState, useRef } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import ShopifyStep1 from './ShopifyStep1';
import ShopifyStep2 from './ShopifyStep2';
import { createShopifyUploader } from '../../utils/shopifyFiles';
import './ShopifyModal.css';

const ShopifyModal = ({ 
  isOpen, 
  onClose, 
  onAddToCart, 
  productData,
  initialGlassType,
  initialLocation 
}) => {
  const { 
    currentStep,
    glassType,
    location,
    coordinates,
    zoom,
    text1,
    text2,
    icons,
    highResImage,
    previewImage,
    setGlassType,
    setLocation,
    setStep,
    resetConfiguration,
    // Phase D: Checkout flow
    designComplete,
    model3dComplete,
    finishEnabled,
    generatedImages,
    uploadingImages,
    uploadedImageUrls,
    uploadError,
    setUploadingImages,
    setUploadedImageUrls,
    setUploadError
  } = useMapConfig();

  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Handle initial values
  useEffect(() => {
    if (initialGlassType) {
      setGlassType(initialGlassType);
      // Stay on Step 1 but glass type is pre-selected (hidden in ShopifyStep1)
    }
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialGlassType, initialLocation, setGlassType, setLocation]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      // Focus modal after render
      setTimeout(() => {
        const firstFocusable = modalRef.current?.querySelector('button, input, select, textarea');
        firstFocusable?.focus();
      }, 100);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      // Close on Escape
      if (e.key === 'Escape') {
        handleClose();
      }
      
      // Trap focus within modal
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (!focusableElements || focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle closing
  const handleClose = () => {
    if (isProcessing) {
      if (!confirm('Your design is being processed. Are you sure you want to close?')) {
        return;
      }
    }
    resetConfiguration();
    onClose();
  };

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Phase D: Handle finish button (upload images and close modal)
  const handleFinish = async () => {
    if (!finishEnabled || uploadingImages) {
      console.warn('Finish not enabled or upload in progress');
      return;
    }

    if (!generatedImages || Object.keys(generatedImages).length === 0) {
      alert('Please generate your design first');
      return;
    }

    setUploadingImages(true);
    setUploadProgress('Uploading design files...');
    setUploadError(null);

    try {
      // Create uploader instance
      const uploader = await createShopifyUploader();
      const timestamp = Date.now();
      
      setUploadProgress('Uploading to Shopify Files...');
      
      // Upload all image variants to Shopify Files API
      const imageUrls = await uploader.uploadMultipleImages(
        generatedImages,
        glassType,
        timestamp
      );
      
      console.log('Upload successful:', imageUrls);
      
      // Store uploaded URLs
      setUploadedImageUrls(imageUrls);
      setUploadProgress('Upload complete!');
      
      // Call parent's finish handler with the uploaded URLs
      if (onAddToCart) {
        // Pass URLs to product page integration
        await onAddToCart(imageUrls);
      }
      
      setUploadProgress('Success! Design ready for cart.');
      
      // Close modal after brief delay
      setTimeout(() => {
        handleClose();
      }, 1000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error.message);
      setUploadProgress('Upload failed. Please try again.');
      
      // Show retry option
      setTimeout(() => {
        if (confirm('Upload failed. Would you like to try again?')) {
          handleFinish(); // Retry
        } else {
          setUploadingImages(false);
          setUploadProgress('');
        }
      }, 2000);
    } finally {
      if (!uploadError) {
        setUploadingImages(false);
      }
    }
  };

  // Legacy checkout handler for backward compatibility
  const handleCheckout = handleFinish;

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ShopifyStep1 />;
      case 2:
        return <ShopifyStep2 onFinish={handleFinish} />;
      default:
        return <ShopifyStep1 />;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="mgc-modal-overlay" 
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-label="Map Glass Configurator"
    >
      <div 
        className="mgc-modal-container" 
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="mgc-modal-header">
          <h2 className="mgc-modal-title">
            {currentStep === 1 ? 'Step 1: Create Your Map' : 'Step 2: Design Your Glass'}
          </h2>
          <button 
            className="mgc-modal-close"
            onClick={handleClose}
            aria-label="Close configurator"
            disabled={isProcessing}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="mgc-modal-body">
          {renderStep()}
        </div>

        {/* Processing Overlay */}
        {(isProcessing || uploadingImages) && (
          <div className="mgc-processing-overlay">
            <div className="mgc-processing-content">
              <div className="mgc-processing-spinner"></div>
              <p>{uploadProgress || 'Processing...'}</p>
              {uploadError && (
                <div className="mgc-upload-error">
                  <p style={{ color: '#ff6b6b', marginTop: '10px' }}>
                    Error: {uploadError}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyModal;