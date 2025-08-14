import Client from 'shopify-buy';

class ShopifyService {
  constructor() {
    // Only initialize if we have the required env vars
    const domain = import.meta.env.VITE_SHOPIFY_DOMAIN;
    const token = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;
    
    if (domain && token && token !== 'YOUR_TOKEN_HERE') {
      this.client = Client.buildClient({
        domain: domain,
        storefrontAccessToken: token,
        apiVersion: '2024-10'  // Use stable API version
      });
      this.initialized = true;
      console.log('Shopify client initialized with domain:', domain);
    } else {
      console.warn('Shopify integration not configured. Please set VITE_SHOPIFY_DOMAIN and VITE_SHOPIFY_STOREFRONT_TOKEN');
      this.initialized = false;
    }
  }

  isConfigured() {
    return this.initialized;
  }

  async createCheckout(configuration) {
    if (!this.initialized) {
      throw new Error('Shopify integration not configured');
    }

    try {
      console.log('Creating checkout for configuration:', configuration);
      
      // Create a new checkout
      console.log('Step 1: Creating empty checkout...');
      const checkout = await this.client.checkout.create();
      console.log('Empty checkout created:', checkout.id);
      
      // Prepare line items with custom attributes
      const variantId = this.getVariantId(configuration.glassType);
      console.log('Using variant ID:', variantId);
      
      // Add custom attributes directly to line items (better formatting support)
      const customAttributes = this.formatLineItemAttributes(configuration);
      
      const lineItems = [{
        variantId: variantId,
        quantity: 1,
        customAttributes: customAttributes
      }];
      
      console.log('Line items to add:', lineItems);
      
      // Add line items to checkout
      console.log('Step 2: Adding line items to checkout...');
      const finalCheckout = await this.client.checkout.addLineItems(
        checkout.id, 
        lineItems
      );
      
      console.log('Checkout completed:', finalCheckout);
      return finalCheckout;
    } catch (error) {
      console.error('Failed to create checkout:', error);
      console.error('Error details:', error.message);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      if (error.response) {
        console.error('Error response:', error.response);
      }
      throw error;
    }
  }

  formatLineItemAttributes(configuration) {
    // Format attributes for line items (appears in order line details)
    const attributes = [
      { key: 'Glass Type', value: configuration.glassType || 'rocks' }
    ];

    // Add image URLs - these will appear in admin order details
    if (configuration.modelPreviewUrl) {
      attributes.push({ key: '_3D Model Preview', value: configuration.modelPreviewUrl });
    }
    if (configuration.previewUrl) {
      attributes.push({ key: '_Map Preview Image', value: configuration.previewUrl });
    }
    // High-res laser file - prefixed with underscore to hide from customer
    if (configuration.laserFileUrl) {
      attributes.push({ key: '_Laser File (High-Res)', value: configuration.laserFileUrl });
    }

    return attributes;
  }

  formatCustomAttributes(configuration) {
    // Minimal attributes - just what you need for fulfillment (checkout level)
    const attributes = [
      { key: 'Glass Type', value: configuration.glassType || 'rocks' }
    ];

    // Add URLs as plain text - Shopify will auto-link them
    if (configuration.modelPreviewUrl) {
      attributes.push({ key: '3D Model Preview', value: configuration.modelPreviewUrl });
    }
    if (configuration.previewUrl) {
      attributes.push({ key: 'Map Preview Image', value: configuration.previewUrl });
    }
    if (configuration.laserFileUrl) {
      attributes.push({ key: 'Laser File (High-Res)', value: configuration.laserFileUrl });
    }

    return attributes;
  }

  getVariantId(glassType) {
    // Variant IDs from your Shopify test product
    const variants = {
      'pint': 'gid://shopify/ProductVariant/43120044802136',
      'wine': 'gid://shopify/ProductVariant/43120044834904',
      'rocks': 'gid://shopify/ProductVariant/43120044769368',  // Whiskey glass
      'shot': 'gid://shopify/ProductVariant/43120044867672'
    };
    
    const variantId = variants[glassType];
    if (!variantId) {
      throw new Error(`Unknown glass type: ${glassType}`);
    }
    
    return variantId;
  }

  async fetchProduct(productHandle = 'custom-map-glass-test') {
    if (!this.initialized) {
      return null;
    }

    try {
      const products = await this.client.product.fetchByHandle(productHandle);
      return products;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      return null;
    }
  }
}

// Export as singleton
export default new ShopifyService();