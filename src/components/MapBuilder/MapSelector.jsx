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
  
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    
    if (!validateMapboxToken()) {
      setMapError('Please configure your Mapbox token in .env.local');
      return;
    }
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: `mapbox://styles/lumengrave/clm6vi67u02jm01qiayvjbsmt`,
        center: [location.lng, location.lat],
        zoom: location.zoom,
        interactive: true
      });
      
      map.on('load', () => {
        map.resize();
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
        setMapError('Failed to load map. Please check your connection.');
      });
      
      mapRef.current = map;
      
      const marker = new mapboxgl.Marker({ color: '#000000' })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
      markerRef.current = marker;
      
      const handleResize = () => map.resize();
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        marker.remove();
        map.remove();
      };
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapError('Failed to initialize map. Please check your configuration.');
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
        ) : (
          <div ref={mapContainerRef} className="map-container" />
        )}
      </div>
      
      <div className="map-info">
        <span className="location-display">
          {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
        </span>
        <span className="zoom-display">Zoom: {location.zoom.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default MapSelector;