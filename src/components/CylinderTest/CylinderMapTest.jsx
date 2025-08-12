import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { calculateCylinderDimensions, calculateCameraDistance } from './utils/cylinderMath';

const CylinderMapTest = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cylinderRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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
      '/glass-images/rocks-white.jpg',
      (backgroundTexture) => {
        const bgWidth = backgroundTexture.image.width;
        const bgHeight = backgroundTexture.image.height;
        const bgAspect = bgWidth / bgHeight;
        
        console.log(`✅ Background loaded: ${bgWidth}x${bgHeight} (aspect: ${bgAspect.toFixed(3)})`);
        
        // Calculate optimal canvas size based on background aspect ratio
        const maxDisplayWidth = 800;  // Maximum width for UI
        const maxDisplayHeight = 600; // Maximum height for UI
        
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
          camera.updateProjectionMatrix();
          console.log('📷 Camera aspect ratio updated');
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

    // 2. Create Camera (aspect ratio will be updated when background loads)
    const camera = new THREE.PerspectiveCamera(
      75, // Field of view
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

    // 4. Create Cylinder Geometry
    const geometry = new THREE.CylinderGeometry(
      dims.radius,  // Top radius
      dims.radius,  // Bottom radius
      dims.height,  // Height
      32,          // Radial segments (smooth)
      1,           // Height segments
      false        // Not open-ended
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
      '/glass-images/rocks-test-design-optimal.png',
      (texture) => {
        console.log('✅ Texture loaded successfully:', texture.image.width, 'x', texture.image.height);
        
        // Process image to remove white pixels
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        
        // Draw original image
        ctx.drawImage(texture.image, 0, 0);
        
        // Get image data and process pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let processedPixels = 0;
        const whiteThreshold = 240; // Pixels brighter than this become transparent
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Calculate brightness
          const brightness = (r + g + b) / 3;
          
          if (brightness > whiteThreshold) {
            // Make white pixels transparent
            data[i + 3] = 0; // Set alpha to 0
            processedPixels++;
          }
        }
        
        // Put processed data back
        ctx.putImageData(imageData, 0, 0);
        
        console.log(`🎨 Processed ${processedPixels} white pixels to transparent`);
        
        // Create new texture from processed canvas
        const processedTexture = new THREE.CanvasTexture(canvas);
        
        // Configure texture for cylindrical wrapping
        processedTexture.wrapS = THREE.RepeatWrapping;      // Horizontal wrap around cylinder
        processedTexture.wrapT = THREE.ClampToEdgeWrapping; // Vertical clamp (top to bottom)
        processedTexture.minFilter = THREE.LinearFilter;    // Smooth scaling down
        processedTexture.magFilter = THREE.LinearFilter;    // Smooth scaling up
        
        console.log('🔧 Processed texture configured for cylindrical mapping');
        
        // Create material with processed texture
        const material = new THREE.MeshBasicMaterial({ 
          map: processedTexture,
          transparent: true,
          opacity: 0.8,           // Realistic engraving transparency
          side: THREE.DoubleSide   // Visible from inside and outside
        });
        
        console.log('✅ Material created with white pixels removed');
        
        // Apply material to cylinder
        if (cylinderRef.current) {
          cylinderRef.current.material = material;
          console.log('🎨 Texture applied to cylinder');
          
          // Re-render with texture
          if (rendererRef.current && sceneRef.current && camera) {
            rendererRef.current.render(sceneRef.current, camera);
            console.log('🔄 Scene re-rendered with texture');
          }
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

    console.log('✅ Cylinder added to scene');

    // 7. Render the scene
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

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', color: '#333' }}>
        Cylinder Map Test - Phase C
      </h1>
      
      {isLoading && (
        <p style={{ color: '#666' }}>Initializing Three.js scene...</p>
      )}
      
      {dimensions && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Calculated Dimensions:</strong><br />
          Height: {dimensions.height} units<br />
          Radius: {dimensions.radius.toFixed(3)} units<br />
          Circumference: {dimensions.circumference.toFixed(3)} units<br />
          Aspect Ratio: {dimensions.aspectRatio.toFixed(3)} (9.92:3.46)
        </div>
      )}
      
      <div style={{ 
        border: '2px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white',
        display: 'inline-block'
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
      
      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666' 
      }}>
        <p>📊 <strong>Phase C Status:</strong> Glass background integration with cylinder overlay</p>
        <p>🔍 <strong>What you should see:</strong> Real rocks glass photo with map cylinder overlaid</p>
        <p>🖼️ <strong>Background:</strong> rocks-white.jpg (actual glass photograph)</p>
        <p>🎨 <strong>Cylinder:</strong> Map texture with white pixels removed (transparent)</p>
        <p>💡 <strong>Effect:</strong> Simulated laser engraving on real glass appearance</p>
        <p>🎯 <strong>Goal:</strong> Align 3D cylinder with glass outline in background</p>
      </div>
    </div>
  );
};

export default CylinderMapTest;