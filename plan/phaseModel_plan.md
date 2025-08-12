# Phase Model: Three.js Cylindrical Image Mapping

## Overview
Transition from horizontal strip rendering to true 3D cylindrical mapping using Three.js. This approach eliminates strip line artifacts by wrapping the image as a single texture around a cylinder geometry, then overlaying it on a glass background image.

---

## Core Concept

### **Problem Statement**
Despite implementing zero-overlap mathematics and binary conversion, horizontal strip lines persist due to fundamental limitations of the strip-based rendering approach.

### **Solution Approach**
- **Single texture mapping** - No horizontal strips or subdivisions
- **True 3D cylinder** - Mathematically accurate cylindrical projection
- **Glass overlay composite** - 3D mapped texture over realistic glass background
- **Aspect ratio precision** - Use measured glass proportions for accurate mapping

---

## Technical Specifications

### **Cylinder Dimensions (Critical)**
```javascript
// Measured aspect ratio: 3.46:9.92 wraps perfectly around glass at full height
const aspectRatio = 3.46 / 9.92; // ≈ 0.349

// Mathematical relationship: Circumference = aspectRatio * height
// For cylinder: Circumference = 2πr
// Therefore: 2πr = aspectRatio * height
const radius = (aspectRatio * height) / (2 * Math.PI);

// Example with height = 100 units:
const cylinderHeight = 100;
const cylinderRadius = (0.349 * 100) / (2 * Math.PI); // ≈ 5.55 units
```

### **Three.js Core Components**
```javascript
// Required imports
import * as THREE from 'three';

// Essential components:
1. Scene          // 3D world container
2. Camera         // Viewing perspective (PerspectiveCamera)
3. Renderer       // Canvas output (WebGLRenderer with alpha)
4. Geometry       // CylinderGeometry with calculated dimensions
5. Material       // MeshBasicMaterial with texture
6. Texture        // Image loaded via TextureLoader
7. Lighting       // Optional for realistic appearance
```

---

## Implementation Plan

### **Phase A: Basic Cylinder Setup**
**Objective**: Create Three.js scene with properly dimensioned cylinder

```javascript
// 1. Scene initialization
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ 
  alpha: true,           // Transparent background
  antialias: true        // Smooth edges
});

// 2. Cylinder geometry with precise dimensions
const geometry = new THREE.CylinderGeometry(
  cylinderRadius,        // Top radius (5.55 units)
  cylinderRadius,        // Bottom radius (same - straight cylinder)
  cylinderHeight,        // Height (100 units)
  32,                   // Radial segments (smoothness)
  1,                    // Height segments (simple)
  false                 // Closed ends
);

// 3. Camera positioning
camera.position.set(0, 0, distance);  // Front view
camera.lookAt(0, 0, 0);               // Look at cylinder center
```

### **Phase B: Texture Mapping**
**Objective**: Load and apply map image as cylinder texture

```javascript
// 1. Texture loading
const textureLoader = new THREE.TextureLoader();
const mapTexture = textureLoader.load('/glass-images/rocks-test-design-optimal.png');

// 2. Texture configuration
mapTexture.wrapS = THREE.RepeatWrapping;      // Horizontal wrap (around cylinder)
mapTexture.wrapT = THREE.ClampToEdgeWrapping; // Vertical clamp (top to bottom)
mapTexture.minFilter = THREE.LinearFilter;    // Smooth scaling
mapTexture.magFilter = THREE.LinearFilter;    // Smooth scaling

// 3. Material creation
const material = new THREE.MeshBasicMaterial({ 
  map: mapTexture,
  transparent: true,
  opacity: 0.8,          // Realistic engraving transparency
  side: THREE.DoubleSide  // Visible from inside and outside
});

// 4. Mesh creation and scene addition
const cylinderMesh = new THREE.Mesh(geometry, material);
scene.add(cylinderMesh);
```

### **Phase C: Glass Background Integration**
**Objective**: Composite 3D cylinder over realistic glass photograph

#### **Option 1: CSS Layer Approach**
```html
<div className="glass-container" style={{
  position: 'relative',
  backgroundImage: 'url(/glass-images/rocks-glass-photo.jpg)',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center'
}}>
  <canvas 
    ref={threeJsCanvas} 
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    }} 
  />
</div>
```

#### **Option 2: Three.js Background Plane**
```javascript
// Background plane for glass image
const glassGeometry = new THREE.PlaneGeometry(width, height);
const glassTexture = textureLoader.load('/glass-images/rocks-glass-photo.jpg');
const glassMaterial = new THREE.MeshBasicMaterial({ map: glassTexture });
const glassPlane = new THREE.Mesh(glassGeometry, glassMaterial);

// Position behind cylinder
glassPlane.position.z = -10;
scene.add(glassPlane);
```

### **Phase D: Positioning and Alignment**
**Objective**: Align 3D cylinder with glass in background image

```javascript
// 1. Cylinder rotation (show front face of wrapped image)
cylinderMesh.rotation.y = 0; // Adjust to show desired image portion

// 2. Camera distance (control field of view)
const optimalDistance = cylinderRadius * 10; // Adjust based on desired view
camera.position.z = optimalDistance;

// 3. Cylinder positioning (align with glass in background)
cylinderMesh.position.x = alignmentOffsetX; // Horizontal alignment
cylinderMesh.position.y = alignmentOffsetY; // Vertical alignment

// 4. Scale adjustments (match glass proportions in background)
const scaleX = glassWidthInBackground / cylinderDiameter;
const scaleY = glassHeightInBackground / cylinderHeight;
cylinderMesh.scale.set(scaleX, scaleY, 1);
```

