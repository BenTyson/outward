import { useState, useCallback } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import { calculateDimensions } from '../../utils/canvas';
import { flatIcons } from '../../utils/icons';
import './MapExportControls.css';

const MapExportControls = ({ onGenerateFinalImage, isGenerating }) => {
  const { 
    mapImageUrl, texts, icons, glassType, setPreviewImage,
    setModelImage, setModelPreviewAvailable, updateTotalSteps 
  } = useMapConfig();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  
  // Get current text and icon objects from context
  const text1 = texts.find(t => t.id === 'text1') || null;
  const text2 = texts.find(t => t.id === 'text2') || null;
  const icon1 = icons.find(i => i.id === 'icon1') || null;

  // Helper function to generate rounded text shadow for canvas rendering
  const generateRoundedStroke = (ctx, text, x, y, strokeWidth) => {
    if (strokeWidth <= 0) return;
    
    // Simplified stroke generation - single circle with fewer points
    const steps = 12; // Reduced from 16
    ctx.fillStyle = '#ffffff';
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const offsetX = Math.cos(angle) * strokeWidth;
      const offsetY = Math.sin(angle) * strokeWidth;
      ctx.fillText(text, x + offsetX, y + offsetY);
    }
    
    // Single additional layer for smoothness (much reduced)
    const innerRadius = strokeWidth * 0.6;
    if (innerRadius > 0.5) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * 2 * Math.PI;
        const offsetX = Math.cos(angle) * innerRadius;
        const offsetY = Math.sin(angle) * innerRadius;
        ctx.fillText(text, x + offsetX, y + offsetY);
      }
    }
  };

  // Helper function to render icons with rounded stroke on canvas
  const renderIconWithStroke = (ctx, iconData, x, y, scale, strokeWidth) => {
    const path = new Path2D(iconData.path);
    
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    
    // Draw white stroke in circular pattern if strokeWidth > 0
    if (strokeWidth > 0) {
      const steps = 16;
      ctx.fillStyle = '#ffffff';
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const offsetX = Math.cos(angle) * strokeWidth;
        const offsetY = Math.sin(angle) * strokeWidth;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.fill(path);
        ctx.restore();
      }
      
      // Additional layers for smoother stroke
      for (let radius = strokeWidth * 0.7; radius > 0; radius -= strokeWidth * 0.3) {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * 2 * Math.PI;
          const offsetX = Math.cos(angle) * radius;
          const offsetY = Math.sin(angle) * radius;
          
          ctx.save();
          ctx.translate(offsetX, offsetY);
          ctx.fill(path);
          ctx.restore();
        }
      }
    }
    
    // Draw black icon on top
    ctx.fillStyle = '#000000';
    ctx.fill(path);
    ctx.restore();
  };

  const generatePreview = useCallback(async () => {
    if (!mapImageUrl) {
      setExportError('Please generate a map first');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      // OPTIMIZED FOR PHASE 2: Generate at dimensions divisible by 80 strips
      // This prevents sub-pixel sampling issues in Phase 2 processing
      // Maintain aspect ratio from original design while ensuring divisibility
      const { aspectRatio } = calculateDimensions(glassType);
      const previewWidth = 1600;  // Fixed width divisible by 80
      const previewHeight = Math.round((previewWidth / aspectRatio) / 80) * 80; // Round to nearest 80
      console.log('Generating Phase 2 optimized preview at', previewWidth, 'x', previewHeight);
      console.log('Aspect ratio:', aspectRatio, 'Height rounded to nearest 80px for strip alignment');
      
      const canvas = document.createElement('canvas');
      canvas.width = previewWidth;
      canvas.height = previewHeight;
      const ctx = canvas.getContext('2d');
      
      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, previewWidth, previewHeight);
      
      // Load and draw base map
      const mapImg = new Image();
      mapImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        mapImg.onload = resolve;
        mapImg.onerror = reject;
        mapImg.src = mapImageUrl;
      });
      
      ctx.drawImage(mapImg, 0, 0, previewWidth, previewHeight);
      
      // NOTE: Text rendering removed from preview because mapImageUrl already contains
      // text with stroke from generateFinalImage(). Adding text here creates double stroke.
      // Text 1 and Text 2 are already baked into the mapImageUrl.
      
      // NOTE: Text 2 rendering also removed - already baked into mapImageUrl
      
      // Render Icon
      if (icon1 && icon1.type && flatIcons[icon1.type]) {
        const iconScale = (icon1.size / 100) * Math.min(previewWidth, previewHeight) * 0.2;
        const x = (icon1.position.x / 100) * previewWidth - iconScale/2;
        const y = (icon1.position.y / 100) * previewHeight - iconScale/2;
        const scale = iconScale / 24; // SVG viewBox is 24x24
        const scaledStrokeWidth = icon1.strokeWidth * (24/iconScale);
        
        renderIconWithStroke(ctx, flatIcons[icon1.type], x, y, scale, scaledStrokeWidth);
      }
      
      const url = canvas.toDataURL('image/png', 0.9);
      setPreviewImage(url);
      
      // NEW: Check if rocks glass and enable 3D preview
      if (glassType === 'rocks') {
        setModelImage(url);
        setModelPreviewAvailable(true);
        console.log('🎯 Rocks glass detected - 3D preview enabled in Step 2');
        console.log('📍 Model image stored for embedded 3D preview:', url.substring(0, 50) + '...');
      } else {
        // Ensure 3D preview is disabled for other glass types
        setModelPreviewAvailable(false);
        console.log('📍 Glass type:', glassType, '- no 3D preview');
      }
      
      // Auto-download the preview optimized for Phase 2
      const link = document.createElement('a');
      link.download = `phase2-test-map-${Date.now()}.png`;
      link.href = url;
      link.click();
      
      console.log('Generated Phase 2 optimized preview:', {
        resolution: `${previewWidth}x${previewHeight}px (perfect for 80-strip processing)`,
        fileSize: `~${Math.round(url.length / 1024)}KB`,
        stripAlignment: `${previewHeight/80}px per strip (no sub-pixel issues)`
      });
      
    } catch (err) {
      console.error('Preview generation failed:', err);
      setExportError('Failed to generate preview. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [mapImageUrl, text1, text2, icon1, glassType, setPreviewImage, setModelImage, setModelPreviewAvailable, updateTotalSteps]);

  const generateHighResExport = useCallback(async () => {
    if (!mapImageUrl) {
      setExportError('Please generate a map first');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      // Ultra high-resolution export at 1200 DPI for laser engraving
      const { aspectRatio } = calculateDimensions(glassType);
      const width = 4800; // Ultra-high-res width (1200 DPI equivalent)
      const height = Math.round(width / aspectRatio);
      
      console.log(`Generating ultra-high-res export: ${width}x${height}px`);
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Optimize canvas settings for high quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.textRenderingOptimization = 'optimizeQuality';
      
      // Black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Load and draw base map
      const mapImg = new Image();
      mapImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        mapImg.onload = resolve;
        mapImg.onerror = reject;
        mapImg.src = mapImageUrl;
      });
      
      ctx.drawImage(mapImg, 0, 0, width, height);
      
      // Render Text 1
      if (text1 && text1.content && text1.content.trim()) {
        const fontSize = (text1.size / 100) * Math.min(width, height) * 0.15;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = (text1.position.x / 100) * width;
        const y = (text1.position.y / 100) * height;
        const scaledStrokeWidth = text1.strokeWidth * (fontSize / 100); // Reduced scaling
        
        // Generate rounded stroke
        generateRoundedStroke(ctx, text1.content, x, y, scaledStrokeWidth);
        
        // Black text on top
        ctx.fillStyle = '#000000';
        ctx.fillText(text1.content, x, y);
      }
      
      // Render Text 2
      if (text2 && text2.content && text2.content.trim()) {
        const fontSize = (text2.size / 100) * Math.min(width, height) * 0.15;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const x = (text2.position.x / 100) * width;
        const y = (text2.position.y / 100) * height;
        const scaledStrokeWidth = text2.strokeWidth * (fontSize / 100); // Reduced scaling
        
        // Generate rounded stroke
        generateRoundedStroke(ctx, text2.content, x, y, scaledStrokeWidth);
        
        // Black text on top
        ctx.fillStyle = '#000000';
        ctx.fillText(text2.content, x, y);
      }
      
      // Render Icon
      if (icon1 && icon1.type && flatIcons[icon1.type]) {
        const iconScale = (icon1.size / 100) * Math.min(width, height) * 0.2;
        const x = (icon1.position.x / 100) * width - iconScale/2;
        const y = (icon1.position.y / 100) * height - iconScale/2;
        const scale = iconScale / 24; // SVG viewBox is 24x24
        const scaledStrokeWidth = icon1.strokeWidth * (24/iconScale);
        
        renderIconWithStroke(ctx, flatIcons[icon1.type], x, y, scale, scaledStrokeWidth);
      }
      
      // Create optimized exports
      const timestamp = Date.now();
      const baseFilename = `lumengrave-map-design-${timestamp}`;
      
      // Option 1: Ultra-high quality PNG (largest file, best quality)
      const pngDataUrl = canvas.toDataURL('image/png', 1.0);
      setPreviewImage(pngDataUrl);
      
      // Auto-download PNG
      const pngLink = document.createElement('a');
      pngLink.download = `${baseFilename}-ultra-hq.png`;
      pngLink.href = pngDataUrl;
      pngLink.click();
      
      console.log('Generated ultra-high-res export:', {
        resolution: `${width}x${height}px`,
        fileSize: `~${Math.round(pngDataUrl.length / 1024)}KB`
      });
      
    } catch (err) {
      console.error('Export failed:', err);
      setExportError('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [mapImageUrl, text1, text2, icon1, glassType, setPreviewImage]);

  return (
    <div className="map-export-controls">
      {exportError && (
        <div className="export-error">
          {exportError}
        </div>
      )}
      
      <div className="control-buttons">
        <button 
          onClick={onGenerateFinalImage}
          className="generate-btn"
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Final Design'}
        </button>
        
        {/* Only show preview and export buttons after final design is generated */}
        {mapImageUrl && (
          <>
            <button
              onClick={generatePreview}
              disabled={isExporting}
              className="preview-btn"
            >
              {isExporting ? 'Generating...' : 'Preview (Phase 2 Test)'}
            </button>
            
            <button
              onClick={generateHighResExport}
              disabled={isExporting}
              className="export-btn"
            >
              {isExporting ? 'Exporting...' : 'Export Ultra High Res'}
            </button>
          </>
        )}
      </div>
      
      <div className="control-info">
        <p><strong>Final Design:</strong> Creates composite image with text/icons for laser engraving</p>
        {mapImageUrl && (
          <>
            <p><strong>Preview (Phase 2 Test):</strong> 1600×1200px optimized for Phase 2 testing (no grid artifacts)</p>
            <p><strong>Ultra High Res:</strong> 1200 DPI export (4800px) for professional laser engraving</p>
          </>
        )}
        {!mapImageUrl && (
          <p><em>Generate final design first to access preview and export options.</em></p>
        )}
      </div>
    </div>
  );
};

export default MapExportControls;