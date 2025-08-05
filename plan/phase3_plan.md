# Phase 3: Shopify Integration

## Overview
Seamlessly integrate the completed map configurator and 3D mockup system into the existing Shopify store (lumengrave.com). Enable customers to purchase configured glasses through the standard Shopify checkout while maintaining the custom configurator experience.

## Prerequisites
- Phase 1 Map Builder completed and tested
- Phase 2 3D Mockup Generator completed and tested
- Access to Shopify store theme files
- Shopify product variants created for each glass type

---

## Integration Strategy

### Approach: Custom Product Page with iframe Embed
Replace standard product pages for map glasses with custom configurator while maintaining native Shopify checkout flow.

#### Architecture Overview
```
Customer Journey:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Browse Store    │    │ Custom Product  │    │ Shopify Cart &  │
│ (Standard)      │───►│ Page with       │───►│ Checkout        │
│                 │    │ Configurator    │    │ (Standard)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Shopify Product Setup

#### Product Structure Required
```
Product: "Custom Map Glass"
├── Variant 1: Pint Glass - $[PRICE_TBD]
├── Variant 2: Wine Glass - $[PRICE_TBD] 
└── Variant 3: Rocks Glass - $[PRICE_TBD]

Product Handle: "custom-map-glass"
```

#### Custom Properties Schema
```javascript
const orderProperties = {
  'Map Location': string,           // "Denver, CO, USA"
  'Map Coordinates': string,        // "39.7392,-104.9903"
  'Map Zoom Level': string,         // "12"
  'Glass Type': string,             // "pint" | "wine" | "rocks"
  'Custom Text': string,            // User's custom text
  'Text Position': string,          // "x,y coordinates"
  'Selected Icons': string,         // JSON array of icon data
  'Design Preview URL': string,     // Low-res preview image
  'Laser File URL': string,         // High-res PNG for engraving
  'Configuration ID': string        // Unique identifier
};
```

### Technical Implementation

#### 1. Theme Integration Component
```
Purpose: Detect and replace map glass product pages
Features:
- Product handle detection
- Conditional rendering (configurator vs standard)
- Theme compatibility layer
- CSS integration
```

#### 2. Shopify API Integration
```
Purpose: Cart and checkout integration
Features:
- Add to cart functionality
- Variant selection
- Custom properties attachment
- Price calculation
```

#### 3. Order Processing Webhook
```
Purpose: Handle post-purchase order processing
Features:
- Extract configuration data
- Generate final laser files
- Send files to fulfillment system
- Customer notification
```

#### 4. File Storage Management
```
Purpose: Store and serve design files
Features:
- Design file hosting
- Temporary vs permanent storage
- File cleanup routines
- Access control
```

### Implementation Details

#### Theme File Modifications

##### Product Template Override
```liquid
<!-- templates/product-custom-map.liquid -->
{% comment %} Custom template for map glass products {% endcomment %}

{% if product.handle == 'custom-map-glass' %}
  <div class="custom-product-page">
    <div class="product-header">
      <h1>{{ product.title }}</h1>
      <div class="product-price">
        <span class="price-range">
          From ${{ product.price_min | money_without_currency }}
        </span>
      </div>
    </div>
    
    <div class="configurator-embed">
      <iframe 
        id="map-configurator"
        src="{{ 'configurator-url' | append: '?shop=' | append: shop.domain | append: '&product=' | append: product.id }}"
        width="100%" 
        height="900px"
        frameborder="0"
        allow="geolocation">
      </iframe>
    </div>
    
    <div class="product-details">
      {{ product.description }}
    </div>
  </div>
{% else %}
  {% comment %} Standard product template {% endcomment %}
  {% include 'product-standard' %}
{% endif %}
```

##### Cart Integration JavaScript
```javascript
// assets/configurator-integration.js
class ShopifyIntegration {
  constructor() {
    this.setupMessageHandlers();
  }
  
  setupMessageHandlers() {
    window.addEventListener('message', (event) => {
      if (event.data.action === 'addToCart') {
        this.addConfiguredProductToCart(event.data);
      }
    });
  }
  
