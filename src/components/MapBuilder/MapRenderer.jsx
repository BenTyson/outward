import { useEffect, useState, useCallback } from 'react';
import { getMapboxStaticUrl, validateMapboxToken } from '../../utils/mapbox';
import { calculateDimensions } from '../../utils/canvas';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './MapRenderer.css';

const MapRenderer = () => {
  const { location, glassType, setMapImage, setLoading, setError } = useMapConfig();
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  
  const generateMapImage = useCallback(async () => {
    if (!validateMapboxToken()) {
      setError('Mapbox token not configured');
      return;
    }
    
    setImageLoading(true);
    setLoading(true);
    
    try {
      const { aspectRatio } = calculateDimensions(glassType);
      const width = 1280;
      const height = Math.round(width / aspectRatio);
      
      const url = getMapboxStaticUrl({
        lng: location.lng,
        lat: location.lat,
        zoom: location.zoom,
        width: Math.min(width, 1280),
        height: Math.min(height, 1280)
      });
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
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
  
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      generateMapImage();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [location.lng, location.lat, location.zoom, glassType]);
  
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
        Refresh Map
      </button>
    </div>
  );
};

export default MapRenderer;