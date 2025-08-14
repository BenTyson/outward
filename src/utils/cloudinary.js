class CloudinaryService {
  constructor() {
    this.cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    this.uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    this.initialized = this.cloudName && 
                       this.cloudName !== 'YOUR_CLOUD_NAME' &&
                       this.uploadPreset && 
                       this.uploadPreset !== 'YOUR_UPLOAD_PRESET';
    
    if (!this.initialized) {
      console.warn('Cloudinary not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
    }
  }

  isConfigured() {
    return this.initialized;
  }

  async uploadImage(imageDataUrl, options = {}) {
    if (!this.initialized) {
      console.warn('Cloudinary not configured, returning original data URL');
      return imageDataUrl;
    }

    try {
      const formData = new FormData();
      
      // Convert data URL to blob if needed
      let file = imageDataUrl;
      if (imageDataUrl.startsWith('data:')) {
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        file = blob;
      }
      
      formData.append('file', file);
      formData.append('upload_preset', this.uploadPreset);
      
      // Add metadata
      const context = [];
      if (options.orderId) context.push(`order_id=${options.orderId}`);
      if (options.type) context.push(`type=${options.type}`);
      if (context.length > 0) {
        formData.append('context', context.join('|'));
      }
      
      // Add tags
      const tags = ['map-glass', 'customer-design'];
      if (options.glassType) tags.push(options.glassType);
      formData.append('tags', tags.join(','));
      
      // Add folder structure
      if (options.folder) {
        formData.append('folder', options.folder);
      }
      
      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.secure_url;
      
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      // Return original URL as fallback
      return imageDataUrl;
    }
  }

  async uploadDesignFiles(configuration, images) {
    const timestamp = Date.now();
    const orderId = `${configuration.glassType}-${timestamp}`;
    
    const uploads = {};
    
    // Upload 3D model preview if available (for Shopify thumbnail)
    if (images.modelPreview) {
      try {
        uploads.modelPreviewUrl = await this.uploadImage(images.modelPreview, {
          type: 'model',
          orderId: orderId,
          glassType: configuration.glassType,
          folder: 'map-glass/models'
        });
        console.log('3D Model preview uploaded:', uploads.modelPreviewUrl);
      } catch (error) {
        console.error('3D Model preview upload failed:', error);
        uploads.modelPreviewUrl = images.modelPreview; // Fallback to data URL
      }
    }
    
    // Upload preview image if available
    if (images.preview) {
      try {
        uploads.previewUrl = await this.uploadImage(images.preview, {
          type: 'preview',
          orderId: orderId,
          glassType: configuration.glassType,
          folder: 'map-glass/previews'
        });
        console.log('Preview uploaded:', uploads.previewUrl);
      } catch (error) {
        console.error('Preview upload failed:', error);
        uploads.previewUrl = images.preview; // Fallback to data URL
      }
    }
    
    // Upload high-resolution laser file if available
    if (images.highRes) {
      try {
        uploads.laserFileUrl = await this.uploadImage(images.highRes, {
          type: 'laser',
          orderId: orderId,
          glassType: configuration.glassType,
          folder: 'map-glass/laser-files'
        });
        console.log('Laser file uploaded:', uploads.laserFileUrl);
      } catch (error) {
        console.error('Laser file upload failed:', error);
        uploads.laserFileUrl = images.highRes; // Fallback to data URL
      }
    }
    
    return uploads;
  }

  // Generate a watermarked preview URL (using Cloudinary transformations)
  getWatermarkedUrl(url) {
    if (!this.initialized || !url.includes('cloudinary.com')) {
      return url;
    }
    
    // Add watermark transformation
    // This adds a semi-transparent overlay text
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const transformation = 'l_text:Arial_60:PREVIEW,co_rgb:ffffff,o_30,g_center/';
      return parts[0] + '/upload/' + transformation + parts[1];
    }
    
    return url;
  }

  // Generate a time-limited URL for laser files
  getTimeLimitedUrl(url, expirationHours = 24) {
    // For now, Cloudinary URLs don't expire by default
    // In production, you might want to use signed URLs
    return url;
  }
}

// Export as singleton
export default new CloudinaryService();