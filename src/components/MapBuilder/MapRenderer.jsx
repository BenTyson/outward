import { useEffect, useState, useCallback, useRef } from 'react';
import { getMapboxStaticUrl, validateMapboxToken } from '../../utils/mapbox';
import { calculateDimensions } from '../../utils/canvas';
import { useMapConfig } from '../../contexts/MapConfigContext';
import { flatIcons, renderIcon } from '../../utils/icons';
import './MapRenderer.css';

const MapRenderer = () => {
  const { location, glassType, setMapImage, setLoading, setError } = useMapConfig();
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [hasInitiallyGenerated, setHasInitiallyGenerated] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 80 }); // Percentage positions
  const [textSize, setTextSize] = useState(50); // Font size
  const [textStrokeWidth, setTextStrokeWidth] = useState(2); // Text stroke width
  const [overlayText2, setOverlayText2] = useState('');
  const [textPosition2, setTextPosition2] = useState({ x: 50, y: 20 }); // Percentage positions
  const [textSize2, setTextSize2] = useState(40); // Font size
  const [textStrokeWidth2, setTextStrokeWidth2] = useState(2); // Text stroke width
  const [selectedIcon, setSelectedIcon] = useState('');
  const [iconPosition, setIconPosition] = useState({ x: 80, y: 20 }); // Percentage positions
  const [iconSize, setIconSize] = useState(50); // Icon size
  const [iconStrokeWidth, setIconStrokeWidth] = useState(2); // Icon stroke width
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingText2, setIsDraggingText2] = useState(false);
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const textRef = useRef(null);
  const text2Ref = useRef(null);
  const iconRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Position calculation helper - converts percentage to pixels
  const getPixelPosition = useCallback((percentagePos, canvasWidth, canvasHeight) => {
    return {
      x: (percentagePos.x / 100) * canvasWidth,
      y: (percentagePos.y / 100) * canvasHeight
    };
  }, []);

  // Convert mouse position to percentage with dynamic bounds
  const getPercentagePosition = useCallback((clientX, clientY, element, offset = { x: 0, y: 0 }, elementRef = null) => {
    const rect = element.getBoundingClientRect();
    let x = ((clientX - rect.left - offset.x) / rect.width) * 100;
    let y = ((clientY - rect.top - offset.y) / rect.height) * 100;
    
    // If we have a reference to the draggable element, calculate dynamic bounds
    if (elementRef && elementRef.getBoundingClientRect) {
      try {
        const elementRect = elementRef.getBoundingClientRect();
        const elementWidthPercent = (elementRect.width / rect.width) * 100 * 0.5; // Half width for centering
        const elementHeightPercent = (elementRect.height / rect.height) * 100 * 0.5; // Half height for centering
        
        // Adjust bounds based on element size
        const minX = elementWidthPercent + 2; // Small padding
        const maxX = 100 - elementWidthPercent - 2;
        const minY = elementHeightPercent + 2;
        const maxY = 100 - elementHeightPercent - 2;
        
        x = Math.max(minX, Math.min(maxX, x));
        y = Math.max(minY, Math.min(maxY, y));
      } catch (error) {
        console.warn('Error calculating element bounds:', error);
        // Fallback to fixed bounds on error
        x = Math.max(5, Math.min(95, x));
        y = Math.max(5, Math.min(95, y));
      }
    } else {
      // Fallback to fixed bounds
      x = Math.max(5, Math.min(95, x));
      y = Math.max(5, Math.min(95, y));
    }
    
    return { x, y };
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const elementRect = e.currentTarget.getBoundingClientRect();
    
    const offset = {
      x: e.clientX - (elementRect.left + elementRect.width / 2),
      y: e.clientY - (elementRect.top + elementRect.height / 2)
    };
    
    setDragOffset(offset);
    
    if (type === 'text') {
      setIsDraggingText(true);
    } else if (type === 'text2') {
      setIsDraggingText2(true);
    } else {
      setIsDraggingIcon(true);
    }
  }, []);

  // Handle drag move - direct updates without debouncing
  const handleDragMove = useCallback((e) => {
    if (!isDraggingText && !isDraggingText2 && !isDraggingIcon) return;
    
    e.preventDefault();
    
    if (isDraggingText) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget, dragOffset, textRef.current);
      setTextPosition(newPos);
    }
    
    if (isDraggingText2) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget, dragOffset, text2Ref.current);
      setTextPosition2(newPos);
    }
    
    if (isDraggingIcon) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget, dragOffset, iconRef.current);
      setIconPosition(newPos);
    }
  }, [isDraggingText, isDraggingText2, isDraggingIcon, dragOffset, getPercentagePosition]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDraggingText(false);
    setIsDraggingText2(false);
    setIsDraggingIcon(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);
  
  // Generate base map image WITHOUT overlays (for preview background)
  const generateBaseMapImage = useCallback(async () => {
    console.log('generateBaseMapImage called with location:', {
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
    
    console.log('Starting base image generation with coordinates:', { lat, lng, zoom, glassType });
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
      
      // DO NOT add text or icon overlays - they will be rendered as draggable elements
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      console.log('Base map preview generated successfully (no overlays)');
      setLocalImageUrl(dataUrl);
      setError(null);
    } catch (err) {
      console.error('Failed to generate base map image:', err);
      setError('Failed to load map image. Please try again.');
    } finally {
      setImageLoading(false);
      setLoading(false);
    }
  }, [location, glassType, setLoading, setError]);

  // Generate final image WITH overlays (for export/download)
  const generateFinalImage = useCallback(async () => {
    console.log('Generating final image with overlays...');
    
    if (!localImageUrl) {
      console.error('No base image available');
      return;
    }
    
    const { aspectRatio } = calculateDimensions(glassType);
    const width = 1280;
    const height = Math.round(width / aspectRatio);
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw base map
    const baseImg = new Image();
    baseImg.src = localImageUrl;
    await new Promise(resolve => {
      baseImg.onload = resolve;
    });
    ctx.drawImage(baseImg, 0, 0, width, height);
    
    // Add first text overlay if provided
    if (overlayText.trim()) {
      const fontSize = (textSize / 100) * Math.min(width, height) * 0.15;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textCoords = getPixelPosition(textPosition, width, height);
      const scaledStrokeWidth = textStrokeWidth * (fontSize / 50); // Scale stroke with font size
      
      // White outline
      ctx.fillStyle = '#ffffff';
      const offsets = [
        [-scaledStrokeWidth, -scaledStrokeWidth], [scaledStrokeWidth, -scaledStrokeWidth],
        [-scaledStrokeWidth, scaledStrokeWidth], [scaledStrokeWidth, scaledStrokeWidth],
        [-scaledStrokeWidth, 0], [scaledStrokeWidth, 0],
        [0, -scaledStrokeWidth], [0, scaledStrokeWidth]
      ];
      
      offsets.forEach(([offsetX, offsetY]) => {
        ctx.fillText(overlayText, textCoords.x + offsetX, textCoords.y + offsetY);
      });
      
      // Black text
      ctx.fillStyle = '#000000';
      ctx.fillText(overlayText, textCoords.x, textCoords.y);
    }
    
    // Add second text overlay if provided
    if (overlayText2.trim()) {
      const fontSize2 = (textSize2 / 100) * Math.min(width, height) * 0.15;
      ctx.font = `bold ${fontSize2}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textCoords2 = getPixelPosition(textPosition2, width, height);
      const scaledStrokeWidth2 = textStrokeWidth2 * (fontSize2 / 50); // Scale stroke with font size
      
      // White outline
      ctx.fillStyle = '#ffffff';
      const offsets2 = [
        [-scaledStrokeWidth2, -scaledStrokeWidth2], [scaledStrokeWidth2, -scaledStrokeWidth2],
        [-scaledStrokeWidth2, scaledStrokeWidth2], [scaledStrokeWidth2, scaledStrokeWidth2],
        [-scaledStrokeWidth2, 0], [scaledStrokeWidth2, 0],
        [0, -scaledStrokeWidth2], [0, scaledStrokeWidth2]
      ];
      
      offsets2.forEach(([offsetX, offsetY]) => {
        ctx.fillText(overlayText2, textCoords2.x + offsetX, textCoords2.y + offsetY);
      });
      
      // Black text
      ctx.fillStyle = '#000000';
      ctx.fillText(overlayText2, textCoords2.x, textCoords2.y);
    }
    
    // Add icon overlay if selected
    if (selectedIcon && flatIcons[selectedIcon]) {
      const iconScale = (iconSize / 100) * Math.min(width, height) * 0.2;
      const iconCoords = getPixelPosition(iconPosition, width, height);
      
      // Create SVG path from icon definition
      const icon = flatIcons[selectedIcon];
      const path = new Path2D(icon.path);
      
      // Save context state
      ctx.save();
      
      // Move to icon position and scale
      ctx.translate(iconCoords.x - iconScale/2, iconCoords.y - iconScale/2);
      ctx.scale(iconScale/24, iconScale/24); // SVG viewBox is 24x24
      
      // Draw white stroke
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = iconStrokeWidth * (24/iconScale) * 2; // Scale stroke to match visual size
      ctx.stroke(path);
      
      // Draw black fill
      ctx.fillStyle = '#000000';
      ctx.fill(path);
      
      // Restore context state
      ctx.restore();
    }
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setMapImage(dataUrl); // This is the final export image
    return dataUrl;
  }, [localImageUrl, glassType, overlayText, textPosition, textSize, textStrokeWidth, overlayText2, textPosition2, textSize2, textStrokeWidth2, selectedIcon, iconPosition, iconSize, iconStrokeWidth, getPixelPosition, setMapImage]);

  // Initial generation when component mounts
  useEffect(() => {
    if (!hasInitiallyGenerated && location.lat && location.lng && location.zoom) {
      console.log('Initial base map generation on mount');
      generateBaseMapImage();
      setHasInitiallyGenerated(true);
    }
  }, [location.lat, location.lng, location.zoom, hasInitiallyGenerated, generateBaseMapImage]);
  
  useEffect(() => {
    console.log('MapRenderer detected location change:', {
      lat: location.lat,
      lng: location.lng, 
      zoom: location.zoom,
      glassType,
      fullLocation: location
    });
    
    // Only trigger auto-generation if we have valid location data and not currently dragging
    if (location.lat && location.lng && location.zoom && !isDraggingText && !isDraggingText2 && !isDraggingIcon) {
      console.log('Setting timer for auto-generation with valid location data');
      // Auto-generate base map image after user stops moving the map
      const debounceTimer = setTimeout(() => {
        console.log('Auto-generating base map preview after map movement stopped...');
        generateBaseMapImage();
      }, 2000); // 2 second delay after movement stops
      
      return () => {
        console.log('Clearing auto-generate timer');
        clearTimeout(debounceTimer);
      };
    } else {
      console.log('Skipping auto-generation - invalid location data or currently dragging');
    }
  }, [location.lng, location.lat, location.zoom, glassType, isDraggingText, isDraggingText2, isDraggingIcon, generateBaseMapImage]);
  
  return (
    <div className="map-renderer">
      <div 
        className="map-preview-container"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
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
                key="draggable-text"
                ref={textRef}
                className={`draggable-text ${isDraggingText ? 'dragging' : ''}`}
                style={{
                  left: `${textPosition.x}%`,
                  top: `${textPosition.y}%`,
                  fontSize: `${textSize}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: (isDraggingText2 || isDraggingIcon) ? 'none' : 'auto',
                  textShadow: `
                    -${textStrokeWidth}px -${textStrokeWidth}px 0 #ffffff,
                    ${textStrokeWidth}px -${textStrokeWidth}px 0 #ffffff,
                    -${textStrokeWidth}px ${textStrokeWidth}px 0 #ffffff,
                    ${textStrokeWidth}px ${textStrokeWidth}px 0 #ffffff,
                    -${textStrokeWidth}px 0 0 #ffffff,
                    ${textStrokeWidth}px 0 0 #ffffff,
                    0 -${textStrokeWidth}px 0 #ffffff,
                    0 ${textStrokeWidth}px 0 #ffffff
                  `
                }}
                onMouseDown={(e) => handleDragStart(e, 'text')}
              >
                {overlayText}
              </div>
            )}
            
            {/* Draggable second text overlay */}
            {overlayText2.trim() && (
              <div
                key="draggable-text2"
                ref={text2Ref}
                className={`draggable-text ${isDraggingText2 ? 'dragging' : ''}`}
                style={{
                  left: `${textPosition2.x}%`,
                  top: `${textPosition2.y}%`,
                  fontSize: `${textSize2}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: (isDraggingText || isDraggingIcon) ? 'none' : 'auto',
                  textShadow: `
                    -${textStrokeWidth2}px -${textStrokeWidth2}px 0 #ffffff,
                    ${textStrokeWidth2}px -${textStrokeWidth2}px 0 #ffffff,
                    -${textStrokeWidth2}px ${textStrokeWidth2}px 0 #ffffff,
                    ${textStrokeWidth2}px ${textStrokeWidth2}px 0 #ffffff,
                    -${textStrokeWidth2}px 0 0 #ffffff,
                    ${textStrokeWidth2}px 0 0 #ffffff,
                    0 -${textStrokeWidth2}px 0 #ffffff,
                    0 ${textStrokeWidth2}px 0 #ffffff
                  `
                }}
                onMouseDown={(e) => handleDragStart(e, 'text2')}
              >
                {overlayText2}
              </div>
            )}
            
            {/* Draggable icon overlay */}
            {selectedIcon && flatIcons[selectedIcon] && (
              <div
                key="draggable-icon"
                ref={iconRef}
                className={`draggable-icon ${isDraggingIcon ? 'dragging' : ''}`}
                style={{
                  left: `${iconPosition.x}%`,
                  top: `${iconPosition.y}%`,
                  width: `${iconSize}px`,
                  height: `${iconSize}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: (isDraggingText || isDraggingText2) ? 'none' : 'auto'
                }}
                onMouseDown={(e) => handleDragStart(e, 'icon')}
              >
                {renderIcon(selectedIcon, iconSize, iconStrokeWidth)}
              </div>
            )}
          </>
        )}
      </div>
      
      <div className="preview-controls">
        <button 
          onClick={generateFinalImage}
          className="refresh-map-btn"
          disabled={imageLoading}
        >
          {imageLoading ? 'Generating...' : 'Generate Final Design'}
        </button>
      </div>

      <div className="overlay-controls">
        <h3>Add Text & Icons (Optional)</h3>
        
        <div className="controls-container">
          <div className="text-controls">
            <label htmlFor="overlay-text">Text 1:</label>
            <input
              id="overlay-text"
              type="text"
              value={overlayText}
              onChange={(e) => setOverlayText(e.target.value)}
              placeholder="Enter first text..."
              className="text-input"
            />
            <div className="size-control">
              <label>Text 1 Size: {textSize}px</label>
              <input
                type="range"
                min="20"
                max="100"
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>
            <div className="size-control">
              <label>Text 1 Stroke Width: {textStrokeWidth}px</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={textStrokeWidth}
                onChange={(e) => setTextStrokeWidth(parseFloat(e.target.value))}
                className="size-slider"
              />
            </div>
            
            <label htmlFor="overlay-text2">Text 2 (Optional):</label>
            <input
              id="overlay-text2"
              type="text"
              value={overlayText2}
              onChange={(e) => setOverlayText2(e.target.value)}
              placeholder="Enter second text..."
              className="text-input"
            />
            <div className="size-control">
              <label>Text 2 Size: {textSize2}px</label>
              <input
                type="range"
                min="20"
                max="100"
                value={textSize2}
                onChange={(e) => setTextSize2(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>
            <div className="size-control">
              <label>Text 2 Stroke Width: {textStrokeWidth2}px</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={textStrokeWidth2}
                onChange={(e) => setTextStrokeWidth2(parseFloat(e.target.value))}
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
              <option value="star">Star</option>
              <option value="heart">Heart</option>
              <option value="pin">Location Pin</option>
              <option value="home">Home</option>
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
            <div className="size-control">
              <label>Icon Stroke Width: {iconStrokeWidth}px</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={iconStrokeWidth}
                onChange={(e) => setIconStrokeWidth(parseFloat(e.target.value))}
                className="size-slider"
              />
            </div>
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