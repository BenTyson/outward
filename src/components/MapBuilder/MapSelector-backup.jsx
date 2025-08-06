import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, validateMapboxToken } from '../../utils/mapbox';
import { calculateDimensions } from '../../utils/canvas';
import { useMapConfig } from '../../contexts/MapConfigContext';
import SearchBox from '../UI/SearchBox';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSelector.css';

const MapSelector = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const { location, setLocation, glassType } = useMapConfig();
  const [mapError, setMapError] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useStaticFallback, setUseStaticFallback] = useState(false); // Use GL map for smooth interaction
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, lat: 0, lng: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentImageUrl, setCurrentImageUrl] = useState(null);
  
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    if (!validateMapboxToken()) {
      setMapError('Please configure your Mapbox token in .env.local');
      return;
    }
    
    // Check if WebGL is supported
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.log('WebGL not supported, using static map');
      setUseStaticFallback(true);
      return;
    }
    
    // Set a timeout to fallback to static map if GL doesn't load
    const fallbackTimeout = setTimeout(() => {
      if (!mapLoaded) {
        console.log('Map failed to load within 2 seconds, using static fallback');
        setUseStaticFallback(true);
      }
    }, 2000);
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    console.log('Initializing GL map with token:', MAPBOX_TOKEN.substring(0, 10) + '...');
    
    try {
      // Start with a basic style to ensure map loads, then switch to custom
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [location.lng || -104.9903, location.lat || 39.7392],
        zoom: location.zoom || 12,
        interactive: true,
        attributionControl: true,
        failIfMajorPerformanceCaveat: false
      });
      
      console.log('Map instance created with basic style');
      console.log('Container dimensions after creation:', mapContainerRef.current.offsetWidth, 'x', mapContainerRef.current.offsetHeight);
      
      // Force a resize to ensure proper dimensions
      setTimeout(() => {
        console.log('Forcing map resize...');
        map.resize();
      }, 100);
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.on('load', () => {
        console.log('GL Map loaded successfully with basic style');
        setMapLoaded(true);
        clearTimeout(fallbackTimeout);
        map.resize();
        
        // Now try to switch to custom style
        setTimeout(() => {
          console.log('Switching to custom style...');
          map.setStyle('mapbox://styles/lumengrave/clm6vi67u02jm01qiayvjbsmt');
        }, 500);
      });
      
      map.on('style.load', () => {
        console.log('Custom style loaded successfully');
        // Add marker after style loads
        if (markerRef.current) {
          markerRef.current.remove();
        }
        const marker = new mapboxgl.Marker({ color: '#ffffff' }) // White marker for dark style
          .setLngLat([location.lng || -104.9903, location.lat || 39.7392])
          .addTo(map);
        markerRef.current = marker;
      });
      
      map.on('move', () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        setLocation(prev => ({
          ...prev,
          lng: center.lng,
          lat: center.lat,
          zoom: zoom
        }));
      });
      
      map.on('error', (e) => {
        console.error('Map error:', e);
        if (e.error && e.error.message) {
          console.error('Error details:', e.error.message);
        }
        // Fall back to static map on any error
        console.log('GL map failed, switching to static fallback');
        setUseStaticFallback(true);
      });
      
      // Add more event listeners for debugging
      map.on('styledata', () => {
        console.log('Style data loaded');
      });
      
      map.on('sourcedata', () => {
        console.log('Source data loaded');
      });
      
      map.on('idle', () => {
        console.log('Map is idle (fully loaded)');
      });
      
      mapRef.current = map;
      
      // Add initial marker
      const marker = new mapboxgl.Marker({ color: '#000000' })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
      markerRef.current = marker;
      
      const handleResize = () => map.resize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        clearTimeout(fallbackTimeout);
        window.removeEventListener('resize', handleResize);
        if (markerRef.current) markerRef.current.remove();
        if (mapRef.current) mapRef.current.remove();
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapError('Failed to initialize map. Please check your configuration.');
      setUseStaticFallback(true);
    }
  }, []);
  
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    
    mapRef.current.flyTo({
      center: [location.lng, location.lat],
      zoom: location.zoom,
      essential: true
    });
    
    markerRef.current.setLngLat([location.lng, location.lat]);
  }, [location.lng, location.lat, location.zoom]);
  
  useEffect(() => {
    if (!mapRef.current) return;
    setTimeout(() => mapRef.current.resize(), 100);
  }, [glassType]);
  
  // Drag functionality for static map
  const handleDragStart = (e) => {
    e.preventDefault();
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    
    setIsDragging(true);
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
    
    setDragStart({
      x: clientX,
      y: clientY,
      lat: location.lat || 39.7392,
      lng: location.lng || -104.9903,
      containerWidth: rect.width,
      containerHeight: rect.height
    });
    setDragOffset({ x: 0, y: 0 });
  };
  
  const handleDragMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Just store the pixel offset for smooth visual dragging
    setDragOffset({ x: deltaX, y: deltaY });
  };
  
  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const zoom = location.zoom || 12;
    const imageWidth = 800; // Our @2x image is 1600px but displayed at 800px
    
    // CORRECTED CALCULATION:
    // At zoom level z, the entire world (360°) spans 256 * 2^z pixels in Web Mercator
    // Our @2x static image is 1600px wide and represents:
    const totalLngDegreesInImage = (360 / (256 * Math.pow(2, zoom))) * 1600;
    
    // But we display this 1600px image at 800px, so degrees per displayed pixel:
    const lngDegreesPerDisplayedPixel = totalLngDegreesInImage / imageWidth;
    
    // For latitude, it's the same calculation (for small areas, lat/lng degrees are similar)
    const latDegreesPerDisplayedPixel = lngDegreesPerDisplayedPixel;
    
    // Calculate coordinate deltas (note the direction corrections)
    const lngDelta = -dragOffset.x * lngDegreesPerDisplayedPixel; // Negative: drag right = move west
    const latDelta = dragOffset.y * latDegreesPerDisplayedPixel;   // Positive: drag down = move south
    
    console.log(`Drag: ${dragOffset.x},${dragOffset.y}px → Δ${lngDelta.toFixed(6)},${latDelta.toFixed(6)}°`);
    
    // Calculate new coordinates
    const newLat = Math.max(-85, Math.min(85, dragStart.lat + latDelta));
    const newLng = dragStart.lng + lngDelta;
    
    // Update location
    setLocation({
      ...location,
      lat: newLat,
      lng: newLng
    });
    
    // Reset drag state
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };
  
  // Add event listeners for drag
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e) => handleDragMove(e);
      const handleTouchEnd = () => handleDragEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart, dragOffset]);
  
  // Generate static map URL for fallback
  const getStaticMapUrl = () => {
    // Use the same aspect ratio as the selected glass type
    const { aspectRatio } = calculateDimensions(glassType);
    const width = 800;
    const height = Math.round(width / aspectRatio);
    const zoom = location.zoom || 12;
    const lng = location.lng || -104.9903; // Default to Denver
    const lat = location.lat || 39.7392;   // Default to Denver
    
    const customStyleUrl = `https://api.mapbox.com/styles/v1/lumengrave/clm6vi67u02jm01qiayvjbsmt/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
    return customStyleUrl;
  };

  // Initialize current image URL when location changes (but not during drag)
  useEffect(() => {
    if (!isDragging) {
      const newUrl = getStaticMapUrl();
      if (newUrl !== currentImageUrl) {
        setCurrentImageUrl(newUrl);
      }
    }
  }, [location.lng, location.lat, location.zoom, glassType, isDragging]);

  return (
    <div className="map-selector">
      <SearchBox />
      
      <div className={`map-container-wrapper glass-${glassType}`}>
        {mapError ? (
          <div className="map-error">
            <p>{mapError}</p>
            <p className="map-error-hint">
              Add your Mapbox token to .env.local:
              <br />
              <code>VITE_MAPBOX_ACCESS_TOKEN=your_token_here</code>
            </p>
          </div>
        ) : useStaticFallback ? (
          <div className="static-map-fallback">
            {currentImageUrl && (
              <img 
                src={currentImageUrl} 
                alt="Map" 
                className={`static-map-image ${isDragging ? 'dragging' : ''}`}
                style={{
                  transform: isDragging ? `translate(${dragOffset.x}px, ${dragOffset.y}px)` : 'none',
                  transition: isDragging ? 'none' : 'transform 0.2s ease'
                }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                draggable={false}
              />
            )}
            <div className="static-map-controls">
              <button 
                onClick={() => {
                  const newZoom = Math.min((location.zoom || 12) + 1, 18);
                  setLocation({ ...location, zoom: newZoom });
                }}
                title="Zoom in"
                className="zoom-btn"
              >+</button>
              <button 
                onClick={() => {
                  const newZoom = Math.max((location.zoom || 12) - 1, 1);
                  setLocation({ ...location, zoom: newZoom });
                }}
                title="Zoom out"
                className="zoom-btn"
              >-</button>
              <div className="zoom-level">
                {(location.zoom || 12).toFixed(0)}
              </div>
            </div>
            <div className="static-map-note">
              Click and drag to navigate • Use zoom controls to adjust view
            </div>
          </div>
        ) : (
          <div ref={mapContainerRef} className="map-container" />
        )}
      </div>
      
      <div className="map-info">
        <span className="location-display">
          {location.address || `${(location.lat || 0).toFixed(4)}, ${(location.lng || 0).toFixed(4)}`}
        </span>
        <span className="zoom-display">Zoom: {(location.zoom || 12).toFixed(1)}</span>
      </div>
    </div>
  );
};

export default MapSelector;