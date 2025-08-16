# Backend Architecture Solution for Shopify File Uploads

## Problem Statement
The current implementation attempts to call Shopify Admin API directly from the browser, which fails due to CORS restrictions:
```
Access to fetch at 'https://lumengrave.myshopify.com/admin/api/2024-04/graphql.json' 
from origin 'https://lumengrave.com' has been blocked by CORS policy
```

## Stable Solution: Shopify App Proxy Architecture

### Overview
Instead of direct Admin API calls from browser, implement a secure backend proxy using Shopify App Proxy feature.

### Architecture Flow
```
1. Frontend (Browser) 
   ↓ POST /apps/map-upload/* 
2. Shopify App Proxy (lumengrave.com domain)
   ↓ Routes to your backend
3. Your Backend Server 
   ↓ Authenticated Admin API calls
4. Shopify Admin API
   ↓ File storage & URLs
5. Response back to frontend
```

## Implementation Steps

### Step 1: Create Shopify App with App Proxy
**Required in Shopify Partner Dashboard:**
```
App Name: Map Glass File Upload Proxy
App Proxy URL: https://your-backend.com/shopify/proxy
App Proxy Subpath: apps/map-upload
```

This creates endpoints like:
`https://lumengrave.com/apps/map-upload/upload-files`

### Step 2: Backend Server Implementation
**Technology Options:**
- Node.js/Express with Shopify API SDK
- Vercel Functions (serverless)
- Railway/Render deployment

**Key Backend Endpoints:**
```javascript
// POST /shopify/proxy/upload-files
// Receives: { images: { preview, highres, model3d, thumbnail }, glassType, timestamp }
// Returns: { urls: { preview, highres, model3d, thumbnail } }

const express = require('express');
const { shopifyApi } = require('@shopify/shopify-api');

app.post('/shopify/proxy/upload-files', async (req, res) => {
  try {
    // 1. Validate Shopify request signature
    const isValid = shopifyApi.auth.verifyShopifyAppProxyRequest(req);
    if (!isValid) return res.status(401).json({ error: 'Unauthorized' });
    
    // 2. Extract shop domain and images from request
    const { shop } = req.query;
    const { images, glassType, timestamp } = req.body;
    
    // 3. Use Admin API to upload files
    const uploadUrls = await uploadFilesToShopify(shop, images, glassType, timestamp);
    
    // 4. Return URLs to frontend
    res.json({ success: true, urls: uploadUrls });
    
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

async function uploadFilesToShopify(shop, images, glassType, timestamp) {
  const client = new shopifyApi.clients.Graphql({ session });
  
  const uploadUrls = {};
  
  for (const [type, dataUrl] of Object.entries(images)) {
    if (!dataUrl) continue;
    
    // Convert data URL to Buffer
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    const filename = `map-${glassType}-${timestamp}-${type}.${type === 'highres' ? 'png' : 'jpg'}`;
    
    // 1. Create staged upload
    const stagedUpload = await createStagedUpload(client, filename);
    
    // 2. Upload to staged target (AWS/GCS)
    await uploadToStaged(buffer, stagedUpload);
    
    // 3. Create Shopify file record
    const file = await createShopifyFile(client, stagedUpload);
    
    uploadUrls[type] = file.url;
  }
  
  return uploadUrls;
}
```

### Step 3: Frontend Integration Update
**Update existing `src/utils/shopifyFiles.js`:**
```javascript
export class ShopifyFileUploader {
  constructor() {
    // No longer needs admin token - uses App Proxy
    this.proxyUrl = '/apps/map-upload'; // Shopify App Proxy endpoint
  }
  
  async uploadDesignFiles(configuration, images) {
    const timestamp = Date.now();
    
    try {
      const response = await fetch(`${this.proxyUrl}/upload-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images,
          glassType: configuration.glassType,
          timestamp
        })
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.urls;
      
    } catch (error) {
      console.error('Proxy upload failed:', error);
      throw error;
    }
  }
}
```

### Step 4: Remove Admin Token Dependency
**Update theme settings** - Remove admin token requirement:
```liquid
<!-- In map-configurator-scripts.liquid -->
<script>
  window.MapGlassConfiguratorConfig = {
    // Remove adminApiToken - no longer needed
    variants: { /* ... */ },
    mapboxToken: {{ settings.mapbox_access_token | json }},
    // App Proxy handles authentication
  };
</script>
```

## Benefits of This Solution

### Security
- ✅ No Admin API tokens in frontend code
- ✅ All authentication handled on secure backend
- ✅ Shopify validates all proxy requests
- ✅ No CORS issues (same-origin requests)

### Reliability
- ✅ Proper error handling and retry logic
- ✅ Backend can implement rate limiting
- ✅ Structured logging and monitoring
- ✅ Separation of concerns

### Maintainability
- ✅ Backend can be updated independently
- ✅ Easy to add new endpoints
- ✅ Testable backend logic
- ✅ Production-ready architecture

## Deployment Options

### Option 1: Vercel Functions (Recommended)
```javascript
// api/shopify/proxy/upload-files.js
export default async function handler(req, res) {
  // Implementation here
}
```

### Option 2: Express Server (Railway/Render)
```javascript
// server.js
const express = require('express');
const app = express();
// Implementation here
app.listen(process.env.PORT || 3001);
```

### Option 3: AWS Lambda
```javascript
// lambda/upload-handler.js
exports.handler = async (event, context) => {
  // Implementation here
};
```

## Migration Steps

### Phase 1: Backend Setup
1. Create Shopify App in Partner Dashboard
2. Configure App Proxy settings
3. Deploy backend server
4. Test authentication and file upload

### Phase 2: Frontend Updates
1. Update ShopifyFileUploader to use proxy
2. Remove admin token configuration
3. Test upload flow end-to-end
4. Deploy to Shopify theme

### Phase 3: Cleanup
1. Remove unused admin token settings
2. Update documentation
3. Monitor production usage
4. Optimize performance

## Error Handling Strategy

### Backend Validation
```javascript
// Validate file size
if (buffer.length > 20 * 1024 * 1024) { // 20MB limit
  throw new Error('File too large');
}

// Validate file type
if (!['image/jpeg', 'image/png'].includes(mimeType)) {
  throw new Error('Invalid file type');
}

// Rate limiting
if (uploadCount > RATE_LIMIT) {
  throw new Error('Rate limit exceeded');
}
```

### Frontend Fallbacks
```javascript
try {
  const urls = await uploader.uploadDesignFiles(config, images);
  // Success path
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Show retry after delay
  } else if (error.message.includes('File too large')) {
    // Compress images and retry
  } else {
    // Show general error with support contact
  }
}
```

## Production Considerations

### Monitoring
- Track upload success/failure rates
- Monitor file sizes and types
- Log authentication failures
- Set up alerts for errors

### Performance
- Implement file compression on backend
- Add progress indicators for large uploads
- Consider CDN for faster file delivery
- Optimize image processing pipeline

### Scaling
- Use queues for large file processing
- Implement horizontal scaling
- Add caching for frequently accessed files
- Consider edge computing for global users

## Cost Analysis

### Backend Hosting
- Vercel Functions: ~$20/month for moderate usage
- Railway/Render: ~$5-15/month for small app
- AWS Lambda: Pay per request (~$0.01/1000 requests)

### File Storage
- Uses Shopify's included file storage
- No additional storage costs
- CDN delivery included

### Development Time
- Initial setup: 2-3 days
- Testing and refinement: 1-2 days
- Total: ~1 week vs quick fixes that don't scale

## Next Steps

This architecture provides the stable, production-ready solution you requested. It eliminates the CORS issue permanently while maintaining security and scalability.

Ready to implement this backend solution?