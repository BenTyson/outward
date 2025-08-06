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
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 80 }); // Percentage positions
  const [textSize, setTextSize] = useState(50); // Font size
  const [selectedIcon, setSelectedIcon] = useState('');
  const [iconPosition, setIconPosition] = useState({ x: 80, y: 20 }); // Percentage positions
  const [iconSize, setIconSize] = useState(50); // Icon size
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);

  // Icon mapping
  const iconMap = useCallback(() => ({
    home: '🏠',
    heart: '❤️',
    star: '⭐',
    pin: '📍',
    compass: '🧭'
  }), []);

  // Position calculation helper - converts percentage to pixels
  const getPixelPosition = useCallback((percentagePos, canvasWidth, canvasHeight) => {
    return {
      x: (percentagePos.x / 100) * canvasWidth,
      y: (percentagePos.y / 100) * canvasHeight
    };
  }, []);

  // Convert mouse position to percentage
  const getPercentagePosition = useCallback((clientX, clientY, element) => {
    const rect = element.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(5, Math.min(95, x)), // Keep within 5-95% bounds
      y: Math.max(5, Math.min(95, y))
    };
  }, []);
  
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
      
      // Add text overlay if provided
      if (overlayText.trim()) {
        const fontSize = (textSize / 100) * Math.min(width, height) * 0.15; // Scale based on size slider
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = fontSize * 0.05;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textCoords = getPixelPosition(textPosition, width, height);
        ctx.strokeText(overlayText, textCoords.x, textCoords.y);
        ctx.fillText(overlayText, textCoords.x, textCoords.y);
      }
      
      // Add icon overlay if selected
      const icons = iconMap();
      if (selectedIcon && icons[selectedIcon]) {
        const iconFontSize = (iconSize / 100) * Math.min(width, height) * 0.2; // Scale based on size slider
        ctx.font = `${iconFontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const iconCoords = getPixelPosition(iconPosition, width, height);
        
        // Add white outline for icon
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = iconFontSize * 0.1;
        ctx.strokeText(icons[selectedIcon], iconCoords.x, iconCoords.y);
        
        // Fill the icon
        ctx.fillStyle = '#ffffff';
        ctx.fillText(icons[selectedIcon], iconCoords.x, iconCoords.y);
      }
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('Map preview generated successfully with overlays');
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
  }, [location, glassType, overlayText, textPosition, textSize, selectedIcon, iconPosition, iconSize, setMapImage, setLoading, setError, getPixelPosition, iconMap]);

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
  }, [location.lng, location.lat, location.zoom, glassType, overlayText, textPosition, textSize, selectedIcon, iconPosition, iconSize, generateMapImage]);
  
  return (
    <div className="map-renderer">
      <div 
        className="map-preview-container"
        onMouseMove={(e) => {
          if (isDraggingText) {
            const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget);
            setTextPosition(newPos);
          }
          if (isDraggingIcon) {
            const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget);
            setIconPosition(newPos);
          }
        }}
        onMouseUp={() => {
          setIsDraggingText(false);
          setIsDraggingIcon(false);
        }}
        onMouseLeave={() => {
          setIsDraggingText(false);
          setIsDraggingIcon(false);
        }}
      >
        {imageLoading && (
          <div className="map-loading">
            <div className="loading-spinner" />
            <span>Generating map...</span>
          </div>
        )}
        {localImageUrl && !imageLoading && (
          <>
            <img 
              src={localImageUrl} 
              alt="Map preview"
              className="map-preview-image"
              draggable={false}
            />
            
            {/* Draggable text overlay */}
            {overlayText.trim() && (
              <div
                className={`draggable-text ${isDraggingText ? 'dragging' : ''}`}
                style={{
                  left: `${textPosition.x}%`,
                  top: `${textPosition.y}%`,
                  fontSize: `${textSize}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingText(true);
                }}
              >
                {overlayText}
              </div>
            )}
            
            {/* Draggable icon overlay */}
            {selectedIcon && iconMap()[selectedIcon] && (
              <div
                className={`draggable-icon ${isDraggingIcon ? 'dragging' : ''}`}
                style={{
                  left: `${iconPosition.x}%`,
                  top: `${iconPosition.y}%`,
                  fontSize: `${iconSize}px`,
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingIcon(true);
                }}
              >
                {iconMap()[selectedIcon]}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="preview-controls">
        <button 
          onClick={generateMapImage}
          className="refresh-map-btn"
          disabled={imageLoading}
        >
          {imageLoading ? 'Generating...' : 'Refresh Preview'}
        </button>
      </div>

      <div className="overlay-controls">
        <h3>Add Text & Icons (Optional)</h3>
        
        <div className="text-controls">
          <label htmlFor="overlay-text">Custom Text:</label>
          <input
            id="overlay-text"
            type="text"
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
            placeholder="Enter text to overlay on map..."
            className="text-input"
          />
          <div className="size-control">
            <label>Text Size: {textSize}px</label>
            <input
              type="range"
              min="20"
              max="100"
              value={textSize}
              onChange={(e) => setTextSize(parseInt(e.target.value))}
              className="size-slider"
            />
          </div>
        </div>

        <div className="icon-controls">
          <label>Add Icon:</label>
          <select 
            className="icon-select"
            value={selectedIcon}
            onChange={(e) => setSelectedIcon(e.target.value)}
          >
            <option value="">No Icon</option>
            <option value="home">🏠 Home</option>
            <option value="heart">❤️ Heart</option>
            <option value="star">⭐ Star</option>
            <option value="pin">📍 Pin</option>
            <option value="compass">🧭 Compass</option>
          </select>
          <div className="size-control">
            <label>Icon Size: {iconSize}px</label>
            <input
              type="range"
              min="20"
              max="100"
              value={iconSize}
              onChange={(e) => setIconSize(parseInt(e.target.value))}
              className="size-slider"
            />
          </div>
        </div>

        <div className="drag-instruction">
          <p>💡 <strong>Tip:</strong> Drag the text and icons directly on the preview to position them exactly where you want!</p>
        </div>
      </div>
      
      <div className="preview-note">
        <p>This preview shows the exact static image that will be used for laser engraving. Auto-updates when you stop moving the map above.</p>
      </div>
    </div>
  );
};

export default MapRenderer;