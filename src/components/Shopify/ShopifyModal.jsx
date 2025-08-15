import { useEffect, useState, useRef } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import ShopifyStep1 from './ShopifyStep1';
import ShopifyStep2 from './ShopifyStep2';
import cloudinaryService from '../../utils/cloudinary';
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
    resetConfiguration
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

  // Handle checkout process
  const handleCheckout = async () => {
    if (!highResImage || !previewImage) {
      alert('Please generate your final design first');
      return;
    }

    setIsProcessing(true);
    setUploadProgress('Preparing your design...');

    try {
      // Capture 3D model preview if available
      let modelPreview = null;
      if (glassType === 'rocks') {
        setUploadProgress('Capturing 3D preview...');
        // Find and capture the 3D canvas
        const canvas = document.querySelector('.model-preview-container canvas');
        if (canvas) {
          try {
            modelPreview = canvas.toDataURL('image/png', 0.9);
          } catch (error) {
            console.warn('Could not capture 3D preview:', error);
          }
        }
      }

      // Upload images to Cloudinary
      setUploadProgress('Uploading images...');
      const uploadedImages = await cloudinaryService.uploadDesignFiles(
        {
          glassType,
          location: location.name || 'Custom Location',
          timestamp: Date.now()
        },
        {
          highRes: highResImage,
          preview: previewImage,
          modelPreview: modelPreview
        }
      );

      // Prepare configuration data
      const configurationData = {
        configuration: {
          glassType,
          location: location.name || 'Custom Location',
          coordinates,
          zoom,
          text1,
          text2,
          icons
        },
        images: uploadedImages
      };

      setUploadProgress('Adding to cart...');
      
      // Call the parent's add to cart handler
      await onAddToCart(configurationData);
      
      setUploadProgress('Success! Added to cart.');
      
      // Reset after successful add
      setTimeout(() => {
        resetConfiguration();
        setIsProcessing(false);
        setUploadProgress('');
      }, 1500);

    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to add to cart. Please try again.');
      setIsProcessing(false);
      setUploadProgress('');
    }
  };

  // Render steps
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <ShopifyStep1 />;
      case 2:
        return <ShopifyStep2 onCheckout={handleCheckout} />;
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
        {isProcessing && (
          <div className="mgc-processing-overlay">
            <div className="mgc-processing-content">
              <div className="mgc-processing-spinner"></div>
              <p>{uploadProgress}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopifyModal;