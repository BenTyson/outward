/**
 * Shopify Files API Upload Service
 * Handles uploading images to Shopify's Files API using the staged upload process
 */

export class ShopifyFileUploader {
  constructor(shopifyDomain, accessToken) {
    this.domain = shopifyDomain;
    this.token = accessToken;
    this.apiUrl = `https://${shopifyDomain}/admin/api/2024-04/graphql.json`;
  }

  /**
   * Upload an image data URL to Shopify Files API
   * @param {string} imageDataUrl - Base64 data URL of the image
   * @param {string} filename - Desired filename for the upload
   * @returns {Promise<string>} - Shopify CDN URL of the uploaded file
   */
  async uploadImage(imageDataUrl, filename) {
    try {
      console.log(`Starting upload of ${filename}...`);
      
      // 1. Convert data URL to blob
      const blob = this.dataURLToBlob(imageDataUrl);
      console.log(`Converted to blob: ${blob.size} bytes`);
      
      // 2. Create staged upload target
      const stagedUpload = await this.createStagedUpload(filename);
      console.log('Created staged upload target');
      
      // 3. Upload to staged target (AWS/Google Cloud)
      await this.uploadToStaged(blob, stagedUpload);
      console.log('Uploaded to staged target');
      
      // 4. Create file record in Shopify
      const file = await this.createShopifyFile(stagedUpload);
      console.log(`File created in Shopify: ${file.url}`);
      
      return file.url; // Return Shopify CDN URL
      
    } catch (error) {
      console.error(`Upload failed for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Convert data URL to Blob object
   * @param {string} dataURL - Base64 data URL
   * @returns {Blob} - Blob object for upload
   */
  dataURLToBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  }

  /**
   * Create a staged upload target using Shopify's GraphQL API
   * @param {string} filename - The filename for the upload
   * @returns {Promise<Object>} - Staged upload target information
   */
  async createStagedUpload(filename) {
    const mutation = `
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets {
            resourceUrl
            url
            parameters {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const variables = {
      input: [{
        filename: filename,
        mimeType: filename.endsWith('.png') ? 'image/png' : 'image/jpeg',
        httpMethod: 'POST'
      }]
    };
    
    const response = await this.graphqlRequest(mutation, variables);
    
    if (response.data.stagedUploadsCreate.userErrors.length > 0) {
      throw new Error(`Staged upload error: ${response.data.stagedUploadsCreate.userErrors[0].message}`);
    }
    
    return response.data.stagedUploadsCreate.stagedTargets[0];
  }

  /**
   * Upload blob to the staged target (external cloud storage)
   * @param {Blob} blob - File blob to upload
   * @param {Object} stagedTarget - Staged upload target from Shopify
   */
  async uploadToStaged(blob, stagedTarget) {
    const formData = new FormData();
    
    // Add parameters from Shopify in the correct order
    stagedTarget.parameters.forEach(param => {
      formData.append(param.name, param.value);
    });
    
    // Add file last (this order is important)
    formData.append('file', blob);
    
    const response = await fetch(stagedTarget.url, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Staged upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  /**
   * Create file record in Shopify after staged upload
   * @param {Object} stagedTarget - Staged upload target information
   * @returns {Promise<Object>} - Created file information
   */
  async createShopifyFile(stagedTarget) {
    const mutation = `
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) {
          files {
            id
            ... on MediaImage {
              originalSource {
                url
              }
            }
            fileStatus
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const variables = {
      files: [{
        originalSource: stagedTarget.resourceUrl,
        contentType: 'IMAGE'
      }]
    };
    
    const response = await this.graphqlRequest(mutation, variables);
    
    if (response.data.fileCreate.userErrors.length > 0) {
      throw new Error(`File creation error: ${response.data.fileCreate.userErrors[0].message}`);
    }
    
    const file = response.data.fileCreate.files[0];
    
    // Wait for processing if needed
    if (file.fileStatus === 'PROCESSING') {
      await this.waitForFileProcessing(file.id);
    }
    
    return {
      id: file.id,
      url: file.originalSource.url,
      status: file.fileStatus
    };
  }

  /**
   * Wait for file processing to complete
   * @param {string} fileId - Shopify file ID
   * @param {number} maxWaitTime - Maximum wait time in milliseconds
   */
  async waitForFileProcessing(fileId, maxWaitTime = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const query = `
        query getFile($id: ID!) {
          file: node(id: $id) {
            ... on MediaImage {
              fileStatus
              originalSource {
                url
              }
            }
          }
        }
      `;
      
      const variables = { id: fileId };
      const response = await this.graphqlRequest(query, variables);
      
      if (response.data.file.fileStatus === 'READY') {
        return response.data.file;
      }
      
      if (response.data.file.fileStatus === 'FAILED') {
        throw new Error('File processing failed');
      }
      
      // Wait 1 second before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('File processing timeout');
  }

  /**
   * Make a GraphQL request to Shopify Admin API
   * @param {string} query - GraphQL query or mutation
   * @param {Object} variables - Query variables
   * @returns {Promise<Object>} - GraphQL response
   */
  async graphqlRequest(query, variables = {}) {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.token
      },
      body: JSON.stringify({
        query,
        variables
      })
    });
    
    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
    }
    
    return result;
  }

  /**
   * Upload multiple images in parallel with retry logic
   * @param {Object} images - Object with image type as key and data URL as value
   * @param {string} glassType - Glass type for filename
   * @param {number} timestamp - Timestamp for unique filenames
   * @returns {Promise<Object>} - Object with image type as key and CDN URL as value
   */
  async uploadMultipleImages(images, glassType, timestamp) {
    const uploadPromises = Object.entries(images).map(async ([type, dataUrl]) => {
      const extension = type === 'highres' ? 'png' : 'jpg';
      const filename = `map-${glassType}-${timestamp}-${type}.${extension}`;
      
      // Retry logic
      let lastError;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const url = await this.uploadImage(dataUrl, filename);
          return [type, url];
        } catch (error) {
          lastError = error;
          console.warn(`Upload attempt ${attempt} failed for ${filename}:`, error.message);
          
          if (attempt < 3) {
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
          }
        }
      }
      
      throw new Error(`Failed to upload ${filename} after 3 attempts: ${lastError.message}`);
    });
    
    try {
      const results = await Promise.all(uploadPromises);
      return Object.fromEntries(results);
    } catch (error) {
      console.error('Batch upload failed:', error);
      throw error;
    }
  }
}

/**
 * Create a ShopifyFileUploader instance with environment detection
 * @returns {Promise<ShopifyFileUploader>} - Configured uploader instance
 */
export async function createShopifyUploader() {
  // Get configuration from the global config object set by Liquid template
  let shopifyDomain, adminToken;
  
  if (typeof window !== 'undefined' && window.Shopify) {
    shopifyDomain = window.Shopify.shop;
    
    // Get admin token from configuration object set by Liquid template
    if (window.MapGlassConfiguratorConfig) {
      adminToken = window.MapGlassConfiguratorConfig.adminApiToken;
      console.log('[TOKEN-ACCESS] Config found. Token details:', {
        hasToken: !!adminToken,
        tokenType: typeof adminToken,
        tokenLength: adminToken ? adminToken.length : 0,
        tokenStart: adminToken ? adminToken.substring(0, 10) + '...' : 'null'
      });
      
      if (!adminToken || adminToken === '' || adminToken === 'null') {
        console.error('[TOKEN-ACCESS] ❌ Admin token is empty or null');
        throw new Error('Admin API token not configured. Please add the token to theme settings under "Map Glass Configurator" → "Admin API Token".');
      }
      
      console.log('[TOKEN-ACCESS] ✅ Found valid admin token in config');
    } else {
      console.error('[TOKEN-ACCESS] ❌ MapGlassConfiguratorConfig missing');
      console.log('[TOKEN-ACCESS] Available config:', window.MapGlassConfiguratorConfig);
      console.log('[TOKEN-ACCESS] Available globals:', Object.keys(window).filter(k => k.includes('Config') || k.includes('Setting')));
      throw new Error('Admin API token not configured. Please add the token to theme settings under "Map Glass Configurator" → "Admin API Token".');
    }
  } else {
    throw new Error('Shopify environment not detected');
  }
  
  if (!shopifyDomain || !adminToken) {
    throw new Error('Missing required Shopify configuration');
  }
  
  console.log('[TOKEN-ACCESS] ✅ Creating uploader for domain:', shopifyDomain);
  return new ShopifyFileUploader(shopifyDomain, adminToken);
}

export default ShopifyFileUploader;