# Phase 2: 3D Mockup Generator

## Overview
Integrate Three.js 3D glass models with the map configurations from Phase 1. Create realistic glass materials with transmission effects and full-surface texture mapping for real-time preview. Maps will cover the entire curved surface of the glass, matching the production engraving process.

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
- Multiple glass type support (Pint/Wine/Rocks/Shot)
- Optimized geometry for web performance
- Cylindrical UV mapping for full-surface engraving
- Real-world scale and proportions
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
Purpose: Apply map designs to entire glass surface
Features:
- CanvasTexture integration from Phase 1
- Full-surface cylindrical texture mapping
- Dynamic texture updates
- Real-time preview updates
- Handles curved surface distortion naturally
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
UV Mapping: Full cylindrical unwrap covering entire curved surface
Scale: Real-world dimensions in meters
Optimization: Draco compression enabled
Base Exclusion: Bottom/base faces separate from engraving surface
```

#### Model Preparation Checklist
- [ ] Export from Blender as GLB with Draco compression
- [ ] Cylindrical UV unwrap for full curved surface coverage
- [ ] Exclude bottom/base from main UV layout
- [ ] Test polygon count for mobile performance (<10k triangles)
- [ ] Confirm scale matches real glass dimensions
- [ ] Position UV seam at back of glass for minimal visibility
- [ ] Validate single material setup exports properly

#### Required Models
1. **Pint Glass Model**
   - Full-surface engraving covering curved walls
   - Circumference to height ratio based on real pint glass
   - File: `pint-glass.glb`
   - Reference: https://lumengrave.com/products/portland-pint-glass
   
2. **Wine Glass Model**
   - Bowl area engraving (curved surface only)
   - File: `wine-glass.glb`
   
3. **Rocks Glass Model** 
   - Short, wide surface for engraving
   - File: `rocks-glass.glb`

4. **Shot Glass Model**
   - Small surface area, full coverage
   - File: `shot-glass.glb`

### Glass Material Implementation

#### Realistic Glass Shader with Engraving
```javascript
const glassMaterial = new THREE.MeshPhysicalMaterial({
  map: engravingTexture,       // Full-surface map texture
  transmission: 0.8,           // Slightly reduced for engraved areas
  roughness: 0.2,              // Textured surface from engraving
  thickness: 0.5,              // Glass thickness for refraction
  ior: 1.5,                    // Glass index of refraction
  clearcoat: 0.8,              // Reduced coating over engraved areas
  clearcoatRoughness: 0.2,     // Slight texture from engraving
  envMapIntensity: 0.9,        // Slightly reduced reflections
  transparent: true,           // Enable transparency
  opacity: 0.95               // Slight opacity for realism
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

#### Full-Surface Canvas-to-Texture Pipeline
```javascript
// Get map configuration from Phase 1
const { mapImageUrl, text, icons, glassType } = mapConfig;

// Create high-resolution canvas for full glass surface
const canvas = createFullSurfaceCanvas(mapConfig);
const texture = new THREE.CanvasTexture(canvas);
texture.needsUpdate = true;

// Configure texture wrapping for cylindrical surface
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;

// Apply to entire glass surface
const glassMaterial = new THREE.MeshPhysicalMaterial({
  map: texture,
  transmission: 0.8,
  transparent: true
});
```

#### Cylindrical UV Mapping Strategy
```javascript
// Full cylindrical UV mapping covers entire curved surface
// UV layout: (0,0) to (1,1) represents full glass circumference and height
const geometry = glassModel.geometry;
const uvAttribute = geometry.attributes.uv;

// Glass surface coverage (matches real engraving area)
const glassUVBounds = {
  // Full circumference (0-1 U represents 360° around glass)
  // Height coverage excludes bottom base
  pint: { fullCircumference: true, heightCoverage: 0.85 },
  wine: { fullCircumference: true, heightCoverage: 0.75 }, // Bowl area only
  rocks: { fullCircumference: true, heightCoverage: 0.8 },
  shot: { fullCircumference: true, heightCoverage: 0.9 }
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

## Blender Model Preparation (Detailed Walkthrough)

### Part 1: Initial Setup & File Assessment

#### Step 1: Open Existing Blender Animation File
1. **Launch Blender** (version 3.0+ recommended)
2. **File → Open** your glass animation file
3. **Identify glass objects** in Scene Collection (outliner)
4. **Take inventory**: Note glass types, animation elements, extra objects

#### Step 2: Scene Cleanup for Web Export
1. **Delete unnecessary objects**:
   - **Cameras** (except one for reference): Select → Delete
   - **Lights** (we'll use web lighting): Select → Delete
   - **Animation keyframes**: Timeline → Select All → X → Delete Keyframes
   - **Background objects**: Remove anything not part of glass models
2. **Keep only the glass geometries** for each type (Pint, Wine, Rocks, Shot)

### Part 2: Model Optimization

#### Step 3: Reduce Polygon Count (Mobile Performance)
1. **Select glass model**
2. **Tab** to Edit Mode
3. **Check triangle count**: Top-right corner shows "Tris: XXXX"
4. **Target**: Under 10,000 triangles per model
5. **If over target**:
   - **Modifier Properties** (wrench icon)
   - **Add Modifier → Decimate**
   - **Type**: Collapse
   - **Ratio**: Start with 0.5 (adjust as needed)
   - **Apply modifier** when satisfied

#### Step 4: Clean Geometry
1. **Edit Mode** (Tab)
2. **Select All** (A)
3. **Mesh → Clean Up → Merge by Distance** (0.001 threshold)
4. **Mesh → Normals → Recalculate Outside**

### Part 3: Full-Surface UV Mapping

#### Step 5: Select Curved Engraving Surface
1. **Edit Mode**, **Alt+A** (deselect all)
2. **Select curved glass walls** (the engraving surface):
   - **Alt+Click** edge loops to select around glass
   - **Use Box Select (B)** for complex selections
   - **Exclude bottom/base faces** (no engraving there)
3. **Goal**: Select all curved surfaces where map will appear

#### Step 6: Cylindrical UV Unwrap
1. **UV Editing workspace** (top tab)
2. **Split view**: UV Editor left, 3D Viewport right
3. **With engraving surfaces selected**:
   - **U key → Cylinder Projection**
   - **Align**: View on Equator
   - **Direction**: Z-axis (vertical)
4. **Alternative**: **U → Unwrap** if cylinder projection fails

#### Step 7: Optimize UV Layout
1. **In UV Editor**:
   - **Select all UVs** (A)
   - **Scale to fill** UV space: S → type 0.95 → Enter
   - **Position centrally** if needed: G to grab/move
2. **Rotate if necessary**: R → 90 → Enter (for proper orientation)
3. **Goal**: Rectangular layout filling most of 0-1 UV space

#### Step 8: Handle Glass Base/Bottom
1. **Select bottom faces** of glass
2. **U → Unwrap**
3. **In UV Editor**:
   - **Scale very small**: S → 0.1 → Enter
   - **Move to corner**: G → position in corner
   - **These won't have engraving**, so minimize their UV space

### Part 4: Material Setup

#### Step 9: Single Material for Full Surface
1. **Material Properties** (red sphere icon)
2. **New Material** → Name: "Glass_With_Engraving"
3. **Principled BSDF settings**:
   - **Base Color**: White (1,1,1) - will be replaced by texture
   - **Transmission**: 0.8
   - **Roughness**: 0.2
   - **IOR**: 1.5
   - **Alpha**: 1.0

#### Step 10: UV Seam Positioning
1. **Edit Mode**
2. **Select edge** where UV seam should be (back of glass)
3. **Mesh → UV → Mark Seam**
4. **Re-unwrap if needed**: U → Unwrap
5. **Goal**: Seam at back where it's least visible

### Part 5: Export Preparation

#### Step 11: Object Naming & Transforms
1. **Object Mode** (Tab)
2. **Rename objects** clearly:
   - "PintGlass", "WineGlass", "RocksGlass", "ShotGlass"
3. **Apply transforms**:
   - **Object → Apply → All Transforms**
   - **Object → Transform → Geometry to Origin**

#### Step 12: Scale Verification
1. **Properties panel** (N key)
2. **Item tab → Dimensions**:
   - **Pint**: ~0.15m wide × 0.16m tall
   - **Wine**: ~0.08m wide × 0.25m tall
   - **Rocks**: ~0.09m wide × 0.09m tall
   - **Shot**: ~0.05m wide × 0.08m tall
3. **Scale if needed**: S → number → Enter

### Part 6: GLB Export

#### Step 13: Export Settings
1. **File → Export → glTF 2.0 (.glb/.gltf)**
2. **Critical settings**:
   - **Format**: GLB (binary)
   - **Include**: Selected Objects
   - **Transform**: +Y Up (NOT Z Up!)
   - **Geometry**: Apply Modifiers ✓, UVs ✓, Normals ✓
   - **Materials**: Export Materials ✓
   - **Compression**: Draco ✓

#### Step 14: Export Each Glass Type
1. **Select one glass type only**
2. **Export with proper name**:
   - `pint-glass.glb`
   - `wine-glass.glb`  
   - `rocks-glass.glb`
   - `shot-glass.glb`

### Part 7: Verification

#### Step 15: Test GLB Files
1. **Use online GLB viewer**: https://gltf-viewer.donmccurdy.com/
2. **Verify each export**:
   - Model loads correctly
   - Scale looks appropriate
   - Materials appear
   - File size <2MB (preferably <500KB)
   - UV mapping visible (if viewer supports it)

#### Step 16: Document UV Layout
1. **Screenshot UV layout** in Blender UV Editor
2. **Note seam position** (should be at back)
3. **Confirm full coverage** of curved surfaces
4. **Save reference images** for development

### Success Criteria
- [ ] All glass models under 10,000 triangles
- [ ] Cylindrical UV unwrap covers entire curved surface  
- [ ] Bottom/base faces excluded from main UV layout
- [ ] UV seam positioned at back of glass
- [ ] Single material per glass model
- [ ] GLB files under 2MB each
- [ ] Real-world scale maintained
- [ ] Clean geometry with proper normals

---

## Progress Update - Current Status

### ✅ COMPLETED: Advanced Arc/Perspective Transform System
Successfully implemented production-ready 2D approach with photo-realistic glass images and sophisticated transform system.

#### ✅ Core Transform Engine (TestTransform.jsx)
**Ultra-High Density Rendering**:
- **160 horizontal strips** (was 30) for maximum smoothness
- **100 vertical subdivisions** (was 20) in arc areas for perfect curves
- **~16,000 draw operations** per render - still performant on modern hardware
- **Pre-transform corner radius**: Rounded corners applied to source image before distortion

**Advanced Distortion System**:
- **Dual arc support**: Independent top and bottom arc controls with different curve directions
- **Dynamic width control**: Separate top/bottom width sliders (can be wider at bottom than top)
- **Cropping window approach**: Map height controls viewing area without image distortion
- **Smart overlap compensation**: Dynamic per-area overlap adjustment for artifact reduction

#### ✅ Production-Ready Controls Interface
**Compact Tabbed System**:
- **Position Tab**: All positioning/geometry controls (11 main controls + 5 fine-tuning)
- **Visual Tab**: Ready for engraving effect controls (placeholder implemented)
- **70vh scrollable panel**: Fits in viewport, can see canvas while adjusting
- **Export system**: One-click JSON/line format copying for settings sharing

#### ✅ Optimized Default Values (Rocks Glass Calibrated)
**Perfect Glass Mapping** (manually tuned):
```javascript
// Production Values - Rocks Glass
arcAmount: 0.64              // Strong top curve matching glass rim
bottomArcAmount: 1.0         // Maximum bottom curve for glass base
topWidth: 425                // Slightly wider at top
bottomWidth: 430             // Actually wider at bottom (inverse taper!)
verticalPosition: 80         // Positioned higher on glass
mapHeight: 460               // Tall coverage for full glass height
bottomCornerRadius: 0        // Sharp corners (default, adjustable 0-50px)
horizontalOverlap: 1         // Minimal overlap for clean strips
bottomArcCompensation: 2     // Manual compensation for bottom distortion
```

#### ✅ Technical Innovations Implemented
**Pre-Transform Processing**:
- **Rounded corner masking**: Applied to source image before strip processing
- **Aspect ratio preservation**: Map height shows more/less of image without distortion
- **Cropping window**: Different portions of source image for front/back (future ready)

**Strip Rendering Optimizations**:
- **Horizontal strip priority**: Better for perspective transforms than vertical
- **Area-specific overlap**: Different overlap values for top/middle/bottom areas
- **Canvas smoothing**: High-quality mode with willReadFrequently optimization
- **Blur post-processing**: Configurable blur with temporary canvas approach

### Technical Architecture (Final Implementation)
**Approach**: Photo-realistic 2D transforms with ultra-high density strip processing  
**Performance**: ~16k draw operations in <50ms on modern hardware  
**Quality**: Near-photographic smoothness with configurable corner radius

**File Structure**:
```
src/components/MockupGenerator/
├── TestTransform.jsx         // ✅ Production transform system
├── TestWrap.jsx              // ✅ Dual-layer system (earlier prototype)
├── GlassMockupWrap.jsx       // ✅ 2D mockup component
└── utils/
    └── glassEffects.js       // ⏳ Future visual effects
```

### Current Implementation Status

#### ✅ COMPLETED: Dual-Layer Glass Rendering System
Successfully implemented front/back glass visualization with cylindrical image wrapping and independent controls.

**Core Features Completed:**
1. **Dual-layer rendering**: Front and back sides render independently with visibility toggles
2. **Cylindrical image wrapping**: 
   - Front shows left 40% of image
   - Back shows opposite 40% portion (with 10% gaps on sides)
   - Back layer horizontally flipped for through-glass viewing
   - Adjustable portion ratios via sliders
3. **Arc direction inversion**: Back layer arcs curve upward (opposite of front) for correct optical effect
4. **Independent controls**: Full set of position/visual controls for each side
5. **Color-coded bounds**: Red for front, blue for back

**UI Structure:**
- Visibility toggles (Show: Front/Back)
- Main tabs: FRONT / BACK
- Each tab contains all position and visual controls
- Cylindrical wrapping controls in Visual section

**Current Parameters (per side):**
- Position: arcAmount, bottomArcAmount, topWidth, bottomWidth, verticalPosition, mapHeight, cornerRadius, verticalSquash
- Fine-tuning: horizontalOverlap, bottomArcCompensation, verticalOverlap, blurAmount, blendOpacity
- Visual: whiteThreshold, engravingOpacity
- Cylindrical: frontPortionSize, sideGapSize, backPortionSize

---

## ⚠️ CRITICAL ISSUE: Visible Strip Lines

### Problem
Horizontal strip boundaries are clearly visible in the rendered output, significantly degrading visual quality. Current uniform strip approach (80 horizontal strips) creates visible seams especially in curved areas.

### Proposed Solution: Adaptive Strip Height System

#### Remove These Obsolete Controls:
1. **`horizontalOverlap`** - Will be auto-calculated
2. **`verticalOverlap`** - Will be auto-calculated  
3. **`bottomArcCompensation`** - Manual compensation incompatible with adaptive strips
4. **`blurAmount`** - Band-aid solution no longer needed
5. **`blendOpacity`** - Band-aid solution no longer needed

#### Keep These Controls:
- All position controls (arc amounts, widths, positions, etc.)
- Visual controls (threshold, opacity)
- Cylindrical wrapping controls

#### Add New Adaptive Controls:
1. **`renderQuality`** (0.5-2.0) - Overall strip density multiplier
2. **`adaptiveStrength`** (0-1) - How much to concentrate strips in curves vs flat areas
3. **`overlapMultiplier`** (0.5-2.0) - Fine-tune auto-calculated overlaps

#### Implementation Strategy:
```javascript
// Adaptive strip distribution
const getAdaptiveStrips = (quality, adaptiveStrength) => {
  const baseStrips = 80 * quality;
  return {
    topCurve: Math.floor(baseStrips * 0.4 * (1 + adaptiveStrength)),    // More strips
    middle: Math.floor(baseStrips * 0.2 * (1 - adaptiveStrength * 0.5)), // Fewer strips
    bottomCurve: Math.floor(baseStrips * 0.4 * (1 + adaptiveStrength))   // More strips
  };
};

// Auto-calculate overlap based on strip height
const calculateOverlap = (stripHeight, curvature, multiplier) => {
  const baseOverlap = stripHeight * 0.1;  // 10% of strip height
  const curveBonus = curvature * 2;        // Extra in curved areas
  return (baseOverlap + curveBonus) * multiplier;
};
```

### Benefits:
- Eliminates visible strip boundaries
- Simplifies UI (removes 5 confusing sliders)
- Better performance (fewer strips in flat areas)
- More detail where needed (curves)
- Maintains all core functionality

---

## Next Steps for Implementation

1. **Implement adaptive strip height system**
   - Variable strip density based on curvature
   - Auto-calculated overlaps
   - Replace manual overlap controls

2. **Test and calibrate**
   - Find optimal quality/performance balance
   - Tune adaptive distribution algorithm
   - Verify elimination of visible lines

3. **Update UI**
   - Remove obsolete sliders
   - Add new quality/adaptive controls
   - Simplify user experience

---

## Technical Notes

### File Structure:
```
src/components/MockupGenerator/
├── TestTransform.jsx       // Main production component
├── utils/
│   └── imageProcessing.js  // Binary conversion utilities
└── components/
    ├── VisualControls.jsx   // Reusable visual controls
    └── SettingsExport.jsx   // Settings management
```

### Key Functions:
- `getImagePortionForSide()` - Handles cylindrical image portion selection
- `applyArcTransform()` - Core transform engine with front/back support
- `processImageForEngraving()` - Binary image processing

### Performance Considerations:
- Current: 80 uniform strips = visible boundaries
- Target: Variable strips (20-120) based on curvature
- Optimization: Fewer operations in flat areas, more in curves

---

*Ready for adaptive strip implementation to eliminate visible boundaries and improve visual quality.*