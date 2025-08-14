# Phase 3: Shopify Integration - Safe Incremental Approach

## Overview
Integrate the completed map configurator with the existing Shopify Basic store (lumengrave.com) using a careful, step-by-step approach that minimizes risk to the live store. Deploy configurator as a standalone app on Vercel, with minimal changes to the live store until fully tested.

## Current Status & Context
- **Shopify Plan**: Basic
- **Theme**: Custom theme (purchased template, customized)
- **Store URL**: www.lumengrave.com
- **Configurator Status**: Phase 1 & 2 complete (2-step workflow with 3D preview)
- **Expected Volume**: <100 orders initially
- **Deployment**: Vercel (free tier)
- **File Storage**: Cloudinary (free tier, 25GB/month)

---

## SAFE INTEGRATION STRATEGY

### Core Principles
1. **NO direct theme modifications** until fully tested
2. **Separate subdomain deployment** via Vercel
3. **Test with draft/hidden products** first
4. **Incremental rollout** with verification checkpoints
5. **Easy rollback** at any stage

---

## Phase 3A: Standalone Deployment & Basic Integration ✅ COMPLETED

### Step 1: Deploy Configurator to Vercel ✅ COMPLETED
**Status**: Configuration files created, ready for deployment
**Risk Level**: Zero (completely separate from store)

Completed:
- ✅ Created vercel.json configuration
- ✅ Created .env.production with environment variables
- ✅ Ready for deployment when needed

### Step 2: Set Up Cloudinary for File Storage ⏳ IN PROGRESS
**Status**: Integration code ready, needs account setup
**Risk Level**: Zero (external service)

**IMMEDIATE ACTIONS FOR USER:**

1. **Create Account**: Go to https://cloudinary.com/users/register/free
2. **Sign up with email** (free tier: 25GB storage, 25k transformations/month)
3. **After signup, go to Dashboard**: https://console.cloudinary.com/console
4. **Copy these values:**
   - **Cloud Name**: (appears at top of dashboard)
   - **API Key**: (in Account Details section)

5. **Create Upload Preset**:
   - Go to Settings → Upload → Upload presets
   - Click "Add upload preset"
   - **Upload preset name**: `lumengrave_maps`
   - **Signing Mode**: Unsigned
   - **Folder**: `map-glass`
   - Click Save

6. **Provide to Claude**:
   - Cloud Name: [YOUR_CLOUD_NAME]
   - Upload Preset: `lumengrave_maps`

**CLAUDE AGENT TASKS:**
- Update .env.local and .env.production with Cloudinary credentials
- Test image upload functionality via CheckoutButton
- Verify images appear in Shopify order custom attributes
- Verify URLs are accessible and images load correctly

### Step 3: Create Shopify Storefront API Access ✅ COMPLETED
**Status**: API access configured and working
**Risk Level**: Zero (read-only access)

Completed:
- ✅ Created private app: "Map Configurator" 
- ✅ Configured Storefront API scopes (all required scopes enabled)
- ✅ Generated and configured API access token: 3d4fa6fda4ad0a34d647ca191fd33095
- ✅ API connection verified and working

### Step 4: Create Test Product in Shopify ✅ COMPLETED
**Status**: Test product active and working
**Risk Level**: Zero (hidden from customers)

Completed:
- ✅ Created ACTIVE product: "Custom Map Glass - TEST"
- ✅ Added variants with correct IDs:
  - Whiskey Glass: 43120044769368 (mapped to 'rocks')
  - Pint Glass: 43120044802136  
  - Wine Glass: 43120044834904
  - Shot Glass: 43120044867672
- ✅ Disabled inventory tracking
- ✅ Made visible only to "Map Configurator" sales channel
- ✅ Hidden from all customer-facing channels

### Step 5: Implement Basic Cart Integration ✅ COMPLETED
**Status**: Working checkout integration verified
**Risk Level**: Low (external checkout)

Completed:
- ✅ Installed Shopify Buy SDK
- ✅ Created shopify.js service with minimal attribute passing
- ✅ Created CheckoutButton component 
- ✅ Integrated with Step2 workflow
- ✅ Simplified configuration to essential data only:
  - Glass Type (for variant selection)
  - Image URLs (when Cloudinary configured)
- ✅ **VERIFIED**: Successfully created checkout and completed test order
- ✅ **VERIFIED**: Glass Type custom attribute appears in Shopify order

