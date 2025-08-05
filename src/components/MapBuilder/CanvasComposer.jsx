import { useState, useCallback } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import { createHighResCanvas, exportCanvasToPNG, calculateDimensions } from '../../utils/canvas';
import './CanvasComposer.css';

const CanvasComposer = () => {
  const { mapImageUrl, texts, glassType, setPreviewImage } = useMapConfig();
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);
  const [exportError, setExportError] = useState(null);
  
  const generateHighResExport = useCallback(async () => {
    if (!mapImageUrl) {
      setExportError('Please generate a map first');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      const { canvas, ctx } = createHighResCanvas(glassType);
      const { width, height } = calculateDimensions(glassType);
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      const mapImg = new Image();
      mapImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        mapImg.onload = resolve;
        mapImg.onerror = reject;
        mapImg.src = mapImageUrl;
      });
      
      const mapAspect = mapImg.width / mapImg.height;
      const canvasAspect = width / height;
      
      let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
      
      if (mapAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * mapAspect;
        offsetX = (width - drawWidth) / 2;
      } else {
        drawWidth = width;
        drawHeight = width / mapAspect;
        offsetY = (height - drawHeight) / 2;
      }
      
      ctx.drawImage(mapImg, offsetX, offsetY, drawWidth, drawHeight);
      
      ctx.font = 'bold Arial';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      
      texts.forEach(text => {
        const x = (text.x / 100) * width;
        const y = (text.y / 100) * height;
        const fontSize = (text.size / 24) * (width / 1000) * 24;
        
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText(text.content, x, y);
        ctx.fillText(text.content, x, y);
      });
      
      const url = await exportCanvasToPNG(canvas);
      setExportUrl(url);
      setPreviewImage(url);
      
      const link = document.createElement('a');
      link.download = `map-design-${Date.now()}.png`;
      link.href = url;
      link.click();
      
    } catch (err) {
      console.error('Export failed:', err);
      setExportError('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [mapImageUrl, texts, glassType, setPreviewImage]);
  
  const generatePreview = useCallback(async () => {
    if (!mapImageUrl) {
      setExportError('Please generate a map first');
      return;
    }
    
    setIsExporting(true);
    setExportError(null);
    
    try {
      const previewWidth = 800;
      const { aspectRatio } = calculateDimensions(glassType);
      const previewHeight = Math.round(previewWidth / aspectRatio);
      
      const canvas = document.createElement('canvas');
      canvas.width = previewWidth;
      canvas.height = previewHeight;
      const ctx = canvas.getContext('2d');
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, previewWidth, previewHeight);
      
      const mapImg = new Image();
      mapImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        mapImg.onload = resolve;
        mapImg.onerror = reject;
        mapImg.src = mapImageUrl;
      });
      
      ctx.drawImage(mapImg, 0, 0, previewWidth, previewHeight);
      
      ctx.font = 'bold Arial';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      
      texts.forEach(text => {
        const x = (text.x / 100) * previewWidth;
        const y = (text.y / 100) * previewHeight;
        const fontSize = text.size * (previewWidth / 1000);
        
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText(text.content, x, y);
        ctx.fillText(text.content, x, y);
      });
      
      const url = canvas.toDataURL('image/png', 0.9);
      setExportUrl(url);
      setPreviewImage(url);
      
    } catch (err) {
      console.error('Preview generation failed:', err);
      setExportError('Failed to generate preview. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [mapImageUrl, texts, glassType, setPreviewImage]);
  
  return (
    <div className="canvas-composer">
      <h3>Export Design</h3>
      
      {exportUrl && (
        <div className="export-preview">
          <img src={exportUrl} alt="Export preview" />
        </div>
      )}
      
      {exportError && (
        <div className="export-error">
          {exportError}
        </div>
      )}
      
      <div className="export-controls">
        <button
          onClick={generatePreview}
          disabled={isExporting || !mapImageUrl}
          className="preview-btn"
        >
          {isExporting ? 'Generating...' : 'Generate Preview'}
        </button>
        
        <button
          onClick={generateHighResExport}
          disabled={isExporting || !mapImageUrl}
          className="export-btn"
        >
          {isExporting ? 'Exporting...' : 'Export High Resolution (600 DPI)'}
        </button>
      </div>
      
      <div className="export-info">
        <p>Preview shows your design at screen resolution.</p>
        <p>High-resolution export creates a 600 DPI image suitable for laser engraving.</p>
      </div>
    </div>
  );
};

export default CanvasComposer;