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
import ControlPanel from './components/ControlPanel';

const CylinderMapTest = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cylinderRef = useRef(null);
  const topEdgeRef = useRef(null);
  const bottomEdgeRef = useRef(null);
  const geometryRef = useRef(null);
  const rimGeometryRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: UI_CONSTANTS.MAX_DISPLAY_WIDTH, height: UI_CONSTANTS.MAX_DISPLAY_HEIGHT });
  
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
    console.log('🖼️ Loading texture...');
    
    textureLoader.load(
      ASSET_PATHS.TEXTURE_IMAGE,
      (texture) => {
        console.log('✅ Texture loaded successfully:', texture.image.width, 'x', texture.image.height);
        
        // Store original texture for reprocessing
        originalTextureRef.current = texture;
        
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
        
        // Configure texture for cylindrical wrapping
        processedTexture.wrapS = THREE.RepeatWrapping;      // Horizontal wrap around cylinder
        processedTexture.wrapT = THREE.ClampToEdgeWrapping; // Vertical clamp (top to bottom)
        processedTexture.minFilter = THREE.LinearFilter;    // Smooth scaling down
        processedTexture.magFilter = THREE.LinearFilter;    // Smooth scaling up
        
        console.log('🔧 Processed texture configured for cylindrical mapping');
        
        // Create front side material with dynamic opacity
        const frontMaterial = new THREE.MeshBasicMaterial({ 
          map: processedTexture,
          transparent: true,
          opacity: frontOpacity,
          side: THREE.FrontSide   // Only front-facing surfaces
        });

        // Process image for reverse side - show the back portion that wraps around
        const reverseCanvas = document.createElement('canvas');
        const reverseCtx = reverseCanvas.getContext('2d');
        reverseCanvas.width = texture.image.width;
        reverseCanvas.height = texture.image.height;
        
        // Calculate what portion of texture is visible on back side
        // When cylinder rotates, different portions become visible on front vs back
        const textureWidth = texture.image.width;
        const halfWidth = textureWidth / 2;
        
        // Draw the back half of the texture, horizontally flipped
        reverseCtx.scale(-1, 1); // Flip horizontally 
        reverseCtx.drawImage(
          texture.image, 
          halfWidth, 0, halfWidth, texture.image.height, // Source: right half of texture
          -halfWidth, 0, halfWidth, texture.image.height  // Dest: left half, flipped
        );
        reverseCtx.drawImage(
          texture.image,
          0, 0, halfWidth, texture.image.height, // Source: left half of texture  
          -textureWidth, 0, halfWidth, texture.image.height // Dest: right half, flipped
        );
        reverseCtx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        
        // Apply reverse blur
        applyBlur(reverseCtx, reverseCanvas, reverseBlur);
        
        // Mask out the bottom area that corresponds to the bottom face of the cylinder
        // The bottom portion of the texture should be completely transparent on reverse side
        const imageHeight = reverseCanvas.height;
        const bottomMaskHeight = imageHeight * PROCESSING_CONSTANTS.BOTTOM_MASK_HEIGHT_RATIO;
        
        // Create solid mask for bottom area - NO GRADIENTS, complete removal
        reverseCtx.globalCompositeOperation = 'destination-out'; // Remove pixels
        reverseCtx.fillStyle = 'rgba(0,0,0,1)'; // Solid black = complete removal
        reverseCtx.fillRect(0, imageHeight - bottomMaskHeight, reverseCanvas.width, bottomMaskHeight);
        reverseCtx.globalCompositeOperation = 'source-over'; // Reset to normal
        
        // Get image data for reverse processing
        const reverseImageData = reverseCtx.getImageData(0, 0, reverseCanvas.width, reverseCanvas.height);
        const reverseData = reverseImageData.data;
        
        // Reverse side processing (lighter, more subtle effect)
        const reverseWhiteThreshold = 200; // Higher threshold (more aggressive removal)
        const reverseGrayThreshold = 160;  // Higher threshold (remove more grays)
        const reverseDarkenFactor = 0.6;   // Less darkening (40% vs 60%)
        
        let reverseProcessedPixels = 0;
        let reverseDarkenedPixels = 0;
        
        for (let i = 0; i < reverseData.length; i += 4) {
          const r = reverseData[i];
          const g = reverseData[i + 1];
          const b = reverseData[i + 2];
          
          const brightness = (r + g + b) / 3;
          
          if (brightness > reverseWhiteThreshold) {
            reverseData[i + 3] = 0; // Transparent
            reverseProcessedPixels++;
          } else if (brightness > reverseGrayThreshold) {
            reverseData[i + 3] = 0; // Transparent
            reverseProcessedPixels++;
          } else {
            // Less darkening for reverse side (more subtle)
            reverseData[i] = Math.floor(r * reverseDarkenFactor);
            reverseData[i + 1] = Math.floor(g * reverseDarkenFactor);
            reverseData[i + 2] = Math.floor(b * reverseDarkenFactor);
            reverseDarkenedPixels++;
          }
        }
        
        // Apply grain to reverse side
        applyGrain(reverseImageData, reverseGrain);
        
        reverseCtx.putImageData(reverseImageData, 0, 0);
        
        console.log(`🔄 Reverse: ${reverseProcessedPixels} pixels transparent, ${reverseDarkenedPixels} pixels darkened, blur: ${reverseBlur}px, grain: ${reverseGrain}`);
        
        // Create reverse side texture and material
        const reverseTexture = new THREE.CanvasTexture(reverseCanvas);
        reverseTexture.wrapS = THREE.RepeatWrapping;
        reverseTexture.wrapT = THREE.ClampToEdgeWrapping;
        reverseTexture.minFilter = THREE.LinearFilter;
        reverseTexture.magFilter = THREE.LinearFilter;
        
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

  }, []);

  // Store original texture for reprocessing
  const originalTextureRef = useRef(null);

  // Function to reprocess texture with current blur/grain settings
  const reprocessTexture = (isReverse = false) => {
    if (!originalTextureRef.current) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalTextureRef.current.image.width;
    canvas.height = originalTextureRef.current.image.height;
    
    if (isReverse) {
      // For reverse side, show the back portion of the texture, horizontally flipped
      const textureWidth = originalTextureRef.current.image.width;
      const halfWidth = textureWidth / 2;
      
      ctx.scale(-1, 1); // Flip horizontally 
      ctx.drawImage(
        originalTextureRef.current.image, 
        halfWidth, 0, halfWidth, originalTextureRef.current.image.height, // Source: right half
        -halfWidth, 0, halfWidth, originalTextureRef.current.image.height  // Dest: left half, flipped
      );
      ctx.drawImage(
        originalTextureRef.current.image,
        0, 0, halfWidth, originalTextureRef.current.image.height, // Source: left half
        -textureWidth, 0, halfWidth, originalTextureRef.current.image.height // Dest: right half, flipped
      );
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    } else {
      // Draw original image for front side
      ctx.drawImage(originalTextureRef.current.image, 0, 0);
    }
    
    // Apply blur
    const blur = isReverse ? reverseBlur : frontBlur;
    console.log(`🔍 Blur debug - isReverse: ${isReverse}, blur value: ${blur}, reverseBlur: ${reverseBlur}, frontBlur: ${frontBlur}`);
    if (blur > 0) {
      console.log(`🔄 Applying ${blur}px blur to ${isReverse ? 'reverse' : 'front'} texture`);
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

    // Only mask reverse side, not front side
    if (isReverse) {
      const imageHeight = canvas.height;
      const bottomMaskHeight = imageHeight * 0.05; // Bottom 5% represents the bottom face area
      
      // Create solid mask for bottom area - complete removal
      ctx.globalCompositeOperation = 'destination-out'; // Remove pixels
      ctx.fillStyle = 'rgba(0,0,0,1)'; // Solid black = complete removal
      ctx.fillRect(0, imageHeight - bottomMaskHeight, canvas.width, bottomMaskHeight);
      ctx.globalCompositeOperation = 'source-over'; // Reset to normal
    }
    
    // Get image data and process pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const whiteThreshold = PROCESSING_CONSTANTS.WHITE_THRESHOLD;
    const grayThreshold = PROCESSING_CONSTANTS.GRAY_THRESHOLD;
    const darkenFactor = isReverse ? PROCESSING_CONSTANTS.REVERSE_DARKEN_FACTOR : PROCESSING_CONSTANTS.FRONT_DARKEN_FACTOR;
    const grain = isReverse ? reverseGrain : frontGrain;
    
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
    
    return newTexture;
  };

  // Function to update materials with current settings
  const updateMaterials = () => {
    if (cylinderRef.current && cylinderRef.current.isGroup) {
      const frontCylinder = cylinderRef.current.children[0];
      const backCylinder = cylinderRef.current.children[1];
      
      if (frontCylinder && frontCylinder.material) {
        frontCylinder.material.opacity = frontOpacity;
        
        // Update front texture with current blur/grain
        const newFrontTexture = reprocessTexture(false);
        if (newFrontTexture) {
          if (frontCylinder.material.map) {
            frontCylinder.material.map.dispose();
          }
          frontCylinder.material.map = newFrontTexture;
          frontCylinder.material.needsUpdate = true;
        }
      }
      
      if (backCylinder && backCylinder.material) {
        backCylinder.material.opacity = reverseOpacity;
        
        // Update reverse texture with current blur/grain
        const newReverseTexture = reprocessTexture(true);
        if (newReverseTexture) {
          if (backCylinder.material.map) {
            backCylinder.material.map.dispose();
          }
          backCylinder.material.map = newReverseTexture;
          backCylinder.material.needsUpdate = true;
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

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Cylinder Map Test - Phase C</h1>
      
      {isLoading && <p>Initializing Three.js scene...</p>}
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div style={{ 
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden',
          flex: '0 0 auto'
        }}>
          <canvas 
            ref={canvasRef}
            style={{ 
              display: 'block',
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`
            }}
          />
        </div>
        
        {/* Controls */}
        <div style={{ 
          minWidth: '250px',
          maxWidth: '300px',
          maxHeight: `${canvasSize.height}px`,
          overflowY: 'auto',
          padding: '10px',
          border: '1px solid #eee',
          borderRadius: '4px',
          backgroundColor: '#fafafa'
        }}>
          {/* Scale Controls */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Scale</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Width: {scaleX.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.01"
                value={scaleX}
                onChange={(e) => setScaleX(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Height: {scaleY.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.01"
                value={scaleY}
                onChange={(e) => setScaleY(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Tilt: {(tiltX * 180/Math.PI).toFixed(1)}°
              </label>
              <input
                type="range"
                min="-0.785"
                max="0.785"
                step="0.01"
                value={tiltX}
                onChange={(e) => setTiltX(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Rotate: {(rotateY * 180/Math.PI).toFixed(1)}°
              </label>
              <input
                type="range"
                min="-0.785"
                max="0.785"
                step="0.01"
                value={rotateY}
                onChange={(e) => setRotateY(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Taper: {taperRatio.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.01"
                value={taperRatio}
                onChange={(e) => setTaperRatio(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Base Width: {baseWidth.toFixed(3)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.01"
                value={baseWidth}
                onChange={(e) => setBaseWidth(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>
          </div>

          {/* 3D Position Controls */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>3D Position</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                X: {modelX.toFixed(0)}
              </label>
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={modelX}
                onChange={(e) => setModelX(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Y: {modelY.toFixed(0)}
              </label>
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={modelY}
                onChange={(e) => setModelY(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>
          </div>

          {/* Canvas Position Controls */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Canvas Position</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Horizontal: {canvasX.toFixed(0)}
              </label>
              <input
                type="range"
                min="-300"
                max="300"
                step="1"
                value={canvasX}
                onChange={(e) => setCanvasX(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Vertical: {canvasY.toFixed(0)}
              </label>
              <input
                type="range"
                min="-300"
                max="300"
                step="1"
                value={canvasY}
                onChange={(e) => setCanvasY(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>
          </div>

          {/* Camera Controls */}
          <div>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Camera</h3>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                FOV: {cameraFOV}°
              </label>
              <input
                type="range"
                min="10"
                max="90"
                step="1"
                value={cameraFOV}
                onChange={(e) => setCameraFOV(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Y-axis: {cameraY.toFixed(0)}
              </label>
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={cameraY}
                onChange={(e) => setCameraY(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Z-axis: {cameraZ.toFixed(0)}
              </label>
              <input
                type="range"
                min="-200"
                max="200"
                step="1"
                value={cameraZ}
                onChange={(e) => setCameraZ(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>
          </div>

          {/* Front Side Engraving Controls */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Front Side</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Opacity: {frontOpacity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={frontOpacity}
                onChange={(e) => setFrontOpacity(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Blur: {frontBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={frontBlur}
                onChange={(e) => setFrontBlur(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Grain: {frontGrain.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={frontGrain}
                onChange={(e) => setFrontGrain(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>
          </div>

          {/* Reverse Side Engraving Controls */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Reverse Side</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Opacity: {reverseOpacity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={reverseOpacity}
                onChange={(e) => setReverseOpacity(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Blur: {reverseBlur.toFixed(1)}px
              </label>
              <input
                type="range"
                min="0.0"
                max="5.0"
                step="0.1"
                value={reverseBlur}
                onChange={(e) => setReverseBlur(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                Grain: {reverseGrain.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={reverseGrain}
                onChange={(e) => setReverseGrain(parseFloat(e.target.value))}
                style={{ width: '220px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CylinderMapTest;