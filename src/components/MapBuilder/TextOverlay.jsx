import { useState, useRef, useEffect } from 'react';
import { useMapConfig } from '../../contexts/MapConfigContext';
import './TextOverlay.css';

const TextOverlay = () => {
  const { texts, addText, updateText, removeText } = useMapConfig();
  const [newText, setNewText] = useState('');
  const [selectedTextId, setSelectedTextId] = useState(null);
  const containerRef = useRef(null);
  const [containerBounds, setContainerBounds] = useState(null);
  
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const bounds = containerRef.current.getBoundingClientRect();
        setContainerBounds(bounds);
      }
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);
  
  const handleAddText = () => {
    if (newText.trim()) {
      addText({
        content: newText,
        x: 50,
        y: 50,
        size: 24,
        color: '#ffffff'
      });
      setNewText('');
    }
  };
  
  const handleDragStart = (e, textId) => {
    setSelectedTextId(textId);
    const text = texts.find(t => t.id === textId);
    
    if (e.type === 'mousedown') {
      e.dataTransfer = {
        offsetX: e.clientX - (containerBounds.left + (text.x / 100) * containerBounds.width),
        offsetY: e.clientY - (containerBounds.top + (text.y / 100) * containerBounds.height)
      };
    } else if (e.type === 'touchstart') {
      const touch = e.touches[0];
      e.dataTransfer = {
        offsetX: touch.clientX - (containerBounds.left + (text.x / 100) * containerBounds.width),
        offsetY: touch.clientY - (containerBounds.top + (text.y / 100) * containerBounds.height)
      };
    }
  };
  
  const handleDrag = (e) => {
    if (selectedTextId && containerBounds) {
      e.preventDefault();
      
      let clientX, clientY;
      if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.type === 'touchmove') {
        const touch = e.touches[0];
        clientX = touch.clientX;
        clientY = touch.clientY;
      }
      
      const x = ((clientX - containerBounds.left) / containerBounds.width) * 100;
      const y = ((clientY - containerBounds.top) / containerBounds.height) * 100;
      
      updateText(selectedTextId, {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y))
      });
    }
  };
  
  const handleDragEnd = () => {
    setSelectedTextId(null);
  };
  
  useEffect(() => {
    if (selectedTextId) {
      const handleMouseMove = (e) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e) => handleDrag(e);
      const handleTouchEnd = () => handleDragEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [selectedTextId, containerBounds]);
  
  const handleSizeChange = (textId, newSize) => {
    updateText(textId, { size: parseInt(newSize) });
  };
  
  return (
    <div className="text-overlay">
      <div className="text-controls">
        <h3>Add Text</h3>
        <div className="text-input-group">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter text..."
            className="text-input"
            onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
          />
          <button onClick={handleAddText} className="add-text-btn">
            Add
          </button>
        </div>
      </div>
      
      <div className="text-preview-container" ref={containerRef}>
        <div className="text-preview-backdrop">
          {texts.map((text) => (
            <div
              key={text.id}
              className={`text-element ${selectedTextId === text.id ? 'selected' : ''}`}
              style={{
                left: `${text.x}%`,
                top: `${text.y}%`,
                fontSize: `${text.size}px`,
                transform: 'translate(-50%, -50%)'
              }}
              onMouseDown={(e) => handleDragStart(e, text.id)}
              onTouchStart={(e) => handleDragStart(e, text.id)}
            >
              <span className="text-content" style={{
                color: text.color,
                textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
                fontFamily: 'Arial Black, sans-serif',
                fontWeight: 'bold'
              }}>
                {text.content}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {texts.length > 0 && (
        <div className="text-list">
          <h4>Text Elements</h4>
          {texts.map((text) => (
            <div key={text.id} className="text-item">
              <span className="text-item-content">{text.content}</span>
              <div className="text-item-controls">
                <label>
                  Size:
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={text.size}
                    onChange={(e) => handleSizeChange(text.id, e.target.value)}
                    className="size-slider"
                  />
                  <span>{text.size}px</span>
                </label>
                <button
                  onClick={() => removeText(text.id)}
                  className="remove-text-btn"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TextOverlay;