  async addConfiguredProductToCart(config) {
    const cartData = {
      id: config.variantId,
      quantity: 1,
      properties: {
        'Map Location': config.location,
        'Map Coordinates': `${config.lat},${config.lng}`,
        'Map Zoom Level': config.zoom.toString(),
        'Glass Type': config.glassType,
        'Custom Text': config.text || '',
        'Text Position': config.textPosition || '',
        'Selected Icons': JSON.stringify(config.icons || []),
        'Design Preview URL': config.previewUrl,
        'Laser File URL': config.laserFileUrl,
        'Configuration ID': config.configId
      }
    };
    
    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartData)
      });
      
      if (response.ok) {
        // Show success message or redirect to cart
        this.showCartSuccess();
        // Optionally auto-open cart drawer
        document.querySelector('.cart-drawer-toggle')?.click();
      }
    } catch (error) {
      console.error('Cart addition failed:', error);
      this.showCartError();
    }
  }
  
  showCartSuccess() {
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'cart-success-notification';
    notification.textContent = 'Custom glass added to cart!';
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}

// Initialize integration
new ShopifyIntegration();
```

#### Configurator-to-Shopify Communication

##### PostMessage API Usage
```javascript
// In configurator application
class ShopifyMessenger {
  constructor(shopDomain, productId) {
    this.shopDomain = shopDomain;
    this.productId = productId;
    this.variants = null;
    this.loadProductData();
  }
  
  async loadProductData() {
    // Fetch product variants from Shopify Storefront API
    const query = `
      query getProduct($handle: String!) {
        productByHandle(handle: $handle) {
          id
          variants(first: 10) {
            edges {
              node {
                id
                title
                priceV2 {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    `;
    
    // Implementation depends on Shopify Storefront API setup
    this.variants = await this.fetchFromStorefront(query);
  }
  
  addToCart(configuration) {
    // Determine variant based on glass type
    const variant = this.getVariantByGlassType(configuration.glassType);
    
    const cartData = {
      action: 'addToCart',
      variantId: variant.id,
      ...configuration
    };
    
    // Send to parent window (Shopify theme)
    window.parent.postMessage(cartData, `https://${this.shopDomain}`);
  }
  
  getVariantByGlassType(glassType) {
    const variantMap = {
      'pint': 'Pint Glass',
      'wine': 'Wine Glass', 
      'rocks': 'Rocks Glass'
    };
    
    return this.variants.find(v => 
      v.title.includes(variantMap[glassType])
    );
  }
}
```

### Order Processing System

#### Webhook Handler
```javascript
// webhook-handler.js (deployed separately)
import { createHash } from 'crypto';

export async function handleOrderCreated(orderData) {
  // Verify webhook authenticity
  if (!verifyWebhook(orderData)) {
    return { status: 401, body: 'Unauthorized' };
  }
  
  // Process custom map glass orders
  for (const lineItem of orderData.line_items) {
    if (lineItem.product_id === CUSTOM_MAP_PRODUCT_ID) {
      await processCustomMapOrder(lineItem, orderData);
    }
  }
  
  return { status: 200, body: 'OK' };
}

async function processCustomMapOrder(lineItem, order) {
  const properties = lineItem.properties;
  
  // Extract configuration
  const config = {
    orderId: order.id,
    customerEmail: order.email,
    location: properties['Map Location'],
    coordinates: properties['Map Coordinates'],
    glassType: properties['Glass Type'],
    laserFileUrl: properties['Laser File URL'],
    configId: properties['Configuration ID']
  };
  
  // Generate final laser file if needed
  await generateFinalLaserFile(config);
  
  // Send to fulfillment system
  await sendToFulfillment(config);
  
  // Notify customer
  await sendCustomerNotification(config);
}
```

#### File Management System
```javascript
// file-manager.js
class DesignFileManager {
  constructor(storageProvider) {
    this.storage = storageProvider; // AWS S3, Google Cloud, etc.
  }
  
  async storeDesignFile(configId, fileData, type = 'png') {
    const filename = `designs/${configId}-laser.${type}`;
    const url = await this.storage.upload(filename, fileData);
    
    // Store metadata in database
    await this.saveFileMetadata({
      configId,
      filename,
      url,
      type,
      createdAt: new Date(),
      status: 'active'
    });
    
    return url;
  }
  
