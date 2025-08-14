# Shopify Hybrid Integration Plan - Claude Agent Reference

## CRITICAL CONTEXT FOR CLAUDE AGENTS
This document describes a PARTIAL IMPLEMENTATION of embedding the map glass configurator directly into Shopify product pages via modal. Core files created but NOT YET TESTED. Live store at lumengrave.com must NOT be affected during integration.

## Current Implementation Status

### ✅ COMPLETED COMPONENTS
```
src/
├── shopify-entry.jsx              ✅ Global API for theme control
├── shopify-integration.css        ✅ Namespaced styles (mgc- prefix)
├── components/
│   └── Shopify/
│       ├── ShopifyModal.jsx       ✅ Modal wrapper with cart integration
│       └── ShopifyModal.css       ✅ Modal-specific styles
├── vite.config.shopify.js         ✅ UMD build configuration
└── package.json                    ✅ Added build:shopify script

shopify-theme/
├── snippets/
│   ├── map-configurator-button.liquid    ✅ Product page button
│   └── map-configurator-scripts.liquid   ✅ Script loader
├── config/
│   └── settings_schema_addition.json     ✅ Theme settings
└── deploy.sh                              ✅ Deployment helper
```

### ⚠️ NOT YET EXECUTED
- Build process (`npm run build:shopify`) - NOT RUN
- Theme cloning - NOT DONE
- File upload to Shopify - NOT DONE
- Testing in live environment - NOT DONE

## Architecture Overview

### Integration Strategy: Modal-Based UMD Bundle
**Approach**: Build React app as UMD bundle, inject into Shopify theme, display in modal overlay

### Key Design Decisions
1. **UMD Bundle Format**: Enables script tag inclusion without module system
2. **Modal Presentation**: Avoids page navigation, maintains cart context
3. **AJAX Cart Integration**: No redirect, better UX
4. **CSS Namespacing**: All styles prefixed with `.mgc-` to prevent conflicts
5. **Global API**: `window.MapGlassConfigurator` for theme control

### Data Flow
```
Product Page Button Click
    ↓
MapGlassConfigurator.open()
    ↓
React App Renders in Modal
    ↓
User Designs Map (Step 1 & 2)
    ↓
"Add to Cart" Click
    ↓
Upload to Cloudinary
    ↓
AJAX POST to /cart/add.js
    ↓
Update Cart Count
    ↓
Close Modal
```

## Critical File Analysis

### shopify-entry.jsx
**Purpose**: Bridge between Shopify theme and React app
**Key Features**:
- Global `MapGlassConfigurator` object
- `init()`: Setup with callbacks
- `open()`: Launch modal with options
- `handleAddToCart()`: AJAX cart integration
- `close()`: Cleanup and callbacks

**Critical Code**:
```javascript
// Variant IDs (MUST UPDATE for production)
const variants = {
  'rocks': '43120044769368',  // TEST product IDs
  'pint': '43120044802136',
  'wine': '43120044834904',
  'shot': '43120044867672'
};

// AJAX Cart Add (Shopify-specific)
await fetch('/cart/add.js', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(cartItem)
});
```

### ShopifyModal.jsx
**Purpose**: Modal wrapper around existing app
**Key Features**:
- Focus trap for accessibility
- Escape key handling
- Processing overlay during upload
- Embedded checkout button
- Image upload orchestration

**Integration Points**:
- Uses existing `MapConfigContext`
- Renders `Step1` and `Step2` components
- Captures 3D canvas for rocks glass
- Calls parent's `onAddToCart` handler

### vite.config.shopify.js
**Purpose**: Build configuration for Shopify compatibility
**Critical Settings**:
```javascript
build: {
  lib: {
    entry: 'src/shopify-entry.jsx',
    name: 'MapGlassConfigurator',
    formats: ['umd']
  },
  outDir: 'dist-shopify',
  cssCodeSplit: false  // Bundle all CSS
}
```

**Expected Output**:
- `dist-shopify/map-glass-configurator.js` (UMD bundle)
- `dist-shopify/map-glass-configurator.css` (All styles)

## Shopify Theme Integration Points

### Required Theme Modifications

#### 1. theme.liquid (before </body>)
```liquid
{% include 'map-configurator-scripts' %}
```

#### 2. Product Template (where button needed)
```liquid
{% include 'map-configurator-button', product: product %}
```

#### 3. settings_schema.json (add section)
```json
{
  "name": "Map Glass Configurator",
  "settings": [...]
}
```

