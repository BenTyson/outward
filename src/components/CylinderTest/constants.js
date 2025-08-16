// Processing and rendering constants for cylinder map visualization

export const PROCESSING_CONSTANTS = {
  // White extraction thresholds
  WHITE_THRESHOLD: 248,
  GRAY_THRESHOLD: 235,
  
  // Darkening factors
  FRONT_DARKEN_FACTOR: 0.4,
  REVERSE_DARKEN_FACTOR: 0.6,
  
  // Masking
  BOTTOM_MASK_HEIGHT_RATIO: 0.05
};

export const UV_MAPPING_CONSTANTS = {
  // Critical UV offset for perfect seam placement at back center
  // This places CENTER AREA at front, seam at back center
  FRONT_UV_OFFSET: 0.376,
  // Back view uses same texture, same offset for consistency
  BACK_UV_OFFSET: 0.376
};

export const UI_CONSTANTS = {
  MAX_DISPLAY_WIDTH: 800,
  MAX_DISPLAY_HEIGHT: 600,
  CONTROLS_MIN_WIDTH: 250,
  CONTROLS_MAX_WIDTH: 300,
  CONTROLS_PADDING: 10,
  CONTROL_SECTION_PADDING: 15,
  LABEL_FONT_SIZE: 14,
  HEADING_FONT_SIZE: 16,
  SLIDER_WIDTH: 220
};

export const THREEJS_CONFIG = {
  CAMERA_NEAR: 0.1,
  CAMERA_FAR: 2000,
  CYLINDER_RADIAL_SEGMENTS: 32,
  CYLINDER_HEIGHT_SEGMENTS: 1,
  MAX_DEVICE_PIXEL_RATIO: 2,
  OPEN_ENDED: true // No top/bottom faces
};

// Detect if running in Shopify environment
const isShopify = typeof window !== 'undefined' && 
  (window.location.hostname.includes('myshopify.com') || 
   window.location.hostname.includes('lumengrave.com'));

export const ASSET_PATHS = {
  BACKGROUND_IMAGE: isShopify 
    ? 'https://cdn.shopify.com/s/files/1/0255/1948/9112/files/rocks-white.jpg?v=1755302046'
    : '/glass-images/rocks-white.jpg',
  TEXTURE_IMAGE: '/glass-images/rocks-test-3.png',
  FALLBACK_TEXTURE: '/glass-images/rocks-test-design-optimal.png'
};

// Default calibrated values for production
export const DEFAULT_VALUES = {
  // Scale
  SCALE_X: 1.000,
  SCALE_Y: 0.930,
  
  // Rotation
  TILT_X: 0.605, // 34.7°
  ROTATE_Y: -0.785, // -45.0°
  
  // Shape
  TAPER_RATIO: 0.940,
  BASE_WIDTH: 1.020,
  
  // Position
  MODEL_X: 4.0,
  MODEL_Y: 45.0,
  CANVAS_X: 0.0,
  CANVAS_Y: -4.0,
  
  // Camera
  CAMERA_FOV: 22,
  CAMERA_Y: -47,
  CAMERA_Z: 200,
  
  // Front side effects
  FRONT_OPACITY: 0.37,
  FRONT_BLUR: 0.0,
  FRONT_GRAIN: 0.25,
  
  // Reverse side effects
  REVERSE_OPACITY: 0.16,
  REVERSE_BLUR: 1.4,
  REVERSE_GRAIN: 0.57
};