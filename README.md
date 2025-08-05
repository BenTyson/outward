# LumenGrave Map Glass Configurator - Phase 1

## Project Status
Phase 1 implementation is complete. The Map Builder functionality is fully operational with all core features implemented.

## Features Implemented
✅ Glass type selection with proper aspect ratios
✅ Location search using Mapbox Geocoder
✅ Interactive map with pan/zoom controls
✅ Map rendering with Mapbox Static API
✅ Text overlay system with drag-and-drop positioning
✅ High-resolution export (600 DPI) for laser engraving
✅ Mobile-responsive design with touch support
✅ State management using React Context

## Setup Instructions

### 1. Configure Mapbox Token
You need to add your Mapbox access token to `.env.local`:

```bash
VITE_MAPBOX_ACCESS_TOKEN=your_actual_mapbox_token_here
```

Get your token from: https://account.mapbox.com/access-tokens/

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## How to Use

1. **Select Glass Type**: Choose between Pint, Wine, or Rocks glass - this sets the aspect ratio for your map
2. **Search Location**: Use the search box to find any location worldwide
3. **Adjust Map**: Pan and zoom the interactive map to frame your desired area
4. **Add Text**: Enter custom text and drag it to position on the map preview
5. **Export Design**: Generate a high-resolution PNG suitable for laser engraving

## Technical Details

### Glass Specifications
- **Pint Glass**: 10.64:6 aspect ratio
- **Wine Glass**: 8.85:3.8 aspect ratio  
- **Rocks Glass**: 3.92:9.46 aspect ratio

### Export Quality
- Preview: 800px width at screen resolution
- High-res export: 600 DPI equivalent for laser engraving
- Output format: PNG with black background and white text/elements

## Next Phases

### Phase 2: 3D Mockup Generator
- Three.js integration for realistic glass preview
- Glass material rendering
- Real-time texture mapping

### Phase 3: Shopify Integration
- Direct checkout integration
- Order property handling
- Webhook processing

## Troubleshooting

### Map Not Loading
- Verify your Mapbox token is correctly configured in `.env.local`
- Check browser console for any API errors
- Ensure you have internet connectivity

### Export Issues
- Make sure to generate a map preview first
- Allow pop-ups for PNG download
- Check browser compatibility (Chrome/Firefox/Safari recommended)

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes
- Optimized for mobile devices
- Progressive loading for map tiles
- Canvas rendering for high-quality exports
- Responsive design breakpoints at 768px and 480px