### Theme Settings Available
- `enable_map_configurator`: Master on/off switch
- `configurator_source`: theme/external/development
- `configurator_variant_*`: Product variant IDs
- `configurator_open_cart_drawer`: Auto-open cart
- `configurator_product_tags`: Selective enabling

## Deployment Process - UPDATED STATUS

### ✅ Step 1: Build Application - COMPLETED
```bash
npm run build:shopify
# Output: dist-shopify/
# - map-glass-configurator.umd.cjs (2.4MB)
# - map-glass-configurator.css (65KB)
```
**STATUS**: Build successful, files copied to `shopify-theme/assets/`

### ✅ Step 2: Clone Theme - COMPLETED BY USER
**Theme Name**: "MAP CONFIGURATOR - TEST"
**Status**: Ready for file upload

### ⏳ Step 3: Upload Files to Test Theme - PENDING

#### Files Ready for Upload:
- `shopify-theme/assets/map-glass-configurator.js` (2.4MB)
- `shopify-theme/assets/map-glass-configurator.css` (65KB)

#### Upload Instructions:
1. Shopify Admin → Online Store → Themes
2. Find "MAP CONFIGURATOR - TEST" → Actions → Edit code
3. Navigate to **Assets** folder
4. Add new asset → Upload `map-glass-configurator.js`
5. Add new asset → Upload `map-glass-configurator.css`

### ⏳ Step 4: Create Snippets - PENDING

#### Create `map-configurator-button.liquid`:
1. Snippets folder → Add new snippet
2. Name: `map-configurator-button`
3. Copy from: `shopify-theme/snippets/map-configurator-button.liquid`

#### Create `map-configurator-scripts.liquid`:
1. Snippets folder → Add new snippet
2. Name: `map-configurator-scripts`
3. Copy from: `shopify-theme/snippets/map-configurator-scripts.liquid`

### ⏳ Step 5: Modify Theme Files - PENDING

#### theme.liquid:
Add before `</body>`:
```liquid
{% include 'map-configurator-scripts' %}
```

#### Product template:
Add where button needed:
```liquid
{% include 'map-configurator-button', product: product %}
```

#### settings_schema.json:
Add new section:
```json
{
  "name": "Map Glass Configurator",
  "settings": [
    {
      "type": "checkbox",
      "id": "enable_map_configurator",
      "label": "Enable Map Glass Configurator",
      "default": false
    },
    {
      "type": "select",
      "id": "configurator_source",
      "label": "Configurator Source",
      "options": [
        {"value": "theme", "label": "Theme Assets"}
      ],
      "default": "theme"
    }
  ]
}
```

### ⏳ Step 6: Enable & Test - PENDING
1. Theme Customizer → Find "Map Glass Configurator"
2. Enable configurator
3. Set source to "Theme Assets"
4. Save and test on product page

## Testing Strategy

### Phase 1: Static Testing ✅ COMPLETED
- [x] Build completes without errors
- [x] Bundle size: 2.4MB (optimization needed)
- [x] CSS properly namespaced (.mgc- prefix)

### Phase 2: Initial Load Testing - READY TO TEST
- [ ] Visit product page on TEST theme
- [ ] Check browser console for errors (F12)
- [ ] Verify "Customize Your Map Design" button appears
- [ ] Button styling matches theme

### Phase 3: Modal Functionality - READY TO TEST
- [ ] Click button → modal opens
- [ ] Map loads in Step 1
- [ ] Glass type selection works
- [ ] Proceed to Step 2
- [ ] Text/icons apply correctly
- [ ] 3D preview renders (rocks glass)
- [ ] Modal closes with X button
- [ ] Modal closes with Escape key

### Phase 4: Cart Integration - READY TO TEST
- [ ] Complete full design
- [ ] Click "Generate Final Design"
- [ ] Click "Add to Cart"
- [ ] Verify cart updates
- [ ] Check cart drawer (if exists)
- [ ] Verify order properties in cart
- [ ] Confirm Cloudinary upload URLs

### Phase 5: Cross-Browser Testing - AFTER PHASE 4
- [ ] Desktop: Chrome, Safari, Firefox
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Tablet: iPad Safari
- [ ] No memory leaks on modal close
- [ ] Performance acceptable on all devices

## Known Issues & Risks

