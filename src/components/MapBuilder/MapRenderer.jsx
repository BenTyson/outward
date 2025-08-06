import { useEffect, useState, useCallback } from 'react';
import { getMapboxStaticUrl, validateMapboxToken } from '../../utils/mapbox';
import { calculateDimensions } from '../../utils/canvas';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './MapRenderer.css';

const MapRenderer = () => {
  const { location, glassType, setMapImage, setLoading, setError } = useMapConfig();
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [hasInitiallyGenerated, setHasInitiallyGenerated] = useState(false);
  
  const generateMapImage = useCallback(async () => {
    console.log('generateMapImage called with location:', {
      lat: location.lat,
      lng: location.lng,
      zoom: location.zoom,
      glassType
    });
    
    if (!validateMapboxToken()) {
      console.log('Mapbox token validation failed');
      setError('Mapbox token not configured');
      return;
    }
    
    // Check if location data is available
    const lng = location.lng || -104.9903; // Default to Denver
    const lat = location.lat || 39.7392;   // Default to Denver
    const zoom = location.zoom || 12;      // Default zoom
    
    if (!lng || !lat || !zoom) {
      console.log('Location data missing:', { lng, lat, zoom });
      setError('Location data not available');
      return;
    }
    
    console.log('Starting image generation with coordinates:', { lat, lng, zoom, glassType });
    setImageLoading(true);
    setLoading(true);
    
    try {
      const { aspectRatio } = calculateDimensions(glassType);
      const width = 1280;
      const height = Math.round(width / aspectRatio);
      
      const url = getMapboxStaticUrl({
        lng,
        lat,
        zoom,
        width: Math.min(width, 1280),
        height: Math.min(height, 1280)
      });
      
      console.log('Generated static map URL:', url);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('Static map image loaded successfully');
          resolve();
        };
        img.onerror = (e) => {
          console.error('Static map image failed to load:', e);
          reject(e);
        };
        img.src = url;
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
        offsetY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('Map preview generated successfully');
      setLocalImageUrl(dataUrl);
      setMapImage(dataUrl);
      setError(null);
    } catch (err) {
      console.error('Failed to generate map image:', err);
      setError('Failed to load map image. Please try again.');
    } finally {
      setImageLoading(false);
      setLoading(false);
    }
  }, [location, glassType, setMapImage, setLoading, setError]);

  // Initial generation when component mounts
  useEffect(() => {
    if (!hasInitiallyGenerated && location.lat && location.lng && location.zoom) {
      console.log('Initial map image generation on mount');
      generateMapImage();
      setHasInitiallyGenerated(true);
    }
  }, [location.lat, location.lng, location.zoom, hasInitiallyGenerated, generateMapImage]);
  
  useEffect(() => {
    console.log('MapRenderer detected location change:', {
      lat: location.lat,
      lng: location.lng, 
      zoom: location.zoom,
      glassType,
      fullLocation: location
    });
    
    // Only trigger auto-generation if we have valid location data
    if (location.lat && location.lng && location.zoom) {
      console.log('Setting timer for auto-generation with valid location data');
      // Auto-generate map image after user stops moving the map
      const debounceTimer = setTimeout(() => {
        console.log('Auto-generating static preview after map movement stopped...');
        generateMapImage();
      }, 2000); // 2 second delay after movement stops
      
      return () => {
        console.log('Clearing auto-generate timer');
        clearTimeout(debounceTimer);
      };
    } else {
      console.log('Skipping auto-generation - invalid location data, full location object:', location);
    }
  }, [location.lng, location.lat, location.zoom, glassType, generateMapImage]);
  
  return (
    <div className="map-renderer">
      <div className="map-preview-container">
        {imageLoading && (
          <div className="map-loading">
            <div className="loading-spinner" />
            <span>Generating map...</span>
          </div>
        )}
        {localImageUrl && !imageLoading && (
          <img 
            src={localImageUrl} 
            alt="Map preview"
            className="map-preview-image"
          />
        )}
      </div>
      
      <button 
        onClick={generateMapImage}
        className="refresh-map-btn"
        disabled={imageLoading}
      >
        {imageLoading ? 'Generating...' : 'Refresh Preview'}
      </button>
      
      <div className="preview-note">
        <p>This preview shows the exact static image that will be used for laser engraving. Auto-updates when you stop moving the map above.</p>
      </div>
    </div>
  );
};

export default MapRenderer;