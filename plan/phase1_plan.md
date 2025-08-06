# LumenGrave Custom Map Glass Configurator

## Project Overview
Build a custom map glass configurator that integrates seamlessly with existing Shopify store (lumengrave.com). Users select locations, customize text overlays, preview on 3D glass models, and purchase through existing Shopify checkout.

## Development Phases

### Phase 1: Map Builder (Build First)
Core mapping interface with location selection, styling, and text overlay system.

### Phase 2: 3D Mockup Generator (Build Second)  
Three.js integration with glass models, texture mapping, and realistic preview.

### Phase 3: Shopify Integration (Build Third)
Seamless integration with existing Shopify store and checkout process.

---

## Technical Specifications

### Core Requirements
- **Framework**: React with modern hooks
- **3D Engine**: Three.js with React Three Fiber
- **Maps**: Mapbox GL JS + Static Images API
- **Output**: High-resolution PNG files (600 DPI equivalent)
- **Integration**: Shopify Storefront API via iframe embed
- **Mobile**: Full touch support required

### Glass Product Specifications
| Glass Type | Engraving Ratio | Price |
|------------|----------------|-------|
| Pint Glass | 10.64:6 | TBD |
| Wine Glass | 8.85:3.8 | TBD |
| Rocks Glass | 9.46:3.92 | TBD |
| Shot Glass | 6.2:2.5 | TBD |

### Map Configuration
- **Style**: `mapbox://styles/lumengrave/clm6vi67u02jm01qiayvjbsmt`
- **Colors**: Black and white only
- **Coverage**: International locations supported
- **Interactive Map**: Mapbox GL JS for seamless user interaction
- **Static Export**: Mapbox Static Images API for final high-res previews
- **Zoom**: User-controlled with smooth pan/zoom
- **Output Resolution**: 1280px max from Static API, upscale client-side

### Text & Graphics
- **Font**: Nexa Bold with white stroke
- **Placement**: Anywhere on map design
- **Icons**: Preloaded set (no user uploads)
- **Rendering**: White elements on black/transparent background

---

## Phase 1: Map Builder Implementation

### Core Components Needed

#### 1. MapSelector Component
```
Purpose: Location search and selection interface
Features:
- Search bar with autocomplete
- Map interaction (pan, zoom)
- Location confirmation
- Coordinates capture
```

#### 2. MapRenderer Component  
```
Purpose: Generate styled map images
Features:
- Mapbox Static API integration
- Style application (black/white)
- Resolution optimization
- Ratio-aware cropping
```

#### 3. TextOverlay Component
```
Purpose: Text input and positioning system
Features:
- Text input field
- Font rendering (Nexa Bold)
- Drag-and-drop positioning
- White stroke application
- Size controls
```

#### 4. CanvasComposer Component
```
Purpose: Combine map + text + icons into final design
Features:
- Layer management
- High-resolution canvas rendering
- Export to PNG
- Preview generation
```

### Map Builder User Flow
1. **Location Selection**
   - User searches for location
   - Map centers on location
   - User adjusts zoom/position
   - System captures coordinates and zoom level

2. **Glass Type Selection**
   - User selects glass type (Pint/Wine/Rocks)
   - Map aspect ratio updates automatically
   - Preview maintains proper proportions

3. **Text Customization**
   - User enters custom text
   - Drag to position text on map
   - Font auto-applied (Nexa Bold + white stroke)
   - Real-time preview updates

4. **Icon Addition (Optional)**
   - User selects from preloaded icon set
   - Position icon on map
   - Apply white stroke styling

5. **Export Generation**
   - Combine all layers on high-res canvas  
   - Generate preview PNG
   - Store configuration data for Phase 2

### Technical Implementation Details

#### Mapbox Integration
```javascript
// Static API call structure
const mapboxStaticUrl = `https://api.mapbox.com/styles/v1/lumengrave/clm6vi67u02jm01qiayvjbsmt/static/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${token}`;
```

#### Canvas Rendering Strategy
```javascript
// High-resolution canvas for laser-quality output
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

// Set dimensions based on glass type ratio
const dpi = 600;
const [width, height] = calculateDimensions(glassType, dpi);
canvas.width = width;
canvas.height = height;

