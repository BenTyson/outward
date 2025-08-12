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
  const geometryRef = useRef(null);
  const rimGeometryRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scaleX, setScaleX] = useState(1.000);
  const [scaleY, setScaleY] = useState(0.910);
  const [tiltX, setTiltX] = useState(0.574); // Forward/backward tilt in radians (32.9°)
  const [rotateY, setRotateY] = useState(-0.785); // Left/right rotation around Y-axis in radians (-45.0°)
  const [cameraFOV, setCameraFOV] = useState(22); // Camera field of view in degrees (75 = wide angle, 15 = telephoto)
  const [modelX, setModelX] = useState(4.0); // Model 3D position X (rotation around origin)
  const [modelY, setModelY] = useState(45.0); // Model 3D position Y (rotation around origin)
  const [canvasX, setCanvasX] = useState(0.0); // Canvas position X (horizontal translation)
  const [canvasY, setCanvasY] = useState(-3.0); // Canvas position Y (vertical translation)
  const [cameraZ, setCameraZ] = useState(200.0); // Camera Z-axis position (up/down viewing angle)
  const [cameraY, setCameraY] = useState(-35.0); // Camera Y-axis movement (up/down along Y-axis)
  const [taperRatio, setTaperRatio] = useState(0.940); // Bottom radius as ratio of top radius (1.0 = no taper, >1.0 = wider base)
  const [baseWidth, setBaseWidth] = useState(1.010); // Base width scale independent of taper

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
    geometryRef.current = geometry;

    // 7. Create Rim Border Wireframes (actual cylinder edge)
    // Use wireframe cylinder to show the exact edges (will be updated when taperRatio changes)
    const rimGeometry = new THREE.CylinderGeometry(
      dims.radius,  // Same radius as main cylinder
      dims.radius,  // Will be updated with taper
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
    
    // Add rim to scene and store references
    scene.add(rimWireframe);
    topEdgeRef.current = rimWireframe; // Reuse ref for rim wireframe
    bottomEdgeRef.current = null; // Not needed anymore
    rimGeometryRef.current = rimGeometry;

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

  // Transform and camera change effect
  useEffect(() => {
    if (cylinderRef.current && rendererRef.current && sceneRef.current && dimensions) {
      // Update geometry for taper ratio and base width
      if (geometryRef.current && rimGeometryRef.current) {
        const topRadius = dimensions.radius * taperRatio;  // Taper affects top
        const bottomRadius = dimensions.radius * baseWidth; // Base width affects bottom
        
        // Update main cylinder geometry
        geometryRef.current.dispose(); // Clean up old geometry
        const newGeometry = new THREE.CylinderGeometry(
          topRadius,     // Top radius (narrower for rocks glass)
          bottomRadius,  // Bottom radius (wider for rocks glass)
          dimensions.height,
          32,
          1,
          false
        );
        cylinderRef.current.geometry = newGeometry;
        geometryRef.current = newGeometry;
        
        // Update rim wireframe geometry
        rimGeometryRef.current.dispose(); // Clean up old geometry
        const newRimGeometry = new THREE.CylinderGeometry(
          topRadius,     // Top radius (narrower for rocks glass)
          bottomRadius,  // Bottom radius (wider for rocks glass)
          dimensions.height,
          32,
          1,
          false
        );
        topEdgeRef.current.geometry = newRimGeometry;
        rimGeometryRef.current = newRimGeometry;
      }
      
      // Apply scale, rotation, and position to cylinder
      cylinderRef.current.scale.set(scaleX, scaleY, 1);
      cylinderRef.current.rotation.x = tiltX;
      cylinderRef.current.rotation.y = rotateY; // Add Y-axis rotation
      cylinderRef.current.position.set(modelX, modelY, 0);
      
      // Apply same transformations to rim wireframe
      if (topEdgeRef.current) {
        topEdgeRef.current.scale.set(scaleX, scaleY, 1);
        topEdgeRef.current.rotation.x = tiltX;
        topEdgeRef.current.rotation.y = rotateY; // Add Y-axis rotation
        topEdgeRef.current.position.set(modelX, modelY, 0);
      }
      
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
      const camera = new THREE.PerspectiveCamera(cameraFOV, canvasSize.width / canvasSize.height, 0.1, 2000);
      camera.position.set(finalCameraX, finalCameraY, finalCameraZ);
      camera.lookAt(modelX + canvasX, modelY + canvasY, 0); // Look at model center adjusted for canvas position
      
      rendererRef.current.render(sceneRef.current, camera);
    }
  }, [scaleX, scaleY, tiltX, rotateY, taperRatio, baseWidth, modelX, modelY, canvasX, canvasY, cameraY, cameraZ, cameraFOV, canvasSize.width, canvasSize.height, dimensions]);

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Cylinder Map Test - Phase C</h1>
      
      {isLoading && <p>Initializing Three.js scene...</p>}
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Canvas */}
        <div style={{ 
          border: '1px solid #ddd',
          borderRadius: '4px',
          overflow: 'hidden'
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
        <div style={{ minWidth: '250px' }}>
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
        </div>
      </div>
    </div>
  );
};

export default CylinderMapTest;