### Current Risks
1. **Bundle Size**: 2.6MB unoptimized (target: <1MB with splitting)
2. **Variant IDs**: Hardcoded test IDs, MUST update for production
3. **Theme Conflicts**: Untested with actual theme styles
4. **Mobile Performance**: Three.js in modal not tested on mobile

### Mitigation Strategies
1. **Code Splitting**: Lazy load Mapbox and Three.js
2. **Environment Config**: Move variant IDs to theme settings
3. **Specific Selectors**: Use high-specificity CSS
4. **Progressive Enhancement**: Disable 3D on low-end devices

## Required User Actions

### IMMEDIATE NEEDS FROM USER
1. **Clone Theme**: Create safe testing copy
2. **Create Production Product**: Real map glass product with variants
3. **Provide Variant IDs**: Actual Shopify variant IDs
4. **Test Theme Access**: Provide theme name for testing

### Configuration Needed
```javascript
// UPDATE these with real product variant IDs
const variants = {
  'rocks': 'REAL_ROCKS_VARIANT_ID',
  'pint': 'REAL_PINT_VARIANT_ID',
  'wine': 'REAL_WINE_VARIANT_ID',
  'shot': 'REAL_SHOT_VARIANT_ID'
};
```

## Rollback Plan

### Level 1: Disable Button (5 seconds)
```liquid
{% assign enable_map_configurator = false %}
```

### Level 2: Remove Integration (30 seconds)
1. Delete script inclusion from theme.liquid
2. Delete button inclusion from product template

### Level 3: Revert Theme (1 minute)
1. Publish original theme
2. Delete test theme

### Level 4: Complete Removal (5 minutes)
1. Delete all added files from Assets
2. Delete all added snippets
3. Remove settings from schema

## Next Steps for Claude Agent

### If Build Not Run Yet:
```bash
# Test build process
npm run build:shopify

# Check output
ls -la dist-shopify/

# Verify bundle created
cat dist-shopify/map-glass-configurator.js | head -20
```

### If Theme Not Cloned Yet:
```
WAIT for user to:
1. Clone their live theme
2. Provide cloned theme name
3. Confirm safe to proceed
```

### If Ready to Deploy:
```bash
# Run deployment script
./shopify-theme/deploy.sh

# Follow manual upload instructions
# OR use Shopify CLI if available
```

### If Testing Phase:
```javascript
// Test in browser console
MapGlassConfigurator.init({
  product: { id: 'test', handle: 'test-product' },
  onAddToCart: (item) => console.log('Added:', item)
}).open();
```

## Code Quality Checklist

### Before Production:
- [ ] Remove console.log statements
- [ ] Add error boundaries
- [ ] Implement retry logic for uploads
- [ ] Add loading states
- [ ] Test memory cleanup
- [ ] Optimize bundle size
- [ ] Add polyfills if needed
- [ ] Update variant IDs
- [ ] Test with real products
- [ ] Verify CORS headers

## File Size Optimization Targets

### Current (Unoptimized):
- Main bundle: ~2.6MB

### Target (With Splitting):
- Initial load: <400KB
- Mapbox chunk: ~800KB (lazy)
- Three.js chunk: ~600KB (lazy)
- React/core: ~400KB

### Optimization Techniques:
1. Dynamic imports for heavy deps
2. CDN for Mapbox CSS
3. Terser minification
4. Tree shaking
5. Webp for images

## Environment Variables for Production

```bash
# .env.production (already configured)
VITE_SHOPIFY_DOMAIN=lumengrave.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=3d4fa6fda4ad0a34d647ca191fd33095
VITE_CLOUDINARY_CLOUD_NAME=dq69mrv68
VITE_CLOUDINARY_UPLOAD_PRESET=lumengrave_maps
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibHVtZW5ncmF2ZSIsImEiOiJjbGx6ZG83a2sxaHhjM2xwNGVwYWowY3JzIn0.-3meyG5AjY3rfC86-C-hdQ
```

## Critical Success Factors

1. **Zero Impact on Live Store**: Test everything on cloned theme
2. **Maintain Existing Flow**: Subdomain version remains available
3. **Cart Integration Works**: Orders flow to Shopify admin
4. **Performance Acceptable**: <3 second load time
5. **Mobile Functional**: Works on iOS/Android
6. **Easy Rollback**: Can disable in seconds

---

**AGENT NOTE**: This implementation is PARTIALLY COMPLETE. Core files exist but have NOT been built or tested. User must clone theme before ANY testing. DO NOT modify live theme directly. Current priority is testing build process and getting user to create safe testing environment.