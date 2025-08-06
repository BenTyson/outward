import React from 'react';

// Flat SVG icons for laser engraving
export const flatIcons = {
  home: {
    name: 'Home',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M9 22V12h6v10M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M9 22V12h6v10M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
  },
  
  heart: {
    name: 'Heart',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          stroke="black"
          strokeWidth="1"
        />
      </svg>
    ),
    path: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 100-6 3 3 0 000 6z"
  },
  
  compass: {
    name: 'Compass',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="12" 
          cy="12" 
          r="10"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
        />
        <path
          d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
          fill="white"
          stroke="black"
          strokeWidth="1"
        />
      </svg>
    ),
    path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
  },
  
  mountain: {
    name: 'Mountain',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="m8 21 4-7 3 7m5-7l-4-7-4 7m-8 7h16"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M8 21l4-7 3 7m5-7l-4-7-4 7m-8 7h16"
  },
  
  tree: {
    name: 'Tree',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path 
          d="M12 22V8M7.5 7.5h9l-2 5h4l-3 7.5h-7l-3-7.5h4l-2-5z"
          fill="black"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    path: "M12 22V8 M7.5 7.5h9l-2 5h4l-3 7.5h-7l-3-7.5h4l-2-5z"
  },
  
  anchor: {
    name: 'Anchor',
    svg: (size = 24, strokeWidth = 2) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          strokeLinecap="round"
        />
        <path 
          d="m5 12H2a10 10 0 0020 0h-3"
          fill="none"
          stroke="white"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    ),
    path: "M12 2a3 3 0 103 6 3 3 0 00-3-6z M12 22V8 M5 12H2a10 10 0 0020 0h-3"
  }
};

// Helper function to render icon with stroke behind (like text shadow)
export const renderIcon = (iconKey, size = 24, strokeWidth = 2) => {
  const icon = flatIcons[iconKey];
  if (!icon) return null;
  
  // Return the original SVG with CSS filter for stroke effect
  return (
    <div style={{
      filter: strokeWidth > 0 ? `drop-shadow(-${strokeWidth}px -${strokeWidth}px 0 white) 
               drop-shadow(${strokeWidth}px -${strokeWidth}px 0 white) 
               drop-shadow(-${strokeWidth}px ${strokeWidth}px 0 white) 
               drop-shadow(${strokeWidth}px ${strokeWidth}px 0 white) 
               drop-shadow(-${strokeWidth}px 0 0 white) 
               drop-shadow(${strokeWidth}px 0 0 white) 
               drop-shadow(0 -${strokeWidth}px 0 white) 
               drop-shadow(0 ${strokeWidth}px 0 white)` : 'none'
    }}>
      {icon.svg(size, 0)}
    </div>
  );
};