---

## Architecture Design

### **File Structure**
```
src/components/CylinderTest/
├── CylinderMapTest.jsx           // Main component
├── hooks/
│   ├── useThreeScene.js          // Three.js scene management
│   ├── useCylinderGeometry.js    // Cylinder creation logic
│   └── useTextureLoader.js       // Texture loading utilities
├── utils/
│   ├── cylinderMath.js           // Aspect ratio calculations
│   ├── cameraUtils.js            // Camera positioning helpers
│   └── alignmentUtils.js         // Background alignment tools
└── components/
    ├── CylinderControls.jsx      // Rotation/position controls
    └── AlignmentGuides.jsx       // Visual alignment helpers
```

### **Component Architecture**
```javascript
// Main component structure
const CylinderMapTest = () => {
  // Hooks for Three.js management
  const { scene, camera, renderer } = useThreeScene();
  const { cylinder } = useCylinderGeometry(aspectRatio);
  const { texture } = useTextureLoader('/glass-images/rocks-test-design-optimal.png');
  
  // State for positioning controls
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState({ x: 1, y: 1 });
  
  // Render loop and controls
  return (
    <div className="cylinder-test-container">
      <div className="glass-background">
        <canvas ref={canvasRef} />
      </div>
      <CylinderControls 
        rotation={rotation}
        position={position}
        scale={scale}
        onRotationChange={setRotation}
        onPositionChange={setPosition}
        onScaleChange={setScale}
      />
    </div>
  );
};
```

---

## Expected Results

### **Visual Quality Improvements**
- **✅ No strip lines** - Single texture mapping eliminates horizontal artifacts
- **✅ Smooth curves** - True mathematical cylinder projection
- **✅ Realistic appearance** - Proper 3D perspective and glass overlay
- **✅ Interactive controls** - Real-time rotation and positioning
- **✅ Scalable approach** - Easy to adjust for different glass types

### **Technical Advantages**
- **Performance**: Single drawImage operation vs thousands of strip operations
- **Maintainability**: Clean Three.js architecture vs complex strip mathematics
- **Flexibility**: Easy rotation, scaling, and positioning controls
- **Accuracy**: True 3D projection vs approximated 2D transforms
- **Future-proof**: Foundation for advanced 3D glass simulation

### **Integration Points**
- **Phase 1 compatibility**: Use existing map configuration data
- **Glass type support**: Different cylinder dimensions for pint/wine/shot glasses
- **Export capability**: High-resolution renders for production
- **Real-time preview**: Interactive positioning and rotation

---

## Success Criteria

### **Functional Requirements**
- [ ] Cylinder renders with correct aspect ratio (3.46:9.92)
- [ ] Image wraps smoothly around cylinder with no seams
- [ ] Background glass image displays properly
- [ ] Cylinder aligns with glass outline in background
- [ ] No visible strip lines or rendering artifacts

### **Performance Requirements**
- [ ] Smooth 60fps rendering on desktop
- [ ] Acceptable performance on mobile devices
- [ ] Quick texture loading and initialization
- [ ] Responsive controls with minimal lag

### **Quality Requirements**
- [ ] High-resolution texture mapping
- [ ] Smooth anti-aliased edges
- [ ] Realistic glass appearance with transparency
- [ ] Accurate cylindrical projection mathematics

---

## Dependencies

### **Required Packages**
```json
{
  "three": "^0.158.0",
  "@types/three": "^0.158.0"
}
```

### **Asset Requirements**
- **Map texture**: `/glass-images/rocks-test-design-optimal.png` (1600×640)
- **Glass background**: High-quality rocks glass photograph
- **Optional**: Environment maps for realistic glass reflections

### **Browser Requirements**
- **WebGL support**: Required for Three.js rendering
- **Hardware acceleration**: Recommended for smooth performance
- **Modern browsers**: Chrome 80+, Firefox 75+, Safari 13+

---

## Risk Mitigation

### **Technical Risks**
1. **WebGL compatibility**: Fallback to 2D canvas if WebGL unavailable
2. **Performance on mobile**: Optimization strategies and quality scaling
3. **Texture loading failures**: Error handling and fallback images
4. **Aspect ratio precision**: Careful mathematical validation

### **Implementation Risks**
1. **Three.js complexity**: Start with minimal setup, add features incrementally
2. **Alignment challenges**: Build visual guides and measurement tools
3. **Background integration**: Test both CSS and Three.js approaches
4. **Control complexity**: Simple controls first, advanced features later

---

## Next Steps

### **Immediate Actions**
1. **Create basic Three.js scene** with calculated cylinder dimensions
2. **Load and apply texture** to cylinder geometry
3. **Implement glass background** using CSS layer approach
4. **Add basic rotation controls** for texture positioning
5. **Test visual quality** vs strip-based rendering

### **Future Enhancements**
1. **Advanced materials**: Glass shader with refraction and reflection
2. **Multiple glass types**: Different cylinder dimensions per glass type
3. **Interactive controls**: Real-time positioning and scaling
4. **High-resolution export**: Production-quality image generation
5. **Performance optimization**: LOD system and quality scaling

---

*This approach represents a fundamental shift from 2D strip approximation to true 3D cylindrical mapping, eliminating the core issues that have persisted through multiple rendering optimizations.*