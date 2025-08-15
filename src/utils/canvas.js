export const GLASS_RATIOS = {
  pint: { width: 10.64, height: 6, name: 'Pint Glass' },
  wine: { width: 8.85, height: 3.8, name: 'Wine Glass' },
  rocks: { width: 9.46, height: 3.92, name: 'Rocks Glass' },
  shot: { width: 6.2, height: 2.5, name: 'Shot Glass' }
};

export const calculateDimensions = (glassType, targetDPI = 600) => {
  const ratio = GLASS_RATIOS[glassType];
  if (!ratio) throw new Error(`Invalid glass type: ${glassType}`);
  
  const scale = targetDPI / 100;
  const width = Math.round(ratio.width * scale * 100);
  const height = Math.round(ratio.height * scale * 100);
  
  return { width, height, aspectRatio: ratio.width / ratio.height };
};

// Calculate dimensions suitable for Mapbox Static Images API (max 1280px)
export const calculateMapboxDimensions = (glassType, maxDimension = 1280) => {
  const ratio = GLASS_RATIOS[glassType];
  if (!ratio) throw new Error(`Invalid glass type: ${glassType}`);
  
  const aspectRatio = ratio.width / ratio.height;
  
  let width, height;
  if (aspectRatio > 1) {
    // Width is larger
    width = Math.min(maxDimension, Math.round(maxDimension));
    height = Math.round(width / aspectRatio);
  } else {
    // Height is larger
    height = Math.min(maxDimension, Math.round(maxDimension));
    width = Math.round(height * aspectRatio);
  }
  
  return { width, height, aspectRatio };
};

export const createHighResCanvas = (glassType) => {
  const { width, height } = calculateDimensions(glassType);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  return { canvas, ctx };
};

export const exportCanvasToPNG = (canvas) => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    }, 'image/png', 1.0);
  });
};