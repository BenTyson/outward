/**
 * Cylinder Mathematics for Glass Mapping
 * CORRECTED: 9.92:3.46 represents image dimensions (height:width)
 * When wrapped around glass: width becomes circumference, height becomes cylinder height
 */

export const IMAGE_HEIGHT_TO_WIDTH_RATIO = 9.92 / 3.46; // ≈ 2.867
export const CIRCUMFERENCE_TO_HEIGHT_RATIO = 3.46 / 9.92; // ≈ 0.349 - This makes a short, wide glass!

/**
 * Calculate cylinder dimensions from aspect ratio
 * @param {number} height - Desired cylinder height in units
 * @returns {object} Cylinder dimensions
 */
export const calculateCylinderDimensions = (height = 100) => {
  // CORRECTED LOGIC: For a rocks glass, circumference should be larger than height
  console.log('🔍 CORRECTED CYLINDER CALCULATION:');
  console.log('Input height:', height);
  console.log('CIRCUMFERENCE_TO_HEIGHT_RATIO:', CIRCUMFERENCE_TO_HEIGHT_RATIO);
  
  // For rocks glass: circumference should be proportionally larger than height
  // circumference = height / CIRCUMFERENCE_TO_HEIGHT_RATIO
  const circumference = height / CIRCUMFERENCE_TO_HEIGHT_RATIO;
  console.log('Calculated circumference:', circumference);
  
  // Circumference = 2πr, so: r = circumference / (2π)
  const radius = circumference / (2 * Math.PI);
  console.log('Calculated radius:', radius);
  
  // Verification - this should make a short, wide glass
  const heightToCircumferenceRatio = height / circumference;
  
  console.log('🧮 VERIFICATION (should make short, wide glass):');
  console.log('Height:', height);
  console.log('Circumference:', circumference.toFixed(3));
  console.log('Radius:', radius.toFixed(3));
  console.log('Height/Circumference ratio:', heightToCircumferenceRatio.toFixed(3), '(should be ~0.349)');
  
  return {
    height,
    radius,
    circumference,
    aspectRatio: CIRCUMFERENCE_TO_HEIGHT_RATIO
  };
};

/**
 * Calculate optimal camera distance based on cylinder size
 * @param {number} radius - Cylinder radius
 * @returns {number} Camera distance
 */
export const calculateCameraDistance = (radius) => {
  // Zoom in closer to the cylinder for detailed view
  const distance = radius * 2.5; // Much closer for zoomed view
  console.log(`📷 Camera distance calculated: ${distance.toFixed(2)} (radius: ${radius.toFixed(2)}) - ZOOMED IN`);
  return distance;
};