// Layer composition order:
// 1. Map background
// 2. Icons  
// 3. Text (with white stroke)
```

#### State Management Structure
```javascript
const mapConfig = {
  location: { lat, lng, address },
  zoom: number,
  glassType: 'pint' | 'wine' | 'rocks',
  text: { content, x, y, size },
  icons: [{ type, x, y, size }],
  mapImageUrl: string,
  previewImageUrl: string
};
```

### File Structure for Phase 1
```
src/
├── components/
│   ├── MapBuilder/
│   │   ├── MapSelector.jsx
│   │   ├── MapRenderer.jsx  
│   │   ├── TextOverlay.jsx
│   │   ├── IconSelector.jsx
│   │   └── CanvasComposer.jsx
│   └── UI/
│       ├── GlassTypeSelector.jsx
│       ├── SearchBox.jsx
│       └── ControlPanel.jsx
├── utils/
│   ├── mapbox.js
│   ├── canvas.js
│   └── coordinates.js
└── hooks/
    ├── useMapConfig.js
    └── useMapboxStatic.js
```

### Success Criteria for Phase 1
- [ ] User can search and select any international location
- [ ] Map displays in correct black/white style
- [ ] Glass type selection updates map proportions correctly
- [ ] Text can be positioned anywhere with proper styling
- [ ] Icons can be added and positioned
- [ ] High-resolution PNG export works (600 DPI equivalent)
- [ ] Configuration state is properly managed
- [ ] Mobile touch interactions work smoothly

### Testing Requirements
- [ ] Test with various location types (cities, addresses, landmarks)
- [ ] Verify aspect ratios match physical glass dimensions
- [ ] Confirm text readability at laser engraving scale
- [ ] Validate PNG quality for laser processing
- [ ] Test mobile responsiveness and touch controls

---

## Environment Variables Required
```
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token
VITE_MAPBOX_STYLE_ID=lumengrave/clm6vi67u02jm01qiayvjbsmt
```

## Dependencies for Phase 1
```json
{
  "react": "^18.0.0",
  "mapbox-gl": "^2.15.0",
  "@mapbox/mapbox-gl-geocoder": "^5.0.0",
  "canvas-txt": "^3.0.0"
}
```

---

## Implementation Status (Current State)

### ✅ Completed Features
- **MapSelector Component**: Interactive Mapbox GL map with seamless pan/zoom
- **MapRenderer Component**: Auto-refreshing static preview generation 
- **Glass Type Support**: All 4 glass types (Pint, Wine, Rocks, Shot) with correct ratios
- **Context State Management**: MapConfigContext with useReducer pattern
- **Location Synchronization**: Live map updates static preview after 2s delay
- **Mobile Responsive**: Aspect ratios adapt to glass type selection

### 🔧 Current Architecture
```javascript
// Main components working:
- MapSelector.jsx (Interactive Mapbox GL map)
- MapRenderer.jsx (Static preview with auto-refresh)  
- MapConfigContext.jsx (Centralized state management)
- canvas.js (Glass ratio calculations)
- mapbox.js (API utilities)

// File locations:
- /src/components/MapBuilder/
- /src/contexts/MapConfigContext.jsx
- /src/utils/canvas.js, mapbox.js, coordinates.js
```

### 🔄 Active State Flow
1. User interacts with MapSelector (drag/zoom)
2. MapSelector updates location via setLocation()
3. MapRenderer detects location changes  
4. After 2s delay, generates new static preview
5. Preview syncs perfectly with interactive map

### ⏳ Next Phase Requirements
- **TextOverlay Component**: Text positioning and styling system
- **IconSelector Component**: Preloaded icon placement
- **CanvasComposer Component**: Final high-res export generation
- **UI Polish**: Search integration, control panels

### 🐛 Known Working Solutions
- **Map Sync Issue**: Fixed setLocation function vs object passing
- **Auto-refresh**: Implemented proper useEffect dependencies with debounce
- **Aspect Ratios**: Glass ratios correctly applied to map containers
- **Mobile Performance**: Smooth GL interactions without white flashing

## Notes for Claude Code Agent

### Build Priority
1. ~~Start with basic MapSelector component~~ ✅ DONE
2. ~~Add MapRenderer with Static API~~ ✅ DONE  
3. Implement TextOverlay system ⏳ NEXT
4. Add CanvasComposer for export
5. Polish UI and mobile experience

### Key Considerations
- Maintain aspect ratios throughout the build
- Ensure high-resolution output quality
- Optimize for mobile performance
- Store configuration state for Phase 2 handoff

### Working Environment Setup
- **Mapbox Token**: Configured in .env.local
- **Custom Style**: lumengrave/clm6vi67u02jm01qiayvjbsmt (black/white theme)
- **Default Location**: Denver, CO (39.7392, -104.9903)
- **Glass Types**: All ratios tested and working correctly

---

*This specification covers Phase 1 implementation. Phase 2 (3D Mockup Generator) and Phase 3 (Shopify Integration) specifications will be provided after Phase 1 completion.*