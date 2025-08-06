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

  // Initialize interactive Mapbox GL map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    if (!validateMapboxToken()) {
      setMapError('Please configure your Mapbox token in .env.local');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    console.log('Initializing seamless interactive map...');

    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/lumengrave/clm6vi67u02jm01qiayvjbsmt',
        center: [location.lng || -104.9903, location.lat || 39.7392],
        zoom: location.zoom || 12,
        interactive: true,
        attributionControl: false
      });

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.on('load', () => {
        console.log('Interactive map loaded successfully');
        map.resize();
      });

      map.on('style.load', () => {
        console.log('Custom style loaded');
        // Add white marker for dark style
        if (markerRef.current) {
          markerRef.current.remove();
        }
        const marker = new mapboxgl.Marker({ 
          color: '#ffffff',
          scale: 0.8
        })
          .setLngLat([location.lng || -104.9903, location.lat || 39.7392])
          .addTo(map);
        markerRef.current = marker;
      });

      // Update location when user moves the map
      map.on('moveend', () => {
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
        setMapError('Map failed to load. Please refresh the page.');
      });

      mapRef.current = map;

      // Handle window resize
      const handleResize = () => {
        if (map) map.resize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (markerRef.current) markerRef.current.remove();
        if (mapRef.current) mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapError('Failed to initialize map');
    }
  }, []);

  // Update marker when location changes externally (e.g., from search)
  useEffect(() => {
    if (mapRef.current && markerRef.current && location.lng && location.lat) {
      mapRef.current.flyTo({
        center: [location.lng, location.lat],
        zoom: location.zoom || 12,
        essential: true
      });
      markerRef.current.setLngLat([location.lng, location.lat]);
    }
  }, [location.lng, location.lat, location.zoom]);

  // Handle glass type changes (resize map)
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.resize(), 100);
    }
  }, [glassType]);

  return (
    <div className="map-selector">
      <SearchBox />
      
      <div className={`map-container-wrapper glass-${glassType}`}>
        {mapError ? (
          <div className="map-error">
            <p>{mapError}</p>
            <p className="map-error-hint">
              Please check your internet connection and Mapbox configuration.
            </p>
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
      
      <div className="map-instructions">
        <p>🖱️ <strong>Drag to pan</strong> • 🔍 <strong>Scroll to zoom</strong> • 🔍 <strong>Use search to jump to locations</strong></p>
      </div>
    </div>
  );
};

export default MapSelector;