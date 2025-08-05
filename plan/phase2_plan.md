# Phase 2: 3D Mockup Generator

## Overview
Integrate Three.js 3D glass models with the map configurations from Phase 1. Create realistic glass materials with transmission effects and dynamic texture mapping for real-time preview.

## Prerequisites
- Phase 1 Map Builder completed and functional
- Map configuration state available from Phase 1
- High-resolution PNG generation working

---

## Technical Implementation

### Core Components Required

#### 1. GlassModel Component
```
Purpose: Load and render 3D glass models
Features:
- GLB/GLTF model loading
- Multiple glass type support (Pint/Wine/Rocks)
- Optimized geometry for web performance
- Proper UV mapping for engraving areas
```

#### 2. GlassMaterial Component
```
Purpose: Realistic glass shader and materials
Features:
- MeshPhysicalMaterial with transmission
- Glass-like refraction and reflection
- Transparency and roughness controls
- Environmental lighting setup
```

#### 3. TextureMapper Component
```
Purpose: Apply map designs to 3D models
Features:
- CanvasTexture integration from Phase 1
- Dynamic texture updates
- UV mapping to engraving areas
- Real-time preview updates
```

#### 4. Scene3D Component
```
Purpose: Complete 3D scene management
Features:
- Camera controls (orbit, zoom, pan)
- Lighting setup for glass materials
- Environment mapping
- Touch/mobile controls
```

#### 5. MockupExporter Component
```
Purpose: Generate final preview images
Features:
- High-resolution 3D scene capture
- Multiple angle shots
- PNG export for customer preview
- Laser file generation
```

### 3D Model Requirements

#### Glass Model Specifications
```
File Format: GLB (optimized GLTF)
Polygon Count: <10,000 triangles per model (mobile performance)
UV Mapping: Engraving area properly unwrapped
Scale: Real-world dimensions in meters
Optimization: Draco compression enabled
```

#### Model Preparation Checklist
- [ ] Export from Blender as GLB with Draco compression
- [ ] Verify UV mapping covers engraving area correctly
- [ ] Test polygon count for mobile performance
- [ ] Confirm scale matches real glass dimensions
- [ ] Validate materials export properly

#### Required Models
1. **Pint Glass Model**
   - Engraving ratio: 10.64:6
   - File: `pint-glass.glb`
   
2. **Wine Glass Model**
   - Engraving ratio: 8.85:3.8
   - File: `wine-glass.glb`
   
3. **Rocks Glass Model**
   - Engraving ratio: 3.92:9.46
   - File: `rocks-glass.glb`

### Glass Material Implementation

#### Realistic Glass Shader
```javascript
const glassMaterial = new THREE.MeshPhysicalMaterial({
  transmission: 1.0,           // Full transparency
  roughness: 0.1,             // Smooth glass surface
  thickness: 0.5,             // Glass thickness for refraction
  ior: 1.5,                   // Glass index of refraction
  clearcoat: 1.0,             // Surface coating
  clearcoatRoughness: 0.1,    // Coating smoothness
  envMapIntensity: 1.0        // Environment reflection strength
});
```

#### Environment Setup
```javascript
// HDR environment for realistic reflections
const environmentTexture = new THREE.CubeTextureLoader()
  .setPath('/textures/environment/')
  .load(['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg']);

scene.environment = environmentTexture;
```

### Dynamic Texture Mapping

#### Canvas-to-Texture Pipeline
```javascript
// Get map configuration from Phase 1
const { mapImageUrl, text, icons, glassType } = mapConfig;

// Create canvas texture
const canvas = createHighResCanvas(mapConfig);
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;

// Apply to glass model engraving area
const engravingMaterial = new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  opacity: 0.9
});
```

#### UV Mapping Strategy
```javascript
// Map canvas texture to specific UV coordinates
// Engraving area should be isolated in UV space (0-1 range)
const geometry = glassModel.geometry;
const uvAttribute = geometry.attributes.uv;

// Engraving area UV coordinates (will vary per glass model)
const engravingUVBounds = {
  pint: { minU: 0.2, maxU: 0.8, minV: 0.3, maxV: 0.7 },
  wine: { minU: 0.15, maxU: 0.85, minV: 0.4, maxV: 0.8 },
  rocks: { minU: 0.1, maxU: 0.9, minV: 0.2, maxV: 0.8 }
};
```

### User Interaction

#### 3D Controls
```javascript
// Orbit controls for 3D navigation
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 10;
controls.minDistance = 2;
```

