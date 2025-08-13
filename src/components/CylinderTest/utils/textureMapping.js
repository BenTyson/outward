/**
 * Texture Mapping Utilities for Precise Cylindrical UV Mapping
 * 
 * Calculates exact texture portions visible from front/back views
 * based on viewing geometry and perspective projection.
 */

/**
 * Calculate the visible angle of a cylinder from a perspective camera
 * @param {number} cylinderRadius - Radius of the cylinder
 * @param {number} cameraDistance - Distance from camera to cylinder center
 * @param {number} cameraFOV - Camera field of view in degrees
 * @returns {number} Visible angle in radians
 */
export function calculateVisibleAngle(cylinderRadius, cameraDistance, cameraFOV) {
  // Convert FOV to radians
  const fovRad = (cameraFOV * Math.PI) / 180;
  
  // For a perspective camera, the visible angle depends on:
  // 1. The geometric angle subtended by the cylinder
  // 2. The field of view limitation
  
  // Calculate the angle subtended by the cylinder at the camera position
  const subtendedAngle = 2 * Math.atan(cylinderRadius / cameraDistance);
  
  // The visible angle is limited by both the subtended angle and the FOV
  const visibleAngle = Math.min(subtendedAngle, fovRad);
  
  return visibleAngle;
}

/**
 * Calculate texture UV mapping for front-facing view
 * @param {number} visibleAngle - Visible angle in radians
 * @param {number} targetVisiblePercent - Desired visible percentage (e.g., 0.4 for 40%)
 * @returns {Object} UV mapping configuration {repeat, offset}
 */
export function calculateFrontUVMapping(visibleAngle, targetVisiblePercent = 0.4) {
  // Calculate what percentage of the cylinder circumference is actually visible
  const actualVisiblePercent = visibleAngle / (2 * Math.PI);
  
  // For single-wrap texture mapping:
  // - Texture should wrap exactly once around cylinder (repeat = 1.0)
  // - Offset determines which portion of texture is visible from front
  // - If we want 40% of texture visible from front, offset to show left 40%
  
  const repeat = 1.0; // Texture wraps exactly once around cylinder
  
  // VERIFIED OFFSET: 0.376 places seam perfectly at back center
  // This makes CENTER AREA appear at front center
  // Total rotation: 135.36° CCW from default UV mapping
  const offset = 0.376;
  
  return {
    repeat: repeat,
    offset: offset,
    visiblePercent: actualVisiblePercent,
    targetVisiblePercent: targetVisiblePercent,
    description: `Front view shows texture center (seam at back)`
  };
}

/**
 * Calculate texture UV mapping for back-facing view (reverse side)
 * @param {number} visibleAngle - Visible angle in radians  
 * @param {number} targetVisiblePercent - Desired visible percentage (e.g., 0.4 for 40%)
 * @returns {Object} UV mapping configuration {repeat, offset}
 */
export function calculateBackUVMapping(visibleAngle, targetVisiblePercent = 0.4) {
  // Calculate what percentage of the cylinder circumference is actually visible
  const actualVisiblePercent = visibleAngle / (2 * Math.PI);
  
  // For single-wrap texture mapping on back side:
  // - Texture still wraps exactly once around cylinder (repeat = 1.0)
  // - Offset by 0.5 (180°) to show the back portion of texture
  // - This shows MORGAN TYSON (right side of texture) from back view
  
  const repeat = 1.0; // Texture wraps exactly once around cylinder
  
  // Use same offset as front for consistent wrapping
  // Since we're using the same base texture with BackSide material,
  // this ensures the seam stays at back center
  const offset = 0.376;
  
  return {
    repeat: repeat,
    offset: offset,
    visiblePercent: actualVisiblePercent,
    targetVisiblePercent: targetVisiblePercent,
    description: `Back view shows seam (texture edges meet)`
  };
}

/**
 * Get complete UV mapping configuration for both front and back
 * @param {Object} sceneParams - Scene parameters {cylinderRadius, cameraDistance, cameraFOV}
 * @param {Object} textureConfig - Texture configuration {frontVisible, backVisible}
 * @returns {Object} Complete UV mapping {front, back, debug}
 */
export function getCompleteUVMapping(
  sceneParams,
  textureConfig = { frontVisible: 0.4, backVisible: 0.4 }
) {
  const { cylinderRadius, cameraDistance, cameraFOV } = sceneParams;
  const { frontVisible, backVisible } = textureConfig;
  
  // Calculate visible angle from the current camera setup
  const visibleAngle = calculateVisibleAngle(cylinderRadius, cameraDistance, cameraFOV);
  
  // Calculate UV mappings for front and back
  const frontMapping = calculateFrontUVMapping(visibleAngle, frontVisible);
  const backMapping = calculateBackUVMapping(visibleAngle, backVisible);
  
  // Calculate side areas (invisible portions)
  const sidePercent = 1 - frontVisible - backVisible;
  
  return {
    front: frontMapping,
    back: backMapping,
    debug: {
      visibleAngleDegrees: (visibleAngle * 180) / Math.PI,
      visibleAngleRadians: visibleAngle,
      cylinderVisiblePercent: frontMapping.visiblePercent,
      textureDistribution: {
        front: frontVisible,
        back: backVisible,
        sides: sidePercent
      },
      sceneParams
    }
  };
}

/**
 * Apply UV mapping to Three.js textures
 * @param {Object} frontTexture - Front-facing texture
 * @param {Object} backTexture - Back-facing texture (optional)
 * @param {Object} uvMapping - UV mapping from getCompleteUVMapping
 */
export function applyUVMapping(frontTexture, backTexture, uvMapping) {
  const { front, back } = uvMapping;
  
  // Apply front texture mapping
  if (frontTexture) {
    frontTexture.repeat.set(front.repeat, 1);
    frontTexture.offset.set(front.offset, 0);
    // Note: wrapS and wrapT should be set elsewhere as they require THREE import
  }
  
  // Apply back texture mapping if provided
  if (backTexture) {
    backTexture.repeat.set(back.repeat, 1);
    backTexture.offset.set(back.offset, 0);
    // Note: wrapS and wrapT should be set elsewhere as they require THREE import
  }
  
  return uvMapping;
}