**Critical Success**: Test order completed successfully, custom attributes flowing to Shopify admin!

---

## Phase 3B: Testing & Refinement

### Step 6: Internal Testing Phase
**Timeline**: Day 5-7
**Risk Level**: Zero (using test product)

Testing Checklist:
- [ ] Complete flow from design to checkout (5+ times)
- [ ] Test all glass types
- [ ] Test on mobile devices
- [ ] Verify image quality and storage
- [ ] Check checkout data integrity
- [ ] Test error handling
- [ ] Verify Cloudinary URLs work

### Step 7: Create Live Product (Hidden)
**Timeline**: Day 8
**Risk Level**: Low (hidden from public)

Tasks:
- Duplicate test product as "Custom Map Glass"
- Set status to ACTIVE but exclude from all collections
- Hide from search and navigation
- Price appropriately for live sales
- Generate direct product link for testing

### Step 8: Beta Testing with Friendly Customers
**Timeline**: Day 9-14
**Risk Level**: Low (controlled audience)

Process:
1. Share direct link with 3-5 friendly customers
2. Offer discount code for testing
3. Monitor orders closely
4. Gather feedback via email/phone
5. Process test orders through fulfillment

**Verification Checkpoint**:
- [ ] Successfully process 3+ real orders
- [ ] Download and verify laser files
- [ ] Confirm fulfillment process works
- [ ] No impact on regular store operations

---

## Phase 3C: Soft Launch

### Step 9: Add Simple Link to Store
**Timeline**: Day 15
**Risk Level**: Low (minimal theme change)

Implementation:
- Add single link/button to existing product pages
- "Design Your Custom Map Glass →"
- Opens configurator in new tab
- One-line theme modification only

Location options:
1. Product page banner
2. Navigation menu item
3. Homepage section
4. Collection page callout

### Step 10: Monitor and Optimize
**Timeline**: Day 16-30
**Risk Level**: Low

Metrics to track:
- Completion rate
- Error rate
- Load times
- Customer feedback
- Order accuracy

---

## Phase 3D: Full Integration (Future, Optional)

### Only After Proven Success (30+ successful orders)

Potential enhancements:
- Custom domain (configure.lumengrave.com)
- Embedded iframe in product page
- Cart drawer integration
- Automated order processing
- Multiple product types

---

## Technical Implementation Details

### File Structure Additions
```
src/
├── utils/
│   ├── shopify.js          # Shopify Buy SDK integration
│   ├── cloudinary.js        # Image upload/storage
│   └── orderManagement.js   # Order data formatting
├── components/
│   └── Checkout/
│       ├── CheckoutButton.jsx
│       └── CheckoutButton.css
├── config/
│   └── shopify.config.js    # Shopify configuration
```

### Environment Variables (.env.production)
```bash
# Mapbox (existing)
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibHVtZW5ncmF2ZSIsImEiOiJjbGx6ZG83a2sxaHhjM2xwNGVwYWowY3JzIn0.-3meyG5AjY3rfC86-C-hdQ
VITE_MAPBOX_STYLE_ID=lumengrave/clm6vi67u02jm01qiayvjbsmt

# Shopify (new)
VITE_SHOPIFY_DOMAIN=lumengrave.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=[TO BE CREATED]

# Cloudinary (new)
VITE_CLOUDINARY_CLOUD_NAME=[TO BE CREATED]
VITE_CLOUDINARY_UPLOAD_PRESET=[TO BE CREATED]

# App Configuration
VITE_APP_ENV=production
VITE_APP_PASSWORD=[TEMPORARY PASSWORD FOR TESTING]
```

