import { useState, useEffect } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './TextIconControls.css';

const TextIconControls = () => {
  const { texts, icons, addText, updateText, removeText, addIcon, updateIcon, removeIcon } = useMapConfig();
  
  // Local state for form inputs
  const [overlayText, setOverlayText] = useState('');
  const [textSize, setTextSize] = useState(50);
  const [textStrokeWidth, setTextStrokeWidth] = useState(2);
  const [overlayText2, setOverlayText2] = useState('');
  const [textSize2, setTextSize2] = useState(40);
  const [textStrokeWidth2, setTextStrokeWidth2] = useState(2);
  const [selectedIcon, setSelectedIcon] = useState('');
  const [iconSize, setIconSize] = useState(50);
  const [iconStrokeWidth, setIconStrokeWidth] = useState(2);

  // Get the current text/icon from context (if they exist)
  const text1 = texts.find(t => t.id === 'text1');
  const text2 = texts.find(t => t.id === 'text2');
  const icon1 = icons.find(i => i.id === 'icon1');

  // Initialize local state from context when component mounts
  useEffect(() => {
    if (text1) {
      setOverlayText(text1.content || '');
      setTextSize(text1.size || 50);
      setTextStrokeWidth(text1.strokeWidth || 2);
    }
    if (text2) {
      setOverlayText2(text2.content || '');
      setTextSize2(text2.size || 40);
      setTextStrokeWidth2(text2.strokeWidth || 2);
    }
    if (icon1) {
      setSelectedIcon(icon1.type || '');
      setIconSize(icon1.size || 50);
      setIconStrokeWidth(icon1.strokeWidth || 2);
    }
  }, [text1, text2, icon1]);

  // Update text 1 in context
  const handleText1Change = (content) => {
    setOverlayText(content);
    if (content.trim()) {
      if (text1) {
        updateText('text1', { content });
      } else {
        addText({
          id: 'text1',
          content,
          position: { x: 50, y: 80 },
          size: textSize,
          strokeWidth: textStrokeWidth
        });
      }
    } else if (text1) {
      removeText('text1');
    }
  };

  const handleText1SizeChange = (size) => {
    setTextSize(size);
    if (text1) {
      updateText('text1', { size });
    }
  };

  const handleText1StrokeChange = (strokeWidth) => {
    setTextStrokeWidth(strokeWidth);
    if (text1) {
      updateText('text1', { strokeWidth });
    }
  };

  // Update text 2 in context
  const handleText2Change = (content) => {
    setOverlayText2(content);
    if (content.trim()) {
      if (text2) {
        updateText('text2', { content });
      } else {
        addText({
          id: 'text2',
          content,
          position: { x: 50, y: 20 },
          size: textSize2,
          strokeWidth: textStrokeWidth2
        });
      }
    } else if (text2) {
      removeText('text2');
    }
  };

  const handleText2SizeChange = (size) => {
    setTextSize2(size);
    if (text2) {
      updateText('text2', { size });
    }
  };

  const handleText2StrokeChange = (strokeWidth) => {
    setTextStrokeWidth2(strokeWidth);
    if (text2) {
      updateText('text2', { strokeWidth });
    }
  };

  // Update icon in context
  const handleIconChange = (type) => {
    setSelectedIcon(type);
    if (type) {
      if (icon1) {
        updateIcon('icon1', { type });
      } else {
        addIcon({
          id: 'icon1',
          type,
          position: { x: 80, y: 20 },
          size: iconSize,
          strokeWidth: iconStrokeWidth
        });
      }
    } else if (icon1) {
      removeIcon('icon1');
    }
  };

  const handleIconSizeChange = (size) => {
    setIconSize(size);
    if (icon1) {
      updateIcon('icon1', { size });
    }
  };

  const handleIconStrokeChange = (strokeWidth) => {
    setIconStrokeWidth(strokeWidth);
    if (icon1) {
      updateIcon('icon1', { strokeWidth });
    }
  };

  return (
    <div className="text-icon-controls">
      <div className="control-group">
        <h3>Custom Text</h3>
        
        <div className="input-group">
          <label htmlFor="overlay-text">Text 1:</label>
          <input
            id="overlay-text"
            type="text"
            value={overlayText}
            onChange={(e) => handleText1Change(e.target.value)}
            placeholder="Enter first text..."
            className="text-input"
          />
          <div className="slider-group">
            <div className="size-control">
              <label>Size: {textSize}px</label>
              <input
                type="range"
                min="20"
                max="100"
                value={textSize}
                onChange={(e) => handleText1SizeChange(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>
            <div className="size-control">
              <label>Stroke: {textStrokeWidth}px</label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={textStrokeWidth}
                onChange={(e) => handleText1StrokeChange(parseFloat(e.target.value))}
                className="size-slider"
              />
            </div>
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="overlay-text2">Text 2 (Optional):</label>
          <input
            id="overlay-text2"
            type="text"
            value={overlayText2}
            onChange={(e) => handleText2Change(e.target.value)}
            placeholder="Enter second text..."
            className="text-input"
          />
          <div className="slider-group">
            <div className="size-control">
              <label>Size: {textSize2}px</label>
              <input
                type="range"
                min="20"
                max="100"
                value={textSize2}
                onChange={(e) => handleText2SizeChange(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>
            <div className="size-control">
              <label>Stroke: {textStrokeWidth2}px</label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={textStrokeWidth2}
                onChange={(e) => handleText2StrokeChange(parseFloat(e.target.value))}
                className="size-slider"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="control-group">
        <h3>Icon</h3>
        
        <div className="input-group">
          <label>Add Icon:</label>
          <select 
            className="icon-select"
            value={selectedIcon}
            onChange={(e) => handleIconChange(e.target.value)}
          >
            <option value="">No Icon</option>
            <option value="star">Star</option>
            <option value="heart">Heart</option>
            <option value="pin">Location Pin</option>
            <option value="home">Home</option>
          </select>
          <div className="slider-group">
            <div className="size-control">
              <label>Size: {iconSize}px</label>
              <input
                type="range"
                min="20"
                max="175"
                value={iconSize}
                onChange={(e) => handleIconSizeChange(parseInt(e.target.value))}
                className="size-slider"
              />
            </div>
            <div className="size-control">
              <label>Stroke: {iconStrokeWidth}px</label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={iconStrokeWidth}
                onChange={(e) => handleIconStrokeChange(parseFloat(e.target.value))}
                className="size-slider"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="instruction-note">
        <p>💡 <strong>Tip:</strong> Drag the text and icons directly on the map preview to position them exactly where you want!</p>
      </div>
    </div>
  );
};

export default TextIconControls;