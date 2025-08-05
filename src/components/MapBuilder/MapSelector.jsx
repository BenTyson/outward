import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { MAPBOX_TOKEN, validateMapboxToken } from '../../utils/mapbox';
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
  const [useStaticFallback, setUseStaticFallback] = useState(true); // Default to static map
  
  useEffect(() => {
    // Skip GL map initialization - using static map instead
    if (!validateMapboxToken()) {
      setMapError('Please configure your Mapbox token in .env.local');
      return;
    }
    
    console.log('Using static map for location selection');
    return;
    
    // GL map code commented out due to loading issues
    /*
    if (!mapContainerRef.current || mapRef.current) return;
    
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
    console.log('Initializing map with token:', MAPBOX_TOKEN.substring(0, 10) + '...');
    console.log('Container element:', mapContainerRef.current);
    console.log('Container dimensions:', mapContainerRef.current.offsetWidth, 'x', mapContainerRef.current.offsetHeight);
    
    try {
      // Check if mapbox-gl is properly loaded
      if (!mapboxgl || !mapboxgl.Map) {
        console.error('Mapbox GL JS not properly loaded');
        setUseStaticFallback(true);
        return;
      }
      
      // Use standard style first to ensure map loads
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [location.lng, location.lat],
        zoom: location.zoom,
        interactive: true,
        attributionControl: true,
        failIfMajorPerformanceCaveat: false
      });
      
      console.log('Map instance created');
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      map.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);
        map.resize();
        
        // Now try to apply the custom style
        setTimeout(() => {
          console.log('Attempting to load custom style...');
          map.setStyle('mapbox://styles/lumengrave/clm6vi67u02jm01qiayvjbsmt');
        }, 1000);
      });
      
      map.on('style.load', () => {
        console.log('Style loaded successfully');
        // Re-add marker after style change
        if (markerRef.current) {
          markerRef.current.remove();
        }
        const marker = new mapboxgl.Marker({ color: '#000000' })
          .setLngLat([location.lng, location.lat])
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
        // Don't set error for style issues, just use fallback
        if (e.error && e.error.status === 404) {
          console.log('Custom style not found, keeping default style');
        }
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
    */
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
  
  // Generate static map URL for fallback
  const getStaticMapUrl = () => {
    const width = 800;
    const height = 450;
    const zoom = location.zoom || 12;
    const lng = location.lng || -104.9903; // Default to Denver
    const lat = location.lat || 39.7392;   // Default to Denver
    return `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
  };

  return (
    <div className="map-selector">
      <SearchBox />
      
      <div className="map-container-wrapper">
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
            <img 
              key={`${location.lng}-${location.lat}-${location.zoom}`}
              src={getStaticMapUrl()} 
              alt="Map" 
              className="static-map-image"
            />
            <div className="static-map-controls">
              <button onClick={() => {
                console.log('Zoom in clicked, current zoom:', location.zoom);
                const newZoom = Math.min((location.zoom || 12) + 1, 18);
                console.log('New zoom:', newZoom);
                setLocation({ ...location, zoom: newZoom });
              }}>+</button>
              <button onClick={() => {
                console.log('Zoom out clicked, current zoom:', location.zoom);
                const newZoom = Math.max((location.zoom || 12) - 1, 1);
                console.log('New zoom:', newZoom);
                setLocation({ ...location, zoom: newZoom });
              }}>-</button>
            </div>
            <div className="static-map-note">
              Interactive map unavailable. Use search to select location.
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