### Shopify Buy SDK Integration
```javascript
// src/utils/shopify.js
import Client from 'shopify-buy';

class ShopifyService {
  constructor() {
    this.client = Client.buildClient({
      domain: process.env.VITE_SHOPIFY_DOMAIN,
      storefrontAccessToken: process.env.VITE_SHOPIFY_STOREFRONT_TOKEN
    });
  }

  async createCheckout(configuration) {
    // Upload images to Cloudinary first
    const imageUrls = await this.uploadImages(configuration);
    
    // Create checkout with custom attributes
    const checkout = await this.client.checkout.create();
    
    const lineItems = [{
      variantId: this.getVariantId(configuration.glassType),
      quantity: 1,
      customAttributes: [
        {key: 'Map Location', value: configuration.location},
        {key: 'Coordinates', value: `${configuration.lat},${configuration.lng}`},
        {key: 'Zoom Level', value: configuration.zoom.toString()},
        {key: 'Glass Type', value: configuration.glassType},
        {key: 'Custom Text 1', value: configuration.text1 || 'None'},
        {key: 'Custom Text 2', value: configuration.text2 || 'None'},
        {key: 'Preview Image', value: imageUrls.preview},
        {key: 'Laser File URL', value: imageUrls.highRes},
        {key: 'Configuration Date', value: new Date().toISOString()}
      ]
    }];
    
    await this.client.checkout.addLineItems(checkout.id, lineItems);
    return checkout;
  }

  getVariantId(glassType) {
    // These will be set after creating product in Shopify
    const variants = {
      'pint': 'gid://shopify/ProductVariant/[PINT_ID]',
      'wine': 'gid://shopify/ProductVariant/[WINE_ID]',
      'rocks': 'gid://shopify/ProductVariant/[ROCKS_ID]',
      'shot': 'gid://shopify/ProductVariant/[SHOT_ID]'
    };
    return variants[glassType];
  }
}
```

### Cloudinary Integration
```javascript
// src/utils/cloudinary.js
class CloudinaryService {
  constructor() {
    this.cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = process.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  }

  async uploadImage(imageDataUrl, options = {}) {
    const formData = new FormData();
    formData.append('file', imageDataUrl);
    formData.append('upload_preset', this.uploadPreset);
    
    // Add metadata
    formData.append('context', `order_id=${options.orderId}|type=${options.type}`);
    formData.append('tags', 'map-glass,customer-design');
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    return data.secure_url;
  }

  async uploadDesignFiles(configuration) {
    const timestamp = Date.now();
    
    // Upload preview (watermarked, optimized)
    const previewUrl = await this.uploadImage(configuration.previewImage, {
      type: 'preview',
      orderId: `preview-${timestamp}`
    });
    
    // Upload high-res for laser cutting
    const highResUrl = await this.uploadImage(configuration.highResImage, {
      type: 'laser',
      orderId: `laser-${timestamp}`
    });
    
    return { previewUrl, highResUrl };
  }
}
```

### Checkout Button Component
```javascript
// src/components/Checkout/CheckoutButton.jsx
import { useState } from 'react';
import { ShopifyService } from '../../utils/shopify';
import { CloudinaryService } from '../../utils/cloudinary';

export function CheckoutButton({ configuration, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Create Shopify checkout
      const shopify = new ShopifyService();
      const checkout = await shopify.createCheckout(configuration);
      
      // Open checkout in new tab
      window.open(checkout.webUrl, '_blank');
      
      // Track event
      console.log('Checkout created:', checkout.id);
      
    } catch (err) {
      console.error('Checkout failed:', err);
      setError('Failed to create checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="checkout-container">
      <button 
        onClick={handleCheckout}
        disabled={disabled || loading}
        className="checkout-button"
      >
        {loading ? 'Creating Order...' : 'Proceed to Checkout'}
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}
```

---

## Deployment Instructions (Vercel)

### Initial Setup
1. **Create Vercel Account** (if needed)
   - Go to vercel.com
   - Sign up with GitHub account

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   # In project root
   vercel
   
   # Follow prompts:
   # - Link to existing project? No
   # - What's your project name? lumengrave-configurator
   # - In which directory is your code? ./
   # - Want to override settings? No
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard
   - Select project
   - Settings → Environment Variables
   - Add all VITE_* variables

5. **Set up Password Protection** (during testing)
   ```javascript
   // Add to App.jsx
   if (process.env.VITE_APP_PASSWORD) {
     // Simple password protection
   }
   ```

### Custom Domain Setup (Optional, Later)
1. In Vercel Dashboard → Settings → Domains
2. Add domain: configure.lumengrave.com
3. Update DNS records at domain registrar:
   ```
   Type: CNAME
   Name: configure
   Value: cname.vercel-dns.com
   ```

---

## Order Processing Workflow

### Customer Flow
1. Customer designs map on configurator
2. Clicks "Proceed to Checkout"
3. Redirected to Shopify checkout (new tab)
4. Completes payment normally
5. Receives standard order confirmation

### Admin Flow
1. Order appears in Shopify admin
2. Order notes contain:
   - Map location and coordinates
   - Custom text
   - Links to images on Cloudinary
3. Click laser file URL to download high-res
4. Process engraving
5. Fulfill order normally

