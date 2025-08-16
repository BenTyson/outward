import React from 'react';
import ReactDOM from 'react-dom/client';
import { MapConfigProvider } from './contexts/MapConfigContext';
import ShopifyModal from './components/Shopify/ShopifyModal';
import './shopify-integration.css';

/**
 * Map Glass Configurator - Shopify Theme Integration
 * This entry point provides a global API for Shopify themes to control the configurator
 */

class MapGlassConfiguratorAPI {
  constructor() {
    this.root = null;
    this.modalRoot = null;
    this.isOpen = false;
    this.productData = null;
    this.callbacks = {
      onAddToCart: null,
      onClose: null,
      onComplete: null
    };
    // Phase D: Store uploaded image URLs for cart integration
    this.customImageUrls = null;
  }

  /**
   * Initialize the configurator
   * @param {Object} options - Configuration options
   * @param {string} options.mountPoint - CSS selector for mount point (default: body)
   * @param {Object} options.product - Shopify product data
   * @param {string} options.glassType - Pre-selected glass type
   * @param {Function} options.onAddToCart - Callback when item added to cart
   * @param {Function} options.onClose - Callback when modal closes
   * @param {Function} options.onComplete - Callback when design is complete
   */
  init(options = {}) {
    const {
      mountPoint = 'body',
      product = null,
      glassType = null,
      onAddToCart = null,
      onClose = null,
      onComplete = null
    } = options;

    // Store callbacks and data
    this.callbacks = { onAddToCart, onClose, onComplete };
    this.productData = product;
    this.glassType = glassType;

    // Create modal container if it doesn't exist
    let container = document.getElementById('map-glass-configurator-root');
    if (!container) {
      container = document.createElement('div');
      container.id = 'map-glass-configurator-root';
      container.className = 'mgc-root'; // Namespaced class
      
      const mountElement = document.querySelector(mountPoint);
      if (mountElement) {
        mountElement.appendChild(container);
      } else {
        document.body.appendChild(container);
      }
    }

    this.modalRoot = container;

    // Initialize React root (only once)
    if (!this.root) {
      this.root = ReactDOM.createRoot(container);
    }

    console.log('Map Glass Configurator initialized');
    return this;
  }

  /**
   * Open the configurator modal
   * @param {Object} options - Open options
   * @param {string} options.glassType - Pre-select glass type
   * @param {Object} options.location - Pre-set location
   */
  open(options = {}) {
    if (!this.root) {
      console.error('Configurator not initialized. Call init() first.');
      return;
    }

    this.isOpen = true;
    
    // Render the modal
    this.root.render(
      <React.StrictMode>
        <MapConfigProvider>
          <ShopifyModal
            isOpen={true}
            onClose={() => this.close()}
            onAddToCart={(imageUrls) => this.handleFinishComplete(imageUrls)}
            productData={this.productData}
            initialGlassType={options.glassType || this.glassType}
            initialLocation={options.location}
          />
        </MapConfigProvider>
      </React.StrictMode>
    );

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus management for accessibility
    this.previousActiveElement = document.activeElement;
    
    // Track opening
    this.trackEvent('configurator_opened', options);
  }

  /**
   * Close the configurator modal
   */
  close() {
    if (!this.root || !this.isOpen) return;

    this.isOpen = false;

    // Clear the React root
    this.root.render(null);

    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }

    // Call close callback
    if (this.callbacks.onClose) {
      this.callbacks.onClose();
    }

