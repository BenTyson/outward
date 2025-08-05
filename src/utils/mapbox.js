export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
export const MAPBOX_STYLE_ID = import.meta.env.VITE_MAPBOX_STYLE_ID || 'lumengrave/clm6vi67u02jm01qiayvjbsmt';

export const getMapboxStaticUrl = ({ lng, lat, zoom, width, height }) => {
  const style = `mapbox://styles/${MAPBOX_STYLE_ID}`;
  const encodedStyle = style.replace('mapbox://styles/', '');
  
  return `https://api.mapbox.com/styles/v1/${encodedStyle}/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_TOKEN}`;
};

export const validateMapboxToken = () => {
  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
    console.error('Mapbox token not configured. Please add VITE_MAPBOX_ACCESS_TOKEN to .env.local');
    return false;
  }
  return true;
};