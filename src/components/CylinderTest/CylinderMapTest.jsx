import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { calculateCylinderDimensions, calculateCameraDistance } from './utils/cylinderMath';

const CylinderMapTest = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cylinderRef = useRef(null);
  const topEdgeRef = useRef(null);
  const bottomEdgeRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scaleX, setScaleX] = useState(1.0);
  const [scaleY, setScaleY] = useState(1.0);
  const [tiltX, setTiltX] = useState(0.0); // Forward/backward tilt in radians

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

    // 7. Create Rim Border Wireframes (actual cylinder edge)
    // Use wireframe cylinder to show the exact edges
    const rimGeometry = new THREE.CylinderGeometry(
      dims.radius,  // Same radius as main cylinder
      dims.radius,  
      dims.height,  // Same height
      32,          // Same segments
      1,           
      false        
    );
    
    // Wireframe material for rim visualization
    const rimMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000, 
      wireframe: true,
      transparent: true, 
      opacity: 0.6
    });
    
    // Create rim wireframe mesh
    const rimWireframe = new THREE.Mesh(rimGeometry, rimMaterial);
    
    // Add rim to scene and store reference
    scene.add(rimWireframe);
    topEdgeRef.current = rimWireframe; // Reuse ref for rim wireframe
    bottomEdgeRef.current = null; // Not needed anymore

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

  // Scale and tilt change effect
  useEffect(() => {
    if (cylinderRef.current && rendererRef.current && sceneRef.current) {
      // Apply scale and rotation to cylinder
      cylinderRef.current.scale.set(scaleX, scaleY, 1);
      cylinderRef.current.rotation.x = tiltX;
      
      // Apply same transformations to rim wireframe
      if (topEdgeRef.current) {
        topEdgeRef.current.scale.set(scaleX, scaleY, 1);
        topEdgeRef.current.rotation.x = tiltX;
      }
      
      // Log current values for easy copying
      console.log(`🔧 Transform updated: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}, tiltX=${tiltX.toFixed(3)} rad (${(tiltX * 180/Math.PI).toFixed(1)}°)`);
      console.log(`📋 Copy for defaults: const defaultScaleX = ${scaleX.toFixed(3)}; const defaultScaleY = ${scaleY.toFixed(3)}; const defaultTiltX = ${tiltX.toFixed(3)};`);
      
      // Re-render
      const camera = new THREE.PerspectiveCamera(75, canvasSize.width / canvasSize.height, 0.1, 2000);
      const cameraDistance = calculateCameraDistance(dimensions?.radius || 50);
      camera.position.set(0, 0, cameraDistance);
      camera.lookAt(0, 0, 0);
      
      rendererRef.current.render(sceneRef.current, camera);
    }
  }, [scaleX, scaleY, tiltX, canvasSize.width, canvasSize.height, dimensions]);

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

      {/* Scale Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '4px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>🎯 Cylinder Scale Controls</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Width Scale (X): {scaleX.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.01"
            value={scaleX}
            onChange={(e) => setScaleX(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            (0.1 - 3.0)
          </span>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Height Scale (Y): {scaleY.toFixed(3)}
          </label>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.01"
            value={scaleY}
            onChange={(e) => setScaleY(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            (0.1 - 3.0)
          </span>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Forward Tilt: {(tiltX * 180/Math.PI).toFixed(1)}° ({tiltX.toFixed(3)} rad)
          </label>
          <input
            type="range"
            min="-0.785"
            max="0.785"
            step="0.01"
            value={tiltX}
            onChange={(e) => setTiltX(parseFloat(e.target.value))}
            style={{ width: '300px' }}
          />
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            (-45° to +45°)
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#856404' }}>
          <p><strong>Instructions:</strong></p>
          <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
            <li>Adjust <strong>Width/Height scales</strong> to match cylinder size with glass outline</li>
            <li>Adjust <strong>Forward Tilt</strong> to match the glass perspective angle</li>
            <li><strong>Red wireframe</strong> shows exact cylinder rim edges aligned with texture</li>
            <li>Check browser console for exact values to copy for new defaults</li>
            <li>All transformations apply to both cylinder and rim wireframe together</li>
          </ul>
        </div>
      </div>
      
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