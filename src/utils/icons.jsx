// Flat SVG icons for laser engraving
export const flatIcons = {
  home: {
    name: 'Home',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
          stroke="white" 
          strokeWidth={strokeWidth}
          strokeLinecap="round" 
          strokeLinejoin="round"
          fill="black"
        />
      </svg>
    ),
    path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
  },
  
  heart: {
    name: 'Heart',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
  },
  
  star: {
    name: 'Star',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
  },
  
  pin: {
    name: 'Location Pin',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle 
          cx="12" 
          cy="10" 
          r="3"
          fill="white"
          stroke="white"
          strokeWidth={strokeWidth}
        />
      </svg>
    ),
    path: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
  },
  
  compass: {
    name: 'Compass',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="12" 
          cy="12" 
          r="10"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polygon 
          points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
          fill="white"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.24 5.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
  },
  
  mountain: {
    name: 'Mountain',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M8 18L3.5 12.5L8 4L12.5 10.5L17 4L21.5 12.5L17 18H8Z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M8 18L3.5 12.5L8 4L12.5 10.5L17 4L21.5 12.5L17 18H8Z"
  },
  
  tree: {
    name: 'Tree',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 2L7 7H10L6 12H9L4 18H11V22H13V18H20L15 12H18L14 7H17L12 2Z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M12 2L7 7H10L6 12H9L4 18H11V22H13V18H20L15 12H18L14 7H17L12 2Z"
  },
  
  anchor: {
    name: 'Anchor',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="12" 
          cy="5" 
          r="3"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
        />
        <line 
          x1="12" 
          y1="22" 
          x2="12" 
          y2="8"
          stroke="white"
          strokeWidth={strokeWidth}
        />
        <path 
          d="M5 12H2a10 10 0 0 0 20 0h-3"
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    ),
    path: "M12 2a3 3 0 0 0-3 3c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3zm0 16v4m0-12v4m-7 0H2a10 10 0 0 0 20 0h-3"
  }
};

// Helper function to render icon
export const renderIcon = (iconKey, size = 24, strokeWidth = 2) => {
  const icon = flatIcons[iconKey];
  if (!icon) return null;
  return icon.svg(size, strokeWidth);
};