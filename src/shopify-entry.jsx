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
  }

  /**
   * Initialize the configurator
   * @param {Object} options - Configuration options
   * @param {string} options.mountPoint - CSS selector for mount point (default: body)
   * @param {Object} options.product - Shopify product data
   * @param {Function} options.onAddToCart - Callback when item added to cart
   * @param {Function} options.onClose - Callback when modal closes
   * @param {Function} options.onComplete - Callback when design is complete
   */
  init(options = {}) {
    const {
      mountPoint = 'body',
      product = null,
      onAddToCart = null,
      onClose = null,
      onComplete = null
    } = options;

    // Store callbacks
    this.callbacks = { onAddToCart, onClose, onComplete };
    this.productData = product;

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
            onAddToCart={(data) => this.handleAddToCart(data)}
            productData={this.productData}
            initialGlassType={options.glassType}
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
   * Handle add to cart action
   * @param {Object} data - Configuration data and images
   */
  async handleAddToCart(data) {
    try {
      // Prepare cart item data
      const cartItem = {
        id: this.getVariantId(data.configuration.glassType),
        quantity: 1,
        properties: {
          'Glass Type': data.configuration.glassType,
          '_3D Model Preview': data.images.modelPreviewUrl || '',
          '_Map Preview': data.images.previewUrl || '',
          '_Laser File': data.images.laserFileUrl || '',
          '_Configuration': JSON.stringify({
            location: data.configuration.location,
            coordinates: data.configuration.coordinates,
            zoom: data.configuration.zoom,
            text1: data.configuration.text1,
            text2: data.configuration.text2,
            icons: data.configuration.icons
          })
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
      this.showSuccessMessage();

      // Track success
      this.trackEvent('added_to_cart', cartItem);

      // Close modal after delay
      setTimeout(() => this.close(), 2000);

    } catch (error) {
      console.error('Failed to add to cart:', error);
      this.showErrorMessage('Failed to add to cart. Please try again.');
    }
  }

  /**
   * Get variant ID for glass type
   * @param {string} glassType - Glass type
   * @returns {string} Shopify variant ID
   */
  getVariantId(glassType) {
    // Production variant IDs from existing Shopify integration
    const variants = {
      'rocks': '43120044769368',  // Whiskey glass
      'pint': '43120044802136',
      'wine': '43120044834904',
      'shot': '43120044867672'
    };
    
    return variants[glassType] || variants.rocks;
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
   * Show success message
   */
  showSuccessMessage() {
    // Create or update success message
    let message = document.getElementById('mgc-success-message');
    if (!message) {
      message = document.createElement('div');
      message.id = 'mgc-success-message';
      message.className = 'mgc-success-message';
      document.body.appendChild(message);
    }
    
    message.textContent = 'Design added to cart!';
    message.classList.add('show');
    
    setTimeout(() => {
      message.classList.remove('show');
    }, 3000);
  }

  /**
   * Show error message
   * @param {string} text - Error message text
   */
  showErrorMessage(text) {
    // Create or update error message
    let message = document.getElementById('mgc-error-message');
    if (!message) {
      message = document.createElement('div');
      message.id = 'mgc-error-message';
      message.className = 'mgc-error-message';
      document.body.appendChild(message);
    }
    
    message.textContent = text;
    message.classList.add('show');
    
    setTimeout(() => {
      message.classList.remove('show');
    }, 5000);
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
    if (typeof Shopify !== 'undefined' && Shopify.analytics) {
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