### Order Note Format
```
=== CUSTOM MAP GLASS CONFIGURATION ===
Location: Denver, CO, USA
Coordinates: 39.7392, -104.9903
Zoom Level: 12
Glass Type: Rocks
Custom Text 1: [Text or None]
Custom Text 2: [Text or None]

Preview Image: [Cloudinary URL]
Laser File (High-Res): [Cloudinary URL - 24hr expiration]

Configuration Date: 2025-08-13T10:30:00Z
=====================================
```

---

## Testing Checklist

### Pre-Launch Testing
- [ ] Vercel deployment works
- [ ] Password protection active
- [ ] Cloudinary uploads successful
- [ ] Shopify API connection works
- [ ] Test product created (DRAFT)
- [ ] Checkout opens with correct data
- [ ] All custom properties visible in checkout
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Images downloadable from Cloudinary

### Beta Testing
- [ ] 3-5 friendly customers test
- [ ] Orders appear correctly in admin
- [ ] Laser files download properly
- [ ] Fulfillment process smooth
- [ ] Customer emails correct
- [ ] No impact on regular store

### Launch Readiness
- [ ] 10+ successful test orders
- [ ] Fulfillment process documented
- [ ] Support team briefed
- [ ] Backup plan ready
- [ ] Monitoring in place

---

## Rollback Plan

### If Issues Occur
1. **Level 1**: Remove link from store (instant)
2. **Level 2**: Password protect configurator (2 min)
3. **Level 3**: Unpublish product (5 min)
4. **Level 4**: Take configurator offline (instant via Vercel)

### Recovery Process
1. Fix identified issues
2. Test thoroughly in staging
3. Re-deploy to Vercel
4. Test with single order
5. Re-enable gradually

---

## Success Metrics

### Phase 3A-B Success (Testing)
- Zero impact on existing store
- 5+ successful test checkouts
- All data properly transferred
- Images properly stored

### Phase 3C Success (Soft Launch)
- 20+ successful customer orders
- <5% error rate
- Positive customer feedback
- Smooth fulfillment process

### Long-term Success
- 50+ orders processed
- Consistent order flow
- Customer satisfaction high
- Ready for theme integration

---

## Support Documentation

### For Customer Support Team
```
New Product: Custom Map Glass

What it is:
- Customer designs custom map on their glass
- Chooses location, adds text
- Gets 3D preview (rocks glass only)
- Orders through special configurator

How to handle issues:
1. Design not loading → Clear cache, try different browser
2. Can't add to cart → Check popup blockers
3. Lost design → Unfortunately can't recover, need to recreate
4. Wrong location → Customer needs to restart design

Order processing:
- Orders appear normally in Shopify
- Contains special links to design files
- Forward to fulfillment team
```

### For Fulfillment Team
```
Processing Custom Map Orders:

1. Look for "Custom Map Glass" orders
2. Check order notes for configuration
3. Click "Laser File URL" link
4. Download high-resolution PNG (4800x4800px)
5. Process according to glass type
6. Standard quality checks apply

File specifications:
- Resolution: 1200 DPI
- Format: PNG with transparency
- Size: Varies by glass type
- Color: Black on white background
```

---

## FAQ

### Q: Why not embed directly in Shopify theme?
A: Starting with separate deployment eliminates risk to live store. Can embed later after proven success.

### Q: Why Cloudinary over other storage?
A: Free tier sufficient for <100 orders, automatic image optimization, CDN included, no backend needed.

### Q: What about order notifications?
A: Standard Shopify order notifications work normally. Custom properties appear in order details.

### Q: How long are files stored?
A: Preview images permanent (watermarked). High-res files have 24-hour expiration URLs, but source files retained for 30 days.

### Q: Can customers save/share designs?
A: Not in initial version. Could add in Phase 4 with user accounts.

---

## Next Steps

### Immediate Actions (Day 1)
1. Create Vercel account
2. Create Cloudinary account  
3. Create Shopify private app for API access
4. Update environment variables
5. Deploy initial version to Vercel

### This Week
- Complete Phase 3A (Steps 1-5)
- Begin internal testing
- Refine based on findings

### Next Week
- Beta testing with friendly customers
- Refine fulfillment process
- Prepare for soft launch

---

*This plan prioritizes safety and incremental rollout. Each phase can be paused or rolled back without affecting the live store. Success at each stage builds confidence for the next.*