  async cleanupTempFiles(olderThanDays = 7) {
    // Clean up preview files older than specified days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    const tempFiles = await this.findTempFiles(cutoffDate);
    for (const file of tempFiles) {
      await this.storage.delete(file.filename);
      await this.deleteFileMetadata(file.id);
    }
  }
}
```

### Security and Performance

#### Security Considerations
```javascript
// Security measures
const securityConfig = {
  // CORS settings for configurator iframe
  allowedOrigins: [
    'https://lumengrave.com',
    'https://www.lumengrave.com',
    'https://configurator.lumengrave.com'
  ],
  
  // Webhook verification
  webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET,
  
  // File access controls
  signedUrls: true,
  urlExpiration: 24 * 60 * 60 * 1000 // 24 hours
};
```

#### Performance Optimizations
```javascript
// Caching strategy
const cacheConfig = {
  // Static assets
  modelFiles: '30d',      // 3D models cached for 30 days
  mapTiles: '7d',         // Map tiles cached for 7 days
  previewImages: '1d',    // Preview images cached for 1 day
  
  // Dynamic content
  productData: '1h',      // Product info cached for 1 hour
  configData: '15m'       // Configuration data cached for 15 minutes
};
```

### File Structure for Phase 3
```
shopify-integration/
├── theme-files/
│   ├── templates/
│   │   └── product-custom-map.liquid
│   ├── assets/
│   │   ├── configurator-integration.js
│   │   └── custom-product-styles.css
│   └── snippets/
│       └── configurator-embed.liquid
├── webhooks/
│   ├── order-created.js
│   ├── order-updated.js
│   └── webhook-verification.js
├── api/
│   ├── storefront-client.js
│   ├── admin-client.js
│   └── product-sync.js
└── utils/
    ├── file-manager.js
    ├── order-processor.js
    └── notification-service.js
```

### Success Criteria for Phase 3
- [ ] Custom product page displays configurator seamlessly
- [ ] Add to cart works with proper variant selection
- [ ] Custom properties are properly stored with orders
- [ ] Order webhooks process custom map orders correctly
- [ ] Files are properly stored and accessible for fulfillment
- [ ] Customer receives order confirmation with preview
- [ ] Integration works on mobile devices
- [ ] No impact on other store products/functionality

### Testing Requirements
- [ ] End-to-end purchase flow testing
- [ ] Order processing webhook testing
- [ ] File storage and retrieval testing
- [ ] Mobile checkout experience testing
- [ ] Cart abandonment and recovery testing
- [ ] Customer email notification testing
- [ ] Fulfillment system integration testing

### Environment Variables (Additional)
```
SHOPIFY_STORE_DOMAIN=lumengrave.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_token
SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_token
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret
CUSTOM_MAP_PRODUCT_ID=your_product_id
FULFILLMENT_API_URL=your_fulfillment_endpoint
```

### Dependencies for Phase 3
```json
{
  "@shopify/storefront-api-client": "^1.0.0",
  "@shopify/admin-api-client": "^1.0.0",
  "crypto": "^1.0.1"
}
```

---

## Deployment Strategy

### Staging Environment
1. **Test Store Setup**: Create Shopify development store
2. **Theme Testing**: Deploy theme modifications to test store
3. **Webhook Testing**: Test webhook handlers with test orders
4. **End-to-End Testing**: Complete purchase flow validation

### Production Deployment
1. **Backup Current Theme**: Save current production theme
2. **Deploy Theme Changes**: Push modified theme files
3. **Configure Webhooks**: Set up production webhook endpoints
4. **Monitor Performance**: Watch for errors and performance issues
5. **Customer Support**: Prepare support team for new functionality

---

## Notes for Claude Code Agent

### Build Priority
1. Start with basic theme integration and iframe embed
2. Implement PostMessage communication between systems
3. Add cart integration with custom properties
4. Set up webhook processing for orders
5. Implement file management and storage
6. Add error handling and monitoring

### Key Considerations
- Theme compatibility must be maintained
- Existing store functionality cannot be disrupted
- Mobile experience is critical for Shopify stores
- Order processing must be reliable and fast
- Customer support workflows need documentation

### Shopify Specifics
- Liquid template syntax required for theme modifications
- Shopify API rate limits must be respected
- PCI compliance maintained through Shopify checkout
- Multi-currency support if store uses Shopify Payments

---

*This specification covers Phase 3 implementation. Proceed only after Phases 1 and 2 are complete and thoroughly tested.*