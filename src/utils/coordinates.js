export const DEFAULT_LOCATION = {
  lat: 39.7392,
  lng: -104.9903,
  address: 'Denver, CO',
  zoom: 12
};

export const calculateMapBounds = (center, zoom, aspectRatio) => {
  const metersPerPixel = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom);
  
  const width = 1280;
  const height = width / aspectRatio;
  
  const metersWidth = width * metersPerPixel;
  const metersHeight = height * metersPerPixel;
  
  const latDelta = (metersHeight / 111320);
  const lngDelta = (metersWidth / (111320 * Math.cos(center.lat * Math.PI / 180)));
  
  return {
    north: center.lat + latDelta / 2,
    south: center.lat - latDelta / 2,
    east: center.lng + lngDelta / 2,
    west: center.lng - lngDelta / 2
  };
};