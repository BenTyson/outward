import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { calculateCylinderDimensions, calculateCameraDistance } from './utils/cylinderMath';
import { 
  PROCESSING_CONSTANTS, 
  UI_CONSTANTS, 
  THREEJS_CONFIG, 
  ASSET_PATHS, 
  DEFAULT_VALUES 
} from './constants';
import { applyGrain, applyBlur, createCanvasContext, processPixels } from './utils/imageProcessing';
import { getCompleteUVMapping, applyUVMapping } from './utils/textureMapping';
import ControlPanel from './components/ControlPanel';

/**
 * CylinderMapTest - 3D Cylindrical Glass Mockup Component
 * 
 * IMPORTANT: This component is currently configured specifically for ROCKS GLASS.
 * Future expansion will include separate components/configurations for:
 * - Pint Glass (taller aspect ratio, different taper)
 * - Wine Glass (complex tapered geometry, stem considerations) 
 * - Shot Glass (smaller proportions, different camera angles)
 * 
 * Current access: ?test=cylinder (Rocks Glass configuration)
 * Future access: ?test=cylinder-pint, ?test=cylinder-wine, ?test=cylinder-shot
 * 
 * @param {string|null} textureSource - Optional texture source (data URL or file path)
 *                                    - If null, uses ASSET_PATHS.TEXTURE_IMAGE default
 *                                    - Supports Phase 1 generated images (data URLs)
 * @param {boolean} hideControls - If true, hides control panel and debug elements (for Step 3)
 */
