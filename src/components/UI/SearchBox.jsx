import { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { MAPBOX_TOKEN } from '../../utils/mapbox';
import { useMapConfig } from '../../contexts/MapConfigContext';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import './SearchBox.css';

const SearchBox = () => {
  const geocoderContainerRef = useRef(null);
  const geocoderRef = useRef(null);
  const { setLocation } = useMapConfig();
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
        placeholder: 'Search for a location...',
        flyTo: false,
        marker: false
      });
      
      geocoder.on('result', (e) => {
        const { center, place_name } = e.result;
        setLocation({
          lng: center[0],
          lat: center[1],
          address: place_name,
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
      setError('Failed to initialize search. Please check your Mapbox token.');
    }
    
    return () => {
      if (geocoderRef.current) {
        geocoderRef.current.clear();
      }
    };
  }, [setLocation]);
  
  return (
    <div className="search-box-container">
      <div ref={geocoderContainerRef} className="geocoder-container" />
      {error && (
        <div className="search-error">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchBox;