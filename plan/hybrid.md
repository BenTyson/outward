# Shopify Integration - Current Status & Next Steps

## CRITICAL CONTEXT FOR CLAUDE AGENTS

**Project**: LumenGrave Map Glass Configurator Shopify Integration  
**Status**: Modal UI complete, file upload blocked by CORS issue  
**Next Priority**: Implement Shopify App Proxy backend solution  

### ⚠️ ISOLATION REQUIREMENT
**TWO SEPARATE IMPLEMENTATIONS:**
1. **Root App** (`/src/App.jsx`, `/src/components/Steps/`): Subdomain approach - DO NOT MODIFY
2. **Modal App** (`/src/components/Shopify/`): Theme integration - SAFE TO MODIFY

## Current Production Status

### ✅ WORKING (MAP BUILDER Theme #142629077080)
- **Modal System**: Glass-type-specific modals with clean minimal UI
- **Map Generation**: High-resolution rendering with Mapbox API
- **3D Rendering**: Rock glass models with Three.js
- **Image Capture**: 4-variant generation (preview, highres, model3d, thumbnail)
- **Product Detection**: Button appears only on `custom-*` tagged products
- **UI/UX**: Stroke controls, clean styling, full-width map interface

### ❌ BLOCKED BY CORS ISSUE
- **File Upload**: Direct Admin API calls fail due to browser security
- **Cart Integration**: Dependent on successful file uploads
- **Complete Checkout Flow**: Order processing blocked

**Error**: `Access to fetch at 'https://lumengrave.myshopify.com/admin/api/2024-04/graphql.json' from origin 'https://lumengrave.com' has been blocked by CORS policy`

## Architecture Solution Required

### Problem
```
Browser → Direct Admin API Call → CORS Block → Upload Failure
```

### Solution (App Proxy)
```
Browser → App Proxy (/apps/map-upload/*) → Backend Server → Admin API → Success
```

**Complete solution documented in**: `/plan/proxy.md`

## Current File Status

### ✅ Functional Components
```
src/components/Shopify/
├── ShopifyModal.jsx              ✅ Modal wrapper
├── ShopifyStep1.jsx              ✅ Location selection  
├── ShopifyStep2.jsx              ✅ Design interface
├── ShopifyMapRenderer.jsx        ✅ Map + text rendering
├── ShopifyTextIconControls.jsx   ✅ Text/icon controls
└── CylinderMapTest.jsx           ✅ 3D glass rendering
```

### ❌ Requires Proxy Update
```
src/utils/shopifyFiles.js         ❌ Direct Admin API calls (CORS blocked)
src/components/Shopify/ShopifyModal.jsx  ❌ Upload orchestration (CORS blocked)
```

### ✅ Ready for Production
```
shopify-themes/assets/admin-custom-orders.js  ✅ Admin order enhancements
shopify-themes/snippets/map-configurator-*    ✅ Theme integration
```

## Authentication Setup

### Current Working Configuration
- **Theme**: MAP BUILDER (#142629077080)
- **Store**: lumengrave.myshopify.com
- **Token**: Available in your environment variables or team documentation
- **Scopes**: `read_files`, `write_files`, `read_products`, `write_products`, `read_themes`, `write_themes`

### Deployment Commands
```bash
# Set environment variable (get token from secure storage)
export SHOPIFY_CLI_THEME_TOKEN=your_shopify_token_here

# Deploy from correct directory
cd /Users/bentyson/outward/shopify-themes
shopify theme push --theme=142629077080
```

**⚠️ NEVER use `shopify auth login` - it breaks everything**

## Next Steps (Priority Order)

### 1. Implement App Proxy Backend
- Create Shopify App in Partner Dashboard
- Configure App Proxy: `apps/map-upload` → backend server
- Deploy backend (Vercel Functions recommended)
- Test authentication and file upload flow

### 2. Update Frontend Upload System
- Modify `src/utils/shopifyFiles.js` to use proxy endpoints
- Update `ShopifyModal.jsx` upload orchestration
- Remove admin token dependency from theme settings
- Test end-to-end upload flow

### 3. Deploy Complete Solution
- Build and deploy updated frontend
- Test complete checkout flow
- Verify admin order enhancements
- Monitor production usage

## File Modification Rules

### ✅ SAFE TO MODIFY (Modal Work)
- `/src/components/Shopify/*` - All Shopify modal components
- `/src/shopify-entry.jsx` - Shopify integration entry point
- `/src/utils/shopifyFiles.js` - Upload service (needs proxy update)
- Theme files in `/shopify-themes/`

### ❌ DO NOT MODIFY (Root App Protection)
- `/src/App.jsx` - Main application
- `/src/components/Steps/*` - Core workflow components
- `/src/components/MapBuilder/*` - Map functionality
- `/src/contexts/MapConfigContext.jsx` - State management

## Testing URLs

- **Theme Preview**: https://lumengrave.myshopify.com?preview_theme_id=142629077080
- **Admin**: https://lumengrave.myshopify.com/admin/themes/142629077080/editor
- **Product Test**: Any product with `custom-rocks` tag

## Debugging Notes

### Current Upload Flow
1. User completes design → `finishEnabled` becomes true
2. Click "Finish" → `handleFinish()` in ShopifyModal.jsx
3. Calls `createShopifyUploader()` → Gets admin token from theme config
4. Attempts direct Admin API call → **CORS BLOCKED**

### Expected Flow (After Proxy)
1. User completes design → `finishEnabled` becomes true  
2. Click "Finish" → `handleFinish()` in ShopifyModal.jsx
3. Calls App Proxy endpoint (`/apps/map-upload/upload-files`)
4. Backend handles Admin API → Returns CDN URLs
5. Frontend updates product image and adds to cart

## Key Dependencies

- **Mapbox Token**: Required for map rendering
- **Cloudinary**: Optional fallback (configured but not currently used)
- **Three.js**: Required for 3D glass rendering
- **Shopify Admin API**: Required for file uploads (via proxy)

---

**For detailed backend implementation**: See `/plan/proxy.md`  
**For complete project context**: See `/plan/project_overview.md`