#### Mobile Touch Support
```javascript
// Touch gesture handling
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,    // Single finger rotate
  TWO: THREE.TOUCH.DOLLY_PAN  // Two finger zoom/pan
};
```

### Integration with Phase 1

#### State Management
```javascript
// Receive configuration from Phase 1
const mockupConfig = {
  ...mapConfig,              // From Phase 1
  glassModel: selectedModel, // 3D model reference
  cameraAngle: 'default',    // Current view angle
  renderQuality: 'high',     // Render quality setting
  previewMode: '3d'          // 2D map vs 3D mockup
};
```

#### Component Integration
```javascript
// Phase 1 → Phase 2 data flow
<MapBuilder onConfigComplete={(config) => setMapConfig(config)} />
<MockupGenerator mapConfig={mapConfig} />
```

### Performance Optimization

#### Rendering Strategy
```javascript
// Adaptive quality based on device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const pixelRatio = isMobile ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio;

renderer.setPixelRatio(pixelRatio);
renderer.setSize(width, height);
```

#### Model Loading
```javascript
// Progressive loading with fallbacks
const modelLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
modelLoader.setDRACOLoader(dracoLoader);

// Load models with error handling
try {
  const gltf = await modelLoader.loadAsync(`/models/${glassType}-glass.glb`);
  scene.add(gltf.scene);
} catch (error) {
  console.error('Model loading failed:', error);
  // Fallback to simple geometry
}
```

### File Structure for Phase 2
```
src/
├── components/
│   ├── MockupGenerator/
│   │   ├── GlassModel.jsx
│   │   ├── GlassMaterial.jsx
│   │   ├── TextureMapper.jsx
│   │   ├── Scene3D.jsx
│   │   └── MockupExporter.jsx
│   └── Controls/
│       ├── CameraControls.jsx
│       ├── QualitySettings.jsx
│       └── ViewAngleSelector.jsx
├── materials/
│   ├── glassMaterial.js
│   └── engravingMaterial.js
├── utils/
│   ├── modelLoader.js
│   ├── textureUtils.js
│   └── sceneSetup.js
└── hooks/
    ├── useGLTF.js
    ├── useTexture.js
    └── use3DControls.js
```

### Success Criteria for Phase 2
- [ ] All three glass models load and render correctly
- [ ] Glass materials look realistic with proper refraction
- [ ] Map textures apply correctly to engraving areas
- [ ] 3D controls work smoothly on desktop and mobile
- [ ] Performance is acceptable on mid-range mobile devices
- [ ] Real-time updates when map configuration changes
- [ ] High-quality preview image export works
- [ ] Proper aspect ratios maintained in 3D space

### Testing Requirements
- [ ] Test all glass types with various map configurations
- [ ] Verify UV mapping accuracy against physical glasses
- [ ] Performance testing on various devices
- [ ] Touch interaction testing on mobile
- [ ] Memory usage monitoring (prevent memory leaks)
- [ ] Preview image quality validation

### Dependencies for Phase 2
```json
{
  "three": "^0.158.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "three-stdlib": "^2.27.0"
}
```

### Environment Variables (Additional)
```
VITE_MODEL_CDN_URL=https://your-cdn.com/models/
VITE_TEXTURE_CDN_URL=https://your-cdn.com/textures/
```

---

## Integration Points

### Phase 1 → Phase 2 Handoff
- Map configuration object passed to 3D system
- Canvas texture generated from Phase 1 data
- Glass type selection drives 3D model loading

### Phase 2 → Phase 3 Preparation
- 3D preview images for Shopify product pages
- Final laser files (high-res PNG) for order fulfillment
- Configuration data for order processing

---

## Notes for Claude Code Agent

### Build Priority
1. Start with basic 3D scene setup and model loading
2. Implement glass materials and lighting
3. Add texture mapping from Phase 1 canvas
4. Implement 3D controls and interactions
5. Add high-quality export functionality
6. Optimize performance for mobile

### Key Considerations
- Model loading may require iterative optimization
- Glass materials need fine-tuning for realism
- UV mapping must be precise for proper engraving area mapping
- Performance is critical for mobile experience
- Memory management important for 3D scenes

### Testing Data
- Use completed Phase 1 configurations
- Test with all three glass ratios
- Validate against physical glass dimensions

---

*This specification covers Phase 2 implementation. Proceed only after Phase 1 is complete and tested.*