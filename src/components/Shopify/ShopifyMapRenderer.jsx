import { useEffect, useState, useCallback, useRef } from 'react';
import { getMapboxStaticUrl, validateMapboxToken } from '../../utils/mapbox';
import { calculateDimensions } from '../../utils/canvas';
import { useMapConfig } from '../../contexts/MapConfigContext';
import { flatIcons, renderIcon } from '../../utils/icons';
import ShopifyMapExportControls from './ShopifyMapExportControls';
import './ShopifyMapRenderer.css';

const ShopifyMapRenderer = () => {
  const { location, glassType, texts, icons, updateText, updateIcon, setMapImage, setLoading, setError, setModelImage, setModelPreviewAvailable } = useMapConfig();
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

  // Auto-generate map when location changes
  useEffect(() => {
    const generateIfLocationChanged = async () => {
      if (!location?.coordinates || !location?.zoom) {
        return;
      }

      const currentLocationKey = `${location.coordinates[0]},${location.coordinates[1]},${location.zoom}`;
      
      if (lastLocationRef.current === currentLocationKey) {
        return;
      }

      lastLocationRef.current = currentLocationKey;
      
      try {
        await generateFinalImage();
        setHasInitiallyGenerated(true);
      } catch (error) {
        console.warn('Auto-generation failed:', error);
      }
    };

    // Debounce the generation
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(generateIfLocationChanged, 500);
    
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [location]);

  // Generate final image with text and icons
  const generateFinalImage = useCallback(async () => {
    if (!location?.coordinates || !location?.zoom) {
      setError('Location data is required to generate the image');
      return;
    }

    setImageLoading(true);
    setLoading(true);
    setError(null);

    try {
      // Validate Mapbox token first
      const isTokenValid = await validateMapboxToken();
      if (!isTokenValid) {
        throw new Error('Invalid Mapbox access token. Please check your configuration.');
      }

      const { width, height } = calculateDimensions(glassType);
      
      const mapUrl = getMapboxStaticUrl({
        coordinates: location.coordinates,
        zoom: location.zoom,
        width,
        height,
        style: 'mapbox://styles/mapbox/streets-v11'
      });

      // Create canvas for composition
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // Set canvas to black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Load the map image
      const mapImg = new Image();
      mapImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        mapImg.onload = resolve;
        mapImg.onerror = () => reject(new Error('Failed to load map image'));
        mapImg.src = mapUrl;
      });

      // Draw the map
      ctx.drawImage(mapImg, 0, 0, width, height);

      // Render Text 1
      if (text1 && text1.content && text1.content.trim()) {
        const fontSize = (text1.size / 100) * Math.min(width, height) * 0.15;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = (text1.position.x / 100) * width;
        const y = (text1.position.y / 100) * height;
        const strokeWidth = text1.strokeWidth * (fontSize / 100);
        
        // Generate rounded stroke
        const steps = 16;
        ctx.fillStyle = '#ffffff';
        
        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * strokeWidth;
          const offsetY = Math.sin(angle) * strokeWidth;
          ctx.fillText(text1.content, x + offsetX, y + offsetY);
        }
        
        // Black text on top
        ctx.fillStyle = '#000000';
        ctx.fillText(text1.content, x, y);
      }

      // Render Text 2
      if (text2 && text2.content && text2.content.trim()) {
        const fontSize = (text2.size / 100) * Math.min(width, height) * 0.15;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = (text2.position.x / 100) * width;
        const y = (text2.position.y / 100) * height;
        const strokeWidth = text2.strokeWidth * (fontSize / 100);
        
        // Generate rounded stroke
        const steps = 16;
        ctx.fillStyle = '#ffffff';
        
        for (let i = 0; i < steps; i++) {
          const angle = (i / steps) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * strokeWidth;
          const offsetY = Math.sin(angle) * strokeWidth;
          ctx.fillText(text2.content, x + offsetX, y + offsetY);
        }
        
        // Black text on top
        ctx.fillStyle = '#000000';
        ctx.fillText(text2.content, x, y);
      }

      // Render Icon
      if (icon1 && icon1.type && flatIcons[icon1.type]) {
        const iconScale = (icon1.size / 100) * Math.min(width, height) * 0.2;
        const x = (icon1.position.x / 100) * width;
        const y = (icon1.position.y / 100) * height;
        const scale = iconScale / 24; // SVG viewBox is 24x24
        const strokeWidth = icon1.strokeWidth;
        
        const path = new Path2D(flatIcons[icon1.type].path);
        
        ctx.save();
        ctx.translate(x, y);
        
        // Draw white stroke background using slightly larger scale
        if (strokeWidth > 0) {
          const strokeScale = scale * (1 + strokeWidth / 12);
          ctx.scale(strokeScale, strokeScale);
          ctx.fillStyle = '#ffffff';
          ctx.fill(path);
          
          // Reset transform and draw black icon at normal scale
          ctx.restore();
          ctx.save();
          ctx.translate(x, y);
        }
        
        // Draw black icon at normal scale
        ctx.scale(scale, scale);
        ctx.fillStyle = '#000000';
        ctx.fill(path);
        
        ctx.restore();
      }

      const finalImageUrl = canvas.toDataURL('image/png', 0.9);
      setLocalImageUrl(finalImageUrl);
      setMapImage(finalImageUrl);

      // Enable 3D preview for rocks glass
      if (glassType === 'rocks') {
        setModelImage(finalImageUrl);
        setModelPreviewAvailable(true);
      }

    } catch (error) {
      console.error('Failed to generate image:', error);
      setError(error.message || 'Failed to generate map image');
    } finally {
      setImageLoading(false);
      setLoading(false);
    }
  }, [location, texts, icons, glassType, setMapImage, setLoading, setError, setModelImage, setModelPreviewAvailable]);

  // Handle drag events for text and icons...
  const handleDragStart = (e, type) => {
    e.preventDefault();
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const containerRect = element.parentElement.getBoundingClientRect();
    
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });
    
    if (type === 'text1') {
      setIsDraggingText(true);
    } else if (type === 'text2') {
      setIsDraggingText2(true);
    } else if (type === 'icon') {
      setIsDraggingIcon(true);
    }
    
    setIsAnyElementDragging(true);
  };

  const handleDragMove = useCallback((e) => {
    if (!isAnyElementDragging) return;
    
    const container = document.querySelector('.shopify-map-preview-container');
    if (!container) return;
    
    if (isDraggingText && text1) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, container, dragOffset, textRef.current);
      updateText('text1', { position: newPos });
    }
    
    if (isDraggingText2 && text2) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, container, dragOffset, text2Ref.current);
      updateText('text2', { position: newPos });
    }
    
    if (isDraggingIcon && icon1) {
      const newPos = getPercentagePosition(e.clientX, e.clientY, container, dragOffset, iconRef.current);
      updateIcon('icon1', { position: newPos });
    }
  }, [isDraggingText, isDraggingText2, isDraggingIcon, text1, text2, icon1, dragOffset, getPercentagePosition, updateText, updateIcon, isAnyElementDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDraggingText(false);
    setIsDraggingText2(false);
    setIsDraggingIcon(false);
    setIsAnyElementDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Add global event listeners for dragging
  useEffect(() => {
    if (isAnyElementDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('mouseleave', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('mouseleave', handleDragEnd);
      };
    }
  }, [isAnyElementDragging, handleDragMove, handleDragEnd]);

  if (!location) {
    return (
      <div className="shopify-map-renderer">
        <div className="shopify-no-location">
          <p>Select a location to preview your map design</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shopify-map-renderer">
      <div className="shopify-map-preview-container">
        {localImageUrl ? (
          <img 
            src={localImageUrl} 
            alt="Map preview"
            className="shopify-map-preview"
            style={{
              filter: isAnyElementDragging ? 'brightness(0.9)' : 'none',
              cursor: isAnyElementDragging ? 'grabbing' : 'default'
            }}
          />
        ) : (
          <div className="shopify-map-placeholder">
            <p>Generate preview to see your map</p>
          </div>
        )}
        
        {/* Overlay elements for dragging */}
        {localImageUrl && (
          <>
            {/* Text 1 */}
            {text1 && text1.content && (
              <div
                ref={textRef}
                className="shopify-draggable-text"
                style={{
                  position: 'absolute',
                  left: `${text1.position.x}%`,
                  top: `${text1.position.y}%`,
                  fontSize: `${text1.size * 0.8}px`,
                  fontWeight: 'bold',
                  color: '#000000',
                  textShadow: generateRoundedTextShadow(text1.strokeWidth),
                  transform: 'translate(-50%, -50%)',
                  cursor: isDraggingText ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  pointerEvents: (isDraggingText2 || isDraggingIcon) ? 'none' : 'auto',
                  zIndex: isDraggingText ? 1000 : 10
                }}
                onMouseDown={(e) => handleDragStart(e, 'text1')}
              >
                {text1.content}
              </div>
            )}
            
            {/* Text 2 */}
            {text2 && text2.content && (
              <div
                ref={text2Ref}
                className="shopify-draggable-text"
                style={{
                  position: 'absolute',
                  left: `${text2.position.x}%`,
                  top: `${text2.position.y}%`,
                  fontSize: `${text2.size * 0.8}px`,
                  fontWeight: 'bold',
                  color: '#000000',
                  textShadow: generateRoundedTextShadow(text2.strokeWidth),
                  transform: 'translate(-50%, -50%)',
                  cursor: isDraggingText2 ? 'grabbing' : 'grab',
                  userSelect: 'none',
                  pointerEvents: (isDraggingText || isDraggingIcon) ? 'none' : 'auto',
                  zIndex: isDraggingText2 ? 1000 : 10
                }}
                onMouseDown={(e) => handleDragStart(e, 'text2')}
              >
                {text2.content}
              </div>
            )}
            
            {/* Icon */}
            {icon1 && icon1.type && (
              <div
                ref={iconRef}
                className="shopify-draggable-icon"
                style={{
                  position: 'absolute',
                  left: `${icon1.position.x}%`,
                  top: `${icon1.position.y}%`,
                  width: `${icon1.size}px`,
                  height: `${icon1.size}px`,
                  transform: 'translate(-50%, -50%)',
                  cursor: isDraggingIcon ? 'grabbing' : 'grab',
                  pointerEvents: (isDraggingText || isDraggingText2) ? 'none' : 'auto',
                  zIndex: isDraggingIcon ? 1000 : 10
                }}
                onMouseDown={(e) => handleDragStart(e, 'icon')}
              >
                {renderIcon(icon1.type, icon1.size, icon1.strokeWidth)}
              </div>
            )}
          </>
        )}
      </div>
      
      <ShopifyMapExportControls 
        onGenerateFinalImage={generateFinalImage}
        isGenerating={imageLoading}
      />
    </div>
  );
};

export default ShopifyMapRenderer;