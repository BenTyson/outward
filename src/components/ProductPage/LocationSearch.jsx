import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { MAPBOX_TOKEN } from '../../utils/mapbox';
import { useMapConfig } from '../../contexts/MapConfigContext';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './LocationSearch.css';

const LocationSearch = () => {
  const geocoderContainerRef = useRef(null);
  const geocoderRef = useRef(null);
  const { setLocation, setCoordinates } = useMapConfig();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!geocoderContainerRef.current || geocoderRef.current) return;
    
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
      setError('Mapbox token not configured. Please add a valid token to .env.local');
      return;
    }
    
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    try {
      const geocoder = new MapboxGeocoder({
        accessToken: MAPBOX_TOKEN,
        types: 'country,region,place,postcode,locality,neighborhood,address,poi',
        placeholder: 'Enter address, city, or landmark...',
        flyTo: false,
        marker: false
      });
      
      geocoder.on('result', (e) => {
        const { center, place_name } = e.result;
        // Set location as object (matching existing format)
        setLocation({
          lng: center[0],
          lat: center[1],
          address: place_name,
          zoom: 12
        });
        // Set coordinates as separate object for backwards compatibility
        setCoordinates({
          lng: center[0],
          lat: center[1],
          zoom: 12
        });
        setError(null);
      });
      
      geocoder.on('error', (e) => {
        console.error('Geocoder error:', e);
        setError('Failed to search location. Please try again.');
      });
      
      geocoderContainerRef.current.appendChild(geocoder.onAdd());
      geocoderRef.current = geocoder;
      
    } catch (err) {
      console.error('Failed to initialize geocoder:', err);
      setError('Failed to initialize location search. Please check your Mapbox token.');
    }
    
    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.clear();
      }
    };
  }, [setLocation, setCoordinates]);
  
  if (error) {
    return (
      <div className="location-search-error">
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="location-search">
      <div ref={geocoderContainerRef} className="geocoder-container" />
    </div>
  );
};

export default LocationSearch;