const CylinderMapTest = ({ textureSource = null, hideControls = false, onCapture = null }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cylinderRef = useRef(null);
  const topEdgeRef = useRef(null);
  const bottomEdgeRef = useRef(null);
  const geometryRef = useRef(null);
  
  // Debug canvas refs
  const debugCanvasRef = useRef(null);
  const debugSceneRef = useRef(null);
  const debugRendererRef = useRef(null);
  const debugCylinderRef = useRef(null);
  const rimGeometryRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: UI_CONSTANTS.MAX_DISPLAY_WIDTH, height: UI_CONSTANTS.MAX_DISPLAY_HEIGHT });
  const [textureLoaded, setTextureLoaded] = useState(false);
  
  // Scale and rotation controls
  const [scaleX, setScaleX] = useState(DEFAULT_VALUES.SCALE_X);
  const [scaleY, setScaleY] = useState(DEFAULT_VALUES.SCALE_Y);
  const [tiltX, setTiltX] = useState(DEFAULT_VALUES.TILT_X);
  const [rotateY, setRotateY] = useState(DEFAULT_VALUES.ROTATE_Y);
  const [taperRatio, setTaperRatio] = useState(DEFAULT_VALUES.TAPER_RATIO);
  const [baseWidth, setBaseWidth] = useState(DEFAULT_VALUES.BASE_WIDTH);
  
  // Position controls
  const [modelX, setModelX] = useState(DEFAULT_VALUES.MODEL_X);
  const [modelY, setModelY] = useState(DEFAULT_VALUES.MODEL_Y);
  const [canvasX, setCanvasX] = useState(DEFAULT_VALUES.CANVAS_X);
  const [canvasY, setCanvasY] = useState(DEFAULT_VALUES.CANVAS_Y);
  
  // Camera controls
  const [cameraFOV, setCameraFOV] = useState(DEFAULT_VALUES.CAMERA_FOV);
  const [cameraY, setCameraY] = useState(DEFAULT_VALUES.CAMERA_Y);
  const [cameraZ, setCameraZ] = useState(DEFAULT_VALUES.CAMERA_Z);
  
  // Front side engraving controls
  const [frontOpacity, setFrontOpacity] = useState(DEFAULT_VALUES.FRONT_OPACITY);
  const [frontBlur, setFrontBlur] = useState(DEFAULT_VALUES.FRONT_BLUR);
  const [frontGrain, setFrontGrain] = useState(DEFAULT_VALUES.FRONT_GRAIN);
  
  // Reverse side engraving controls
  const [reverseOpacity, setReverseOpacity] = useState(DEFAULT_VALUES.REVERSE_OPACITY);
  const [reverseBlur, setReverseBlur] = useState(DEFAULT_VALUES.REVERSE_BLUR);
  const [reverseGrain, setReverseGrain] = useState(DEFAULT_VALUES.REVERSE_GRAIN);
  

  useEffect(() => {
    if (!canvasRef.current) return;

    console.log('🚀 Initializing Three.js scene...');

    // Calculate cylinder dimensions
    const cylinderHeight = 100;
    const dims = calculateCylinderDimensions(cylinderHeight);
    setDimensions(dims);

    // 1. Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Load rocks glass background image first to get dimensions
    const backgroundLoader = new THREE.TextureLoader();
    console.log('🖼️ Loading rocks glass background to determine canvas size...');
    
    backgroundLoader.load(
      ASSET_PATHS.BACKGROUND_IMAGE,
      (backgroundTexture) => {
        const bgWidth = backgroundTexture.image.width;
        const bgHeight = backgroundTexture.image.height;
        const bgAspect = bgWidth / bgHeight;
        
        console.log(`✅ Background loaded: ${bgWidth}x${bgHeight} (aspect: ${bgAspect.toFixed(3)})`);
        
        // Calculate optimal canvas size based on background aspect ratio
        const maxDisplayWidth = UI_CONSTANTS.MAX_DISPLAY_WIDTH;
        const maxDisplayHeight = UI_CONSTANTS.MAX_DISPLAY_HEIGHT;
        
        let canvasWidth, canvasHeight;
        
        if (bgAspect > maxDisplayWidth / maxDisplayHeight) {
          // Background is wider - fit to width
          canvasWidth = maxDisplayWidth;
          canvasHeight = maxDisplayWidth / bgAspect;
        } else {
          // Background is taller - fit to height
          canvasHeight = maxDisplayHeight;
          canvasWidth = maxDisplayHeight * bgAspect;
        }
        
        console.log(`📐 Canvas sized to: ${canvasWidth.toFixed(0)}x${canvasHeight.toFixed(0)} (preserves ${bgAspect.toFixed(3)} aspect ratio)`);
        
        // Update canvas size state
        setCanvasSize({ width: canvasWidth, height: canvasHeight });
        
        // Update renderer size
        if (rendererRef.current) {
          rendererRef.current.setSize(canvasWidth, canvasHeight);
          console.log('🔧 Renderer resized to match background aspect ratio');
        }
        
        // Update camera aspect ratio
        if (camera) {
          camera.aspect = canvasWidth / canvasHeight;
          camera.fov = cameraFOV;
          camera.updateProjectionMatrix();
          console.log('📷 Camera aspect ratio and FOV updated');
        }
        
        // Set background
        scene.background = backgroundTexture;
        
        // Re-render with correct aspect ratio
        if (rendererRef.current && camera) {
          rendererRef.current.render(scene, camera);
          console.log('🔄 Scene re-rendered with correct aspect ratio and background');
        }
      },
      (progress) => {
        console.log('📥 Background loading progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
      },
      (error) => {
        console.error('❌ Failed to load background:', error);
        // Fallback to default gray background
        scene.background = new THREE.Color(0xf0f0f0);
      }
    );

    // 2. Create Camera (aspect ratio and FOV will be updated dynamically)
    const camera = new THREE.PerspectiveCamera(
      cameraFOV, // Field of view (dynamic)
      canvasSize.width / canvasSize.height, // Initial aspect ratio
      0.1, // Near clipping
      2000 // Far clipping - increased for large objects
    );
    
    // Position camera
    const cameraDistance = calculateCameraDistance(dims.radius);
    camera.position.set(0, 0, cameraDistance);
    camera.lookAt(0, 0, 0);

    console.log(`📷 Camera positioned at distance: ${cameraDistance.toFixed(2)}`);
    console.log(`🔍 Cylinder bounds: radius=${dims.radius.toFixed(2)}, height=${dims.height}, diameter=${(dims.radius * 2).toFixed(2)}`);

    // 3. Create Renderer (size will be updated when background loads)
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      alpha: true,
      antialias: true 
    });
    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    // 4. Create Cylinder Geometry (will be updated when taperRatio changes)
    const geometry = new THREE.CylinderGeometry(
      dims.radius,  // Top radius
      dims.radius,  // Bottom radius (will be updated)
      dims.height,  // Height
      THREEJS_CONFIG.CYLINDER_RADIAL_SEGMENTS,
      THREEJS_CONFIG.CYLINDER_HEIGHT_SEGMENTS,
      THREEJS_CONFIG.OPEN_ENDED
    );

    console.log('🔶 Cylinder geometry created:', {
      topRadius: dims.radius.toFixed(3),
      bottomRadius: dims.radius.toFixed(3),
      height: dims.height,
      radialSegments: 32
    });

    // 5. Load Texture and Create Material
    const textureLoader = new THREE.TextureLoader();
    const imageSource = textureSource || ASSET_PATHS.TEXTURE_IMAGE;
    
    console.log('🖼️ Loading texture from:', textureSource ? 'Phase 1 generated image (data URL)' : 'hardcoded path');
    console.log('📍 Texture source:', imageSource.substring(0, 50) + (imageSource.length > 50 ? '...' : ''));
    
    textureLoader.load(
      imageSource,
      (texture) => {
        console.log('✅ Texture loaded successfully:', texture.image.width, 'x', texture.image.height);
        
        // Store original texture for reprocessing
        originalTextureRef.current = texture;
        setTextureLoaded(true);
        
        // Helper function to apply grain effect
        const applyGrain = (imageData, grainAmount) => {
          if (grainAmount === 0) return;
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // Only apply to non-transparent pixels
              const grain = (Math.random() - 0.5) * grainAmount * 50;
              data[i] = Math.max(0, Math.min(255, data[i] + grain));
              data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grain));
              data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grain));
            }
          }
        };

        // Helper function to apply blur effect
        const applyBlur = (ctx, canvas, blurAmount) => {
          if (blurAmount === 0) return;
          ctx.filter = `blur(${blurAmount}px)`;
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          tempCtx.drawImage(canvas, 0, 0);
          ctx.filter = 'none';
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempCanvas, 0, 0);
        };

        // Process image for front side
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        
        // Draw original image
        ctx.drawImage(texture.image, 0, 0);
        
        // Apply blur if needed
        applyBlur(ctx, canvas, frontBlur);
        
        // Get image data and process pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let processedPixels = 0;
        let darkenedPixels = 0;
        const whiteThreshold = PROCESSING_CONSTANTS.WHITE_THRESHOLD;
        const grayThreshold = PROCESSING_CONSTANTS.GRAY_THRESHOLD;
        
        console.log('🎨 Processing with thresholds - White:', whiteThreshold, 'Gray:', grayThreshold);
        console.log('🔍 Image dimensions:', canvas.width, 'x', canvas.height, 'Total pixels:', data.length / 4);
        const darkenFactor = PROCESSING_CONSTANTS.FRONT_DARKEN_FACTOR;
        
        let sampleCount = 0;
        let brightnessSum = 0;
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate brightness
          const brightness = (r + g + b) / 3;
          
          // Sample first 100 pixels for debugging
          if (sampleCount < 100) {
            brightnessSum += brightness;
            sampleCount++;
          }
          
          if (brightness > whiteThreshold) {
            // Make white/light pixels transparent
            data[i + 3] = 0; // Set alpha to 0
            processedPixels++;
          } else if (brightness > grayThreshold) {
            // Remove grayscale noise (medium grays become transparent)
            data[i + 3] = 0; // Set alpha to 0
            processedPixels++;
          } else {
            // Darken remaining pixels for stronger engraving effect
            data[i] = Math.floor(r * darkenFactor);     // Darken red
            data[i + 1] = Math.floor(g * darkenFactor); // Darken green
            data[i + 2] = Math.floor(b * darkenFactor); // Darken blue
            darkenedPixels++;
          }
        }
        
        // Apply grain effect
        applyGrain(imageData, frontGrain);
        
        // Put processed data back
        ctx.putImageData(imageData, 0, 0);
        
        // No masking on front face - show full cylindrical wrap
        
        const avgBrightness = brightnessSum / sampleCount;
        console.log(`🔍 Sample brightness analysis: Average: ${avgBrightness.toFixed(1)}, Threshold comparison: White(${whiteThreshold}) Gray(${grayThreshold})`);
        console.log(`🎨 Front: ${processedPixels} pixels transparent, ${darkenedPixels} pixels darkened, blur: ${frontBlur}px, grain: ${frontGrain}`);
        
        // Create new texture from processed canvas
        const processedTexture = new THREE.CanvasTexture(canvas);
        
        // Calculate precise UV mapping for perspective-corrected texture visibility
        const sceneParams = {
          cylinderRadius: dims.radius,
          cameraDistance: calculateCameraDistance(dims.radius),
          cameraFOV: cameraFOV
        };
        
        const uvMapping = getCompleteUVMapping(sceneParams, {
          frontVisible: 0.4,  // 40% of texture visible from front
          backVisible: 0.4    // 40% of texture visible from back
        });
        
        console.log('🎯 UV Mapping calculated:', {
          visibleAngle: uvMapping.debug.visibleAngleDegrees.toFixed(1) + '°',
          frontRepeat: uvMapping.front.repeat.toFixed(3),
          frontOffset: uvMapping.front.offset.toFixed(3),
          textureDistribution: uvMapping.debug.textureDistribution
        });
        
        // Configure texture with precise UV mapping
        processedTexture.wrapS = THREE.RepeatWrapping;      // Horizontal wrap around cylinder
        processedTexture.wrapT = THREE.ClampToEdgeWrapping; // Vertical clamp (top to bottom)
        processedTexture.minFilter = THREE.LinearFilter;    // Smooth scaling down
        processedTexture.magFilter = THREE.LinearFilter;    // Smooth scaling up
        
        // Apply precise front-view UV mapping
        processedTexture.repeat.set(uvMapping.front.repeat, 1);
        processedTexture.offset.set(uvMapping.front.offset, 0);
        
        console.log('🔧 Front texture configured with precise UV mapping');
        
        // Create front side material with dynamic opacity
        const frontMaterial = new THREE.MeshBasicMaterial({ 
          map: processedTexture,
          transparent: true,
          opacity: frontOpacity,
          side: THREE.FrontSide   // Only front-facing surfaces
        });

        // Create reverse side material using the SAME processed texture
        // This ensures proper cylindrical wrapping - only UV offset differs
        const reverseTexture = processedTexture.clone();
        
        // Apply precise back-view UV mapping to show seam area
        reverseTexture.repeat.set(uvMapping.back.repeat, 1);
        reverseTexture.offset.set(uvMapping.back.offset, 0);
        
        console.log('🔧 Reverse texture configured with same base texture, different UV mapping:', {
          backRepeat: uvMapping.back.repeat.toFixed(3),
          backOffset: uvMapping.back.offset.toFixed(3)
        });
        
        const reverseMaterial = new THREE.MeshBasicMaterial({
          map: reverseTexture,
          transparent: true,
          opacity: reverseOpacity,
          side: THREE.BackSide    // Only back-facing surfaces (inside of cylinder)
        });

        // Create material array for front and back
        const materials = [frontMaterial, reverseMaterial];
        
        console.log('✅ Material created with white pixels removed');
        
        // Apply dual materials to cylinder using a group approach
        if (geometryRef.current && cylinderRef.current) {
          // Remove old cylinder
          sceneRef.current.remove(cylinderRef.current);
          
          // Create front cylinder (outside faces)
          const frontCylinder = new THREE.Mesh(geometryRef.current.clone(), frontMaterial);
          frontCylinder.scale.copy(cylinderRef.current.scale);
          frontCylinder.rotation.copy(cylinderRef.current.rotation);
          frontCylinder.position.copy(cylinderRef.current.position);
          
          // Create reverse cylinder - same position, showing back portion of texture
          const reverseCylinder = new THREE.Mesh(geometryRef.current.clone(), reverseMaterial);
          reverseCylinder.scale.copy(cylinderRef.current.scale);
          reverseCylinder.rotation.copy(cylinderRef.current.rotation);
          reverseCylinder.position.copy(cylinderRef.current.position);
          reverseCylinder.position.z -= 0.01; // Slightly behind to avoid z-fighting
          
          // Create group to hold both
          const cylinderGroup = new THREE.Group();
          cylinderGroup.add(frontCylinder);
          cylinderGroup.add(reverseCylinder);
          
          // Add group to scene
          sceneRef.current.add(cylinderGroup);
          cylinderRef.current = cylinderGroup; // Update reference
          
          console.log('🎨 Dual-sided texture applied to cylinder (front + reverse)');
          
          // Re-render with texture
          if (rendererRef.current && sceneRef.current && camera) {
            rendererRef.current.render(sceneRef.current, camera);
            console.log('🔄 Scene re-rendered with dual-sided texture');
          }
        } else {
          console.error('❌ Cannot apply texture: geometryRef.current or cylinderRef.current is undefined');
          console.log('🔍 Debug - geometryRef.current:', geometryRef.current);
          console.log('🔍 Debug - cylinderRef.current:', cylinderRef.current);
        }
      },
      (progress) => {
        console.log('📥 Texture loading progress:', (progress.loaded / progress.total * 100).toFixed(1) + '%');
      },
      (error) => {
        console.error('❌ Failed to load texture:', error);
        
        // If Phase 1 texture failed, try fallback to hardcoded texture
        if (textureSource && textureSource !== ASSET_PATHS.TEXTURE_IMAGE) {
          console.log('🔄 Phase 1 texture failed, falling back to hardcoded texture...');
          textureLoader.load(
            ASSET_PATHS.TEXTURE_IMAGE,
            (fallbackTexture) => {
              console.log('✅ Fallback texture loaded successfully');
              // Rerun the same processing logic as above
              originalTextureRef.current = fallbackTexture;
              setTextureLoaded(true);
              // Note: This would need the same processing logic, but for simplicity
              // we'll just apply a basic material here
              const basicMaterial = new THREE.MeshBasicMaterial({
                map: fallbackTexture,
                transparent: true,
                opacity: 0.8
              });
              if (cylinderRef.current) {
                cylinderRef.current.material = basicMaterial;
                console.log('🔧 Applied fallback texture material');
              }
            },
            undefined,
            (fallbackError) => {
              console.error('❌ Fallback texture also failed:', fallbackError);
              // Final fallback to colored material
              const errorMaterial = new THREE.MeshBasicMaterial({ 
                color: 0xff6b6b,  // Light red color
                wireframe: false
              });
              if (cylinderRef.current) {
                cylinderRef.current.material = errorMaterial;
                console.log('🔧 Applied final fallback colored material');
              }
            }
          );
        } else {
          // Fallback to colored material
          const fallbackMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6b6b,  // Light red color
            wireframe: false
          });
          
          if (cylinderRef.current) {
            cylinderRef.current.material = fallbackMaterial;
            console.log('🔧 Applied fallback material');
          }
        }
      }
    );
    
    // Temporary material while texture loads
    const loadingMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xcccccc,  // Light gray
      wireframe: false
    });

    // Reference objects removed for cleaner view

    // 6. Create Mesh with loading material and Add to Scene
    const cylinder = new THREE.Mesh(geometry, loadingMaterial);
    scene.add(cylinder);
    cylinderRef.current = cylinder;
    geometryRef.current = geometry;

    // 7. No rim wireframes - clean view
    topEdgeRef.current = null;
    bottomEdgeRef.current = null;
    rimGeometryRef.current = null;

    console.log('✅ Cylinder added to scene with edge wireframes');

    // 8. Render the scene
    const render = () => {
      renderer.render(scene, camera);
    };

    render();
    setIsLoading(false);

    console.log('🎯 Initial render complete');

    // Cleanup function
    return () => {
      if (geometry) geometry.dispose();
      if (loadingMaterial) loadingMaterial.dispose();
      if (cylinderRef.current && cylinderRef.current.material) {
        if (cylinderRef.current.material.map) {
          cylinderRef.current.material.map.dispose();
        }
        cylinderRef.current.material.dispose();
      }
      if (renderer) renderer.dispose();
    };

  }, [textureSource]); // Re-run when textureSource changes (Phase 1 integration)

  // Store original texture for reprocessing - MUST be before any useEffect that uses it
  const originalTextureRef = useRef(null);

  // Debug canvas initialization
  useEffect(() => {
    if (!debugCanvasRef.current || !originalTextureRef.current) return;
    
    console.log('🔍 Initializing debug cylinder...');
    
    // Create debug scene
    const debugScene = new THREE.Scene();
    debugScene.background = new THREE.Color(0xf0f0f0);
    debugSceneRef.current = debugScene;
    
    // Create debug camera (same as main)
    const debugCamera = new THREE.PerspectiveCamera(
      cameraFOV,
      canvasSize.width / canvasSize.height,
      0.1,
      2000
    );
    
    // Position camera (same as main)
    const cameraDistance = calculateCameraDistance(dimensions?.radius || 50);
    debugCamera.position.set(0, 0, cameraDistance);
    debugCamera.lookAt(0, 0, 0);
    
    // Create debug renderer
    const debugRenderer = new THREE.WebGLRenderer({
      canvas: debugCanvasRef.current,
      alpha: true,
      antialias: true
    });
    debugRenderer.setSize(canvasSize.width, canvasSize.height);
    debugRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    debugRendererRef.current = debugRenderer;
    
    // Create simple cylinder with raw texture
    const cylinderHeight = 100;
    const dims = calculateCylinderDimensions(cylinderHeight);
    
    const debugGeometry = new THREE.CylinderGeometry(
      dims.radius,
      dims.radius,
      dims.height,
      32,
      1,
      true // Open ended
    );
    
    // Create raw texture (no processing)
    const debugTexture = originalTextureRef.current.clone();
    debugTexture.wrapS = THREE.RepeatWrapping;
    debugTexture.wrapT = THREE.ClampToEdgeWrapping;
    debugTexture.repeat.set(1, 1);  // Natural wrap
    // Offset by 0.376 (0.473 - 0.097) to rotate another 35° counter-clockwise
    // 35° = 35/360 = 0.097, so 0.473 - 0.097 = 0.376
    // Total rotation: 135° CCW to place seam at back center
    debugTexture.offset.set(0.376, 0);
    
    // Simple material with DoubleSide
    const debugMaterial = new THREE.MeshBasicMaterial({
      map: debugTexture,
      side: THREE.DoubleSide,
      transparent: false
    });
    
    // Create debug cylinder
    const debugCylinder = new THREE.Mesh(debugGeometry, debugMaterial);
    debugScene.add(debugCylinder);
    debugCylinderRef.current = debugCylinder;
    
    // Add lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    debugScene.add(ambientLight);
    
    // Render debug scene
    debugRenderer.render(debugScene, debugCamera);
    
    console.log('✅ Debug cylinder initialized with raw texture');
    
    return () => {
      if (debugGeometry) debugGeometry.dispose();
      if (debugMaterial) debugMaterial.dispose();
      if (debugTexture) debugTexture.dispose();
      if (debugRenderer) debugRenderer.dispose();
    };
  }, [textureLoaded, canvasSize, dimensions, cameraFOV]);

  // Update debug cylinder to match main cylinder transformations
  useEffect(() => {
    if (!debugCylinderRef.current || !debugRendererRef.current || !debugSceneRef.current) return;
    
    // Update debug cylinder transformations to match main
    debugCylinderRef.current.scale.set(scaleX, scaleY, 1);
    debugCylinderRef.current.rotation.x = tiltX;
    debugCylinderRef.current.rotation.y = rotateY;
    debugCylinderRef.current.position.set(modelX, modelY, 0);
    
    // Update debug camera to match main
    const debugCamera = new THREE.PerspectiveCamera(
      cameraFOV,
      canvasSize.width / canvasSize.height,
      0.1,
      2000
    );
    
    const baseCameraDistance = calculateCameraDistance(dimensions?.radius || 50);
    const finalCameraX = canvasX;
    const finalCameraY = canvasY + cameraY;
    const finalCameraZ = baseCameraDistance + cameraZ;
    
    debugCamera.position.set(finalCameraX, finalCameraY, finalCameraZ);
    debugCamera.lookAt(modelX + canvasX, modelY + canvasY, 0);
    
    // Update cylinder geometry if taper changed
    if (debugCylinderRef.current.geometry) {
      debugCylinderRef.current.geometry.dispose();
      const cylinderHeight = 100;
      const dims = calculateCylinderDimensions(cylinderHeight);
      
      const newGeometry = new THREE.CylinderGeometry(
        dims.radius * taperRatio,  // Top radius with taper
        dims.radius * baseWidth,   // Bottom radius with base width
        dims.height,
        32,
        1,
        true
      );
      debugCylinderRef.current.geometry = newGeometry;
    }
    
    // Render debug scene
    debugRendererRef.current.render(debugSceneRef.current, debugCamera);
    
  }, [scaleX, scaleY, tiltX, rotateY, taperRatio, baseWidth, modelX, modelY, 
      canvasX, canvasY, cameraY, cameraZ, cameraFOV, dimensions, canvasSize]);

  // Function to reprocess texture with current blur/grain settings
  const reprocessTexture = () => {
    if (!originalTextureRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalTextureRef.current.image.width;
    canvas.height = originalTextureRef.current.image.height;
    
    // Draw the full texture - UV mapping handles front vs back positioning
    ctx.drawImage(originalTextureRef.current.image, 0, 0);
    
    // Apply front blur (reverse side will use same base texture with different UV)
    const blur = frontBlur;
    console.log(`🔍 Applying ${blur}px blur to base texture`);
    if (blur > 0) {
      console.log(`🔄 Applying ${blur}px blur to base texture`);
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      
      // Draw blurred version to temp canvas
      tempCtx.filter = `blur(${blur}px)`;
      tempCtx.drawImage(canvas, 0, 0);
      
      // Clear original and draw blurred version back
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    }

    // No masking needed - UV mapping handles visibility
    
    // Get image data and process pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const whiteThreshold = PROCESSING_CONSTANTS.WHITE_THRESHOLD;
    const grayThreshold = PROCESSING_CONSTANTS.GRAY_THRESHOLD;
    const darkenFactor = PROCESSING_CONSTANTS.FRONT_DARKEN_FACTOR;
    const grain = frontGrain;
    
    // Process pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      
      if (brightness > whiteThreshold) {
        data[i + 3] = 0; // Transparent
      } else if (brightness > grayThreshold) {
        data[i + 3] = 0; // Transparent
      } else {
        data[i] = Math.floor(r * darkenFactor);
        data[i + 1] = Math.floor(g * darkenFactor);
        data[i + 2] = Math.floor(b * darkenFactor);
      }
    }
    
    // Apply grain
    if (grain > 0) {
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) {
          const grainValue = (Math.random() - 0.5) * grain * 50;
          data[i] = Math.max(0, Math.min(255, data[i] + grainValue));
          data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + grainValue));
          data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + grainValue));
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create new texture
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.wrapS = THREE.RepeatWrapping;
    newTexture.wrapT = THREE.ClampToEdgeWrapping;
    newTexture.minFilter = THREE.LinearFilter;
    newTexture.magFilter = THREE.LinearFilter;
    
    // Apply front-view UV mapping (reverse side will be handled separately)
    const sceneParams = {
      cylinderRadius: dimensions.radius,
      cameraDistance: calculateCameraDistance(dimensions.radius),
      cameraFOV: cameraFOV
    };
    
    const uvMapping = getCompleteUVMapping(sceneParams, {
      frontVisible: 0.4,
      backVisible: 0.4
    });
    
    // Apply front-view UV mapping
    newTexture.repeat.set(uvMapping.front.repeat, 1);
    newTexture.offset.set(uvMapping.front.offset, 0);
    
    return newTexture;
  };

  // Function to update materials with current settings
  const updateMaterials = () => {
    if (cylinderRef.current && cylinderRef.current.isGroup) {
      const frontCylinder = cylinderRef.current.children[0];
      const backCylinder = cylinderRef.current.children[1];
      
      if (frontCylinder && frontCylinder.material) {
        frontCylinder.material.opacity = frontOpacity;
        
        // Update texture with current blur/grain settings
        const newBaseTexture = reprocessTexture();
        if (newBaseTexture) {
          // Update front material
          if (frontCylinder.material.map) {
            frontCylinder.material.map.dispose();
          }
          frontCylinder.material.map = newBaseTexture;
          frontCylinder.material.needsUpdate = true;
          
          // Update back material with SAME texture but different UV mapping
          if (backCylinder && backCylinder.material) {
            backCylinder.material.opacity = reverseOpacity;
            
            if (backCylinder.material.map) {
              backCylinder.material.map.dispose();
            }
            
            // Clone the same base texture for reverse side
            const reverseTexture = newBaseTexture.clone();
            
            // Apply back-view UV mapping
            const sceneParams = {
              cylinderRadius: dimensions.radius,
              cameraDistance: calculateCameraDistance(dimensions.radius),
              cameraFOV: cameraFOV
            };
            
            const uvMapping = getCompleteUVMapping(sceneParams, {
              frontVisible: 0.4,
              backVisible: 0.4
            });
            
            reverseTexture.repeat.set(uvMapping.back.repeat, 1);
            reverseTexture.offset.set(uvMapping.back.offset, 0);
            
            backCylinder.material.map = reverseTexture;
            backCylinder.material.needsUpdate = true;
          }
        }
      }
      
      console.log(`🎨 Materials updated: front(opacity=${frontOpacity}, blur=${frontBlur}, grain=${frontGrain}), reverse(opacity=${reverseOpacity}, blur=${reverseBlur}, grain=${reverseGrain})`);
    }
  };

  // Transform and camera change effect
  useEffect(() => {
    if (cylinderRef.current && rendererRef.current && sceneRef.current && dimensions) {
      // Update geometry for taper ratio and base width
      if (geometryRef.current) {
        const topRadius = dimensions.radius * taperRatio;  // Taper affects top
        const bottomRadius = dimensions.radius * baseWidth; // Base width affects bottom
        
        // Update main cylinder geometry
        geometryRef.current.dispose(); // Clean up old geometry
        const newGeometry = new THREE.CylinderGeometry(
          topRadius,     // Top radius (narrower for rocks glass)
          bottomRadius,  // Bottom radius (wider for rocks glass)
          dimensions.height,
          THREEJS_CONFIG.CYLINDER_RADIAL_SEGMENTS,
          THREEJS_CONFIG.CYLINDER_HEIGHT_SEGMENTS,
          THREEJS_CONFIG.OPEN_ENDED
        );
        cylinderRef.current.geometry = newGeometry;
        geometryRef.current = newGeometry;
        
        // No rim wireframe updates needed
      }
      
      // Apply scale, rotation, and position to cylinder (now a group)
      if (cylinderRef.current) {
        cylinderRef.current.scale.set(scaleX, scaleY, 1);
        cylinderRef.current.rotation.x = tiltX;
        cylinderRef.current.rotation.y = rotateY;
        cylinderRef.current.position.set(modelX, modelY, 0);
        
        // If it's a group, update children geometries
        if (cylinderRef.current.isGroup) {
          cylinderRef.current.children.forEach(child => {
            if (child.geometry && geometryRef.current) {
              child.geometry = geometryRef.current.clone();
            }
          });
        }
      }
      
      // No rim wireframe to update
      
      // Calculate camera position (canvas offset + camera axis movements for viewing angles)
      const baseCameraDistance = calculateCameraDistance(dimensions.radius);
      const finalCameraX = canvasX;
      const finalCameraY = canvasY + cameraY; // Camera Y-axis moves camera up/down
      const finalCameraZ = baseCameraDistance + cameraZ; // Camera Z-axis moves camera forward/back
      
      // Log current values for easy copying
      console.log(`🔧 Transform updated: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, tiltX=${tiltX.toFixed(3)} rad (${(tiltX * 180/Math.PI).toFixed(1)}°), rotateY=${rotateY.toFixed(3)} rad (${(rotateY * 180/Math.PI).toFixed(1)}°), taperRatio=${taperRatio.toFixed(3)}, baseWidth=${baseWidth.toFixed(3)}`);
      console.log(`📍 3D position: X=${modelX.toFixed(3)}, Y=${modelY.toFixed(3)} | Canvas position: X=${canvasX.toFixed(3)}, Y=${canvasY.toFixed(3)}`);
      console.log(`📷 Camera: FOV=${cameraFOV}°, Y-axis=${cameraY.toFixed(3)}, Z-axis=${cameraZ.toFixed(3)}, Final Position=(${finalCameraX.toFixed(1)}, ${finalCameraY.toFixed(1)}, ${finalCameraZ.toFixed(1)})`);
      console.log(`📋 Copy for defaults: const defaultScaleX = ${scaleX.toFixed(3)}; const defaultScaleY = ${scaleY.toFixed(3)}; const defaultTiltX = ${tiltX.toFixed(3)}; const defaultRotateY = ${rotateY.toFixed(3)}; const defaultTaperRatio = ${taperRatio.toFixed(3)}; const defaultBaseWidth = ${baseWidth.toFixed(3)}; const defaultModelX = ${modelX.toFixed(3)}; const defaultModelY = ${modelY.toFixed(3)}; const defaultCanvasX = ${canvasX.toFixed(3)}; const defaultCanvasY = ${canvasY.toFixed(3)}; const defaultCameraY = ${cameraY.toFixed(3)}; const defaultCameraZ = ${cameraZ.toFixed(3)}; const defaultCameraFOV = ${cameraFOV};`);
      
      // Create and position camera (Z-axis movement changes viewing angle)
      const camera = new THREE.PerspectiveCamera(cameraFOV, canvasSize.width / canvasSize.height, THREEJS_CONFIG.CAMERA_NEAR, THREEJS_CONFIG.CAMERA_FAR);
      camera.position.set(finalCameraX, finalCameraY, finalCameraZ);
      camera.lookAt(modelX + canvasX, modelY + canvasY, 0); // Look at model center adjusted for canvas position
      
      // Update material opacities
      updateMaterials();
      
      rendererRef.current.render(sceneRef.current, camera);
      
    }
  }, [scaleX, scaleY, tiltX, rotateY, taperRatio, baseWidth, modelX, modelY, canvasX, canvasY, cameraY, cameraZ, cameraFOV, frontOpacity, frontBlur, frontGrain, reverseOpacity, reverseBlur, reverseGrain, canvasSize.width, canvasSize.height, dimensions]);

  // Simplified view for Step 3 integration
  if (hideControls) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minHeight: '400px'
      }}>
        {isLoading && <p style={{ color: '#666' }}>Loading 3D preview...</p>}
        <canvas 
          ref={canvasRef}
          style={{ 
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        />
      </div>
    );
  }

  // Full development view for ?test=cylinder
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Cylinder Map Test - Phase C</h1>
      
      {isLoading && <p>Initializing Three.js scene...</p>}
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Canvases Container */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Canvas */}
          <div style={{ 
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <h3 style={{ margin: '10px', fontSize: '14px', color: '#333' }}>
              Main Model (Processed Texture with UV Offsets)
            </h3>
            <canvas 
              ref={canvasRef}
              style={{ 
                display: 'block',
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`
              }}
            />
          </div>
          
          {/* Debug Canvas - Raw texture reference */}
          <div style={{ 
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <h3 style={{ margin: '10px', fontSize: '14px', color: '#666' }}>
              Debug Reference (Raw Texture - No Processing, No UV Offset)
            </h3>
            <canvas 
              ref={debugCanvasRef}
              style={{ 
                display: 'block',
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`
              }}
            />
          </div>
        </div>
        
        {/* Controls */}
        <ControlPanel 
          controls={{
            scaleX, scaleY, tiltX, rotateY, taperRatio, baseWidth,
            modelX, modelY, canvasX, canvasY,
            cameraFOV, cameraY, cameraZ,
            frontOpacity, frontBlur, frontGrain,
            reverseOpacity, reverseBlur, reverseGrain
          }}
          setters={{
            setScaleX, setScaleY, setTiltX, setRotateY, setTaperRatio, setBaseWidth,
            setModelX, setModelY, setCanvasX, setCanvasY,
            setCameraFOV, setCameraY, setCameraZ,
            setFrontOpacity, setFrontBlur, setFrontGrain,
            setReverseOpacity, setReverseBlur, setReverseGrain
          }}
          canvasHeight={canvasSize.height}
        />
      </div>
    </div>
  );
};

export default CylinderMapTest;