    // Track closing
    this.trackEvent('configurator_closed');
  }

  /**
   * Phase D: Handle finish complete (modal uploads images and closes)
   * @param {Object} imageUrls - Uploaded image URLs from Shopify Files API
   */
  async handleFinishComplete(imageUrls) {
    console.log('Design complete with images:', imageUrls);
    
    // Store image URLs for cart integration
    this.customImageUrls = imageUrls;
    
    // Replace main product image with 3D model
    if (imageUrls.model3d) {
      this.replaceProductImage(imageUrls.model3d);
    }
    
    // Update UI to show customization complete
    this.showCustomizationComplete();
    
    // Call complete callback
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(imageUrls);
    }
    
    // Track completion
    this.trackEvent('design_completed', { hasImages: Object.keys(imageUrls).length });
  }

  /**
   * Replace main product image with custom 3D model
   * @param {string} model3dUrl - URL of the 3D model image
   */
  replaceProductImage(model3dUrl) {
    // Common product image selectors across themes
    const selectors = [
      '.product__media img',
      '.product-single__photo img', 
      '.featured-image img',
      '[data-product-image] img',
      '.product-media img',
      '.main-product-image img'
    ];
    
    for (const selector of selectors) {
      const img = document.querySelector(selector);
      if (img) {
        img.src = model3dUrl;
        img.srcset = ''; // Clear responsive images
        img.alt = 'Custom Map Glass Design';
        console.log('Replaced product image with 3D model');
        break;
      }
    }
  }

  /**
   * Show customization complete UI
   */
  showCustomizationComplete() {
    // Update configurator button text
    const button = document.querySelector('[data-map-configurator-button]');
    if (button) {
      button.textContent = 'Edit Custom Design';
      button.classList.add('customized');
    }
    
    // Show success message
    this.showNotification('Custom design complete! Add to cart when ready.', 'success');
  }

  /**
   * Handle add to cart action (called when user clicks add to cart on product page)
   * @param {string} glassType - Glass type for fallback
   */
  async handleAddToCart(glassType) {
    if (!this.customImageUrls) {
      this.showNotification('Please customize your design first', 'error');
      return;
    }

    try {
      // Prepare cart item data with custom images
      const cartItem = {
        id: this.getProductId(glassType),
        quantity: 1,
        properties: {
          // Hidden properties (underscore prefix) for admin
          '_custom_map_preview': this.customImageUrls.preview || '',
          '_custom_map_3d': this.customImageUrls.model3d || '',
          '_custom_map_highres': this.customImageUrls.highres || '',
          '_custom_map_thumb': this.customImageUrls.thumbnail || '',
          '_design_timestamp': new Date().toISOString(),
          '_glass_type': glassType,
          
          // Visible property for customer
          'Custom Design': 'Personalized Map Glass'
        }
      };

      // Add to Shopify cart via AJAX API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cartItem)
      });

      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }

      const cartData = await response.json();

      // Update cart count in theme
      this.updateCartCount();

      // Call success callback
      if (this.callbacks.onAddToCart) {
        this.callbacks.onAddToCart(cartData);
      }

      // Show success message
      this.showNotification('Custom map glass added to cart!', 'success');

      // Optional: Open cart drawer
      if (window.theme && window.theme.openCartDrawer) {
        window.theme.openCartDrawer();
      }

      // Track success
      this.trackEvent('added_to_cart', cartItem);

    } catch (error) {
      console.error('Failed to add to cart:', error);
      this.showNotification('Error adding to cart. Please try again.', 'error');
    }
  }

  /**
   * Get product ID for glass type
   * @param {string} glassType - Glass type
   * @returns {string} Shopify product ID
   */
  getProductId(glassType) {
    // Product IDs for each glass type (no variants)
    const products = {
      'rocks': '8448404062296',  // Custom rocks glass product
      'pint': 'PRODUCT_ID_HERE',    // TODO: Update when pint product created
      'wine': 'PRODUCT_ID_HERE',    // TODO: Update when wine product created
      'shot': 'PRODUCT_ID_HERE'     // TODO: Update when shot product created
    };
    
    return products[glassType] || products.rocks;
  }

  /**
   * Update cart count in theme
   */
  async updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      
      // Update cart count elements (theme-specific selectors)
      const cartCounts = document.querySelectorAll('.cart-count, .cart-item-count, [data-cart-count]');
      cartCounts.forEach(el => {
        el.textContent = cart.item_count;
      });

      // Trigger custom event for theme to handle
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
    } catch (error) {
      console.error('Failed to update cart count:', error);
    }
  }

  /**
   * Show notification message
   * @param {string} text - Message text
   * @param {string} type - Message type ('success', 'error', 'info')
   */
  showNotification(text, type = 'info') {
    // Create or update notification
    let notification = document.getElementById('mgc-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'mgc-notification';
      notification.className = 'mgc-notification';
      document.body.appendChild(notification);
    }
    
    // Reset classes and set new type
    notification.className = `mgc-notification mgc-notification--${type}`;
    notification.textContent = text;
    notification.classList.add('show');
    
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      notification.classList.remove('show');
    }, duration);
  }

  /**
   * Legacy method for backward compatibility
   */
  showSuccessMessage() {
    this.showNotification('Design added to cart!', 'success');
  }

  /**
   * Legacy method for backward compatibility
   * @param {string} text - Error message text
   */
  showErrorMessage(text) {
    this.showNotification(text, 'error');
  }

  /**
   * Track analytics event
   * @param {string} eventName - Event name
   * @param {Object} eventData - Event data
   */
  trackEvent(eventName, eventData = {}) {
    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        event_category: 'Map Glass Configurator',
        ...eventData
      });
    }

    // Send to Shopify Analytics if available
    if (typeof Shopify !== 'undefined' && Shopify.analytics && typeof Shopify.analytics.track === 'function') {
      Shopify.analytics.track(eventName, eventData);
    }

    // Console log for debugging
    console.log(`[Configurator Event] ${eventName}`, eventData);
  }

  /**
   * Destroy the configurator and clean up
   */
  destroy() {
    if (this.isOpen) {
      this.close();
    }

    if (this.root) {
      this.root.unmount();
      this.root = null;
    }

    if (this.modalRoot) {
      this.modalRoot.remove();
      this.modalRoot = null;
    }

    this.productData = null;
    this.callbacks = {};
  }
}

// Create global instance
const configurator = new MapGlassConfiguratorAPI();

// Export for use in Shopify themes
if (typeof window !== 'undefined') {
  window.MapGlassConfigurator = configurator;
}

// Also export for module usage
export default configurator;