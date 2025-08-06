import { useEffect, useState, useCallback, useRef } from 'react';
import { getMapboxStaticUrl, validateMapboxToken } from '../../utils/mapbox';
import { calculateDimensions } from '../../utils/canvas';
import { useMapConfig } from '../../contexts/MapConfigContext';
import { flatIcons, renderIcon } from '../../utils/icons';
import MapExportControls from './MapExportControls';
import './MapRenderer.css';

const MapRenderer = () => {
  const { location, glassType, texts, icons, updateText, updateIcon, setMapImage, setLoading, setError } = useMapConfig();
  const [localImageUrl, setLocalImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [hasInitiallyGenerated, setHasInitiallyGenerated] = useState(false);
  
  // Get text and icon objects from context
  const text1 = texts.find(t => t.id === 'text1') || null;
  const text2 = texts.find(t => t.id === 'text2') || null;
  const icon1 = icons.find(i => i.id === 'icon1') || null;
  const [isDraggingText, setIsDraggingText] = useState(false);
  const [isDraggingText2, setIsDraggingText2] = useState(false);
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnyElementDragging, setIsAnyElementDragging] = useState(false);
  const textRef = useRef(null);
  const text2Ref = useRef(null);
  const iconRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const lastLocationRef = useRef(null);

  // Generate rounded text shadow with more points for smooth curves
  const generateRoundedTextShadow = (strokeWidth) => {
    if (strokeWidth === 0) return 'none';
    
    const shadows = [];
    const steps = 16; // More steps = smoother curves
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const x = Math.cos(angle) * strokeWidth;
      const y = Math.sin(angle) * strokeWidth;
      shadows.push(`${x.toFixed(2)}px ${y.toFixed(2)}px 0 #ffffff`);
    }
    
    // Add additional intermediate points for extra smoothness
    for (let radius = strokeWidth * 0.7; radius > 0; radius -= strokeWidth * 0.3) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        shadows.push(`${x.toFixed(2)}px ${y.toFixed(2)}px 0 #ffffff`);
      }
    }
    
    return shadows.join(', ');
  };

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
    setIsAnyElementDragging(true);
  }, []);

  // Handle drag move - direct updates without debouncing
  const handleDragMove = useCallback((e) => {
    if (!isDraggingText && !isDraggingText2 && !isDraggingIcon) return;
    
    e.preventDefault();
    
    if (isDraggingText && text1) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget, dragOffset, textRef.current);
      updateText('text1', { position: newPos });
    }
    
    if (isDraggingText2 && text2) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget, dragOffset, text2Ref.current);
      updateText('text2', { position: newPos });
    }
    
    if (isDraggingIcon && icon1) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, e.currentTarget, dragOffset, iconRef.current);
      updateIcon('icon1', { position: newPos });
    }
  }, [isDraggingText, isDraggingText2, isDraggingIcon, dragOffset, getPercentagePosition, text1, text2, icon1, updateText, updateIcon]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDraggingText(false);
    setIsDraggingText2(false);
    setIsDraggingIcon(false);
    setIsAnyElementDragging(false);
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
    if (text1 && text1.content && text1.content.trim()) {
      const fontSize = (text1.size / 100) * Math.min(width, height) * 0.15;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textCoords = getPixelPosition(text1.position, width, height);
      const scaledStrokeWidth = text1.strokeWidth * (fontSize / 50); // Scale stroke with font size
      
      // Generate rounded white outline
      ctx.fillStyle = '#ffffff';
      const steps = 16;
      
      // Primary circular outline
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const offsetX = Math.cos(angle) * scaledStrokeWidth;
        const offsetY = Math.sin(angle) * scaledStrokeWidth;
        ctx.fillText(text1.content, textCoords.x + offsetX, textCoords.y + offsetY);
      }
      
      // Additional layers for smoother stroke
      for (let radius = scaledStrokeWidth * 0.7; radius > 0; radius -= scaledStrokeWidth * 0.3) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          ctx.fillText(text1.content, textCoords.x + offsetX, textCoords.y + offsetY);
        }
      }
      
      // Black text
      ctx.fillStyle = '#000000';
      ctx.fillText(text1.content, textCoords.x, textCoords.y);
    }
    
    // Add second text overlay if provided
    if (text2 && text2.content && text2.content.trim()) {
      const fontSize2 = (text2.size / 100) * Math.min(width, height) * 0.15;
      ctx.font = `bold ${fontSize2}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textCoords2 = getPixelPosition(text2.position, width, height);
      const scaledStrokeWidth2 = text2.strokeWidth * (fontSize2 / 50); // Scale stroke with font size
      
      // Generate rounded white outline
      ctx.fillStyle = '#ffffff';
      const steps2 = 16;
      
      // Primary circular outline
      for (let i = 0; i < steps2; i++) {
        const angle = (i / steps2) * 2 * Math.PI;
        const offsetX = Math.cos(angle) * scaledStrokeWidth2;
        const offsetY = Math.sin(angle) * scaledStrokeWidth2;
        ctx.fillText(text2.content, textCoords2.x + offsetX, textCoords2.y + offsetY);
      }
      
      // Additional layers for smoother stroke
      for (let radius = scaledStrokeWidth2 * 0.7; radius > 0; radius -= scaledStrokeWidth2 * 0.3) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          ctx.fillText(text2.content, textCoords2.x + offsetX, textCoords2.y + offsetY);
        }
      }
      
      // Black text
      ctx.fillStyle = '#000000';
      ctx.fillText(text2.content, textCoords2.x, textCoords2.y);
    }
    
    // Add icon overlay if selected
    if (icon1 && icon1.type && flatIcons[icon1.type]) {
      const iconScale = (icon1.size / 100) * Math.min(width, height) * 0.2;
      const iconCoords = getPixelPosition(icon1.position, width, height);
      
      // Create SVG path from icon definition
      const iconData = flatIcons[icon1.type];
      const path = new Path2D(iconData.path);
      
      // Save context state
      ctx.save();
      
      // Move to icon position and scale
      ctx.translate(iconCoords.x - iconScale/2, iconCoords.y - iconScale/2);
      ctx.scale(iconScale/24, iconScale/24); // SVG viewBox is 24x24
      
      // Draw rounded white stroke behind the icon
      if (icon1.strokeWidth > 0) {
        const scaledStrokeWidth = icon1.strokeWidth * (24/iconScale);
        ctx.fillStyle = '#ffffff';
        const strokeSteps = 16;
        
        // Primary circular stroke
        for (let i = 0; i < strokeSteps; i++) {
          const angle = (i / strokeSteps) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * scaledStrokeWidth;
          const offsetY = Math.sin(angle) * scaledStrokeWidth;
          
          ctx.save();
          ctx.translate(offsetX, offsetY);
          ctx.fill(path);
          ctx.restore();
        }
        
        // Additional layers for smoother stroke
        for (let radius = scaledStrokeWidth * 0.7; radius > 0; radius -= scaledStrokeWidth * 0.3) {
          for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * 2 * Math.PI;
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;
            
            ctx.save();
            ctx.translate(offsetX, offsetY);
            ctx.fill(path);
            ctx.restore();
          }
        }
      }
      
      // Draw black icon on top
      ctx.fillStyle = '#000000';
      ctx.fill(path);
      
      // Restore context state
      ctx.restore();
    }
    
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    setMapImage(dataUrl); // This is the final export image
    return dataUrl;
  }, [localImageUrl, glassType, text1, text2, icon1, getPixelPosition, setMapImage]);

  // Initial generation when component mounts
  useEffect(() => {
    if (!hasInitiallyGenerated && location.lat && location.lng && location.zoom) {
      console.log('Initial base map generation on mount');
      generateBaseMapImage();
      setHasInitiallyGenerated(true);
    }
  }, [location.lat, location.lng, location.zoom, hasInitiallyGenerated, generateBaseMapImage]);
  
  useEffect(() => {
    // Clear any existing timeout first
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    
    // Don't trigger refresh during any dragging operations
    if (isAnyElementDragging) {
      console.log('Skipping auto-generation - currently dragging elements');
      return;
    }
    
    // Check if location has actually changed significantly
    const currentLocation = { lat: location.lat, lng: location.lng, zoom: location.zoom };
    const lastLocation = lastLocationRef.current;
    
    if (lastLocation) {
      const latDiff = Math.abs(currentLocation.lat - lastLocation.lat);
      const lngDiff = Math.abs(currentLocation.lng - lastLocation.lng);
      const zoomDiff = Math.abs(currentLocation.zoom - lastLocation.zoom);
      
      // Only refresh if there's a significant change (reduce sensitivity)
      if (latDiff < 0.001 && lngDiff < 0.001 && zoomDiff < 0.1) {
        console.log('Skipping auto-generation - location change too small');
        return;
      }
    }
    
    // Only trigger auto-generation if we have valid location data
    if (location.lat && location.lng && location.zoom) {
      console.log('Setting timer for auto-generation with significant location change');
      
      updateTimeoutRef.current = setTimeout(() => {
        console.log('Auto-generating base map preview after significant map movement...');
        lastLocationRef.current = currentLocation;
        generateBaseMapImage();
        updateTimeoutRef.current = null;
      }, 3000); // Increased to 3 seconds for less aggressive updates
    }
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };
  }, [location.lng, location.lat, location.zoom, glassType, isAnyElementDragging, generateBaseMapImage]);
  
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
            {text1 && text1.content && text1.content.trim() && (
              <div
                key="draggable-text"
                ref={textRef}
                className={`draggable-text ${isDraggingText ? 'dragging' : ''}`}
                style={{
                  left: `${text1.position.x}%`,
                  top: `${text1.position.y}%`,
                  fontSize: `${text1.size}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: (isDraggingText2 || isDraggingIcon) ? 'none' : 'auto',
                  textShadow: generateRoundedTextShadow(text1.strokeWidth)
                }}
                onMouseDown={(e) => handleDragStart(e, 'text')}
              >
                {text1.content}
              </div>
            )}
            
            {/* Draggable second text overlay */}
            {text2 && text2.content && text2.content.trim() && (
              <div
                key="draggable-text2"
                ref={text2Ref}
                className={`draggable-text ${isDraggingText2 ? 'dragging' : ''}`}
                style={{
                  left: `${text2.position.x}%`,
                  top: `${text2.position.y}%`,
                  fontSize: `${text2.size}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: (isDraggingText || isDraggingIcon) ? 'none' : 'auto',
                  textShadow: generateRoundedTextShadow(text2.strokeWidth)
                }}
                onMouseDown={(e) => handleDragStart(e, 'text2')}
              >
                {text2.content}
              </div>
            )}
            
            {/* Draggable icon overlay */}
            {icon1 && icon1.type && flatIcons[icon1.type] && (
              <div
                key="draggable-icon"
                ref={iconRef}
                className={`draggable-icon ${isDraggingIcon ? 'dragging' : ''}`}
                style={{
                  left: `${icon1.position.x}%`,
                  top: `${icon1.position.y}%`,
                  width: `${icon1.size}px`,
                  height: `${icon1.size}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: (isDraggingText || isDraggingText2) ? 'none' : 'auto'
                }}
                onMouseDown={(e) => handleDragStart(e, 'icon')}
              >
                {renderIcon(icon1.type, icon1.size, icon1.strokeWidth)}
              </div>
            )}
          </>
        )}
      </div>
      
      <MapExportControls 
        onGenerateFinalImage={generateFinalImage}
        isGenerating={imageLoading}
      />
      
      <div className="preview-note">
        <p>This preview shows your design with draggable text and icons. Use the controls above to generate final exports.</p>
      </div>
    </div>
  );
};

export default MapRenderer;