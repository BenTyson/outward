import React from 'react';
import { UI_CONSTANTS } from '../constants';

// Reusable slider control component
const SliderControl = ({ label, value, min, max, step, onChange, suffix = '' }) => (
  <div style={{ marginBottom: '15px' }}>
    <label style={{ display: 'block', marginBottom: '5px', fontSize: `${UI_CONSTANTS.LABEL_FONT_SIZE}px` }}>
      {label}: {typeof value === 'number' ? value.toFixed(step < 1 ? 1 : 0) : value}{suffix}
    </label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: `${UI_CONSTANTS.SLIDER_WIDTH}px` }}
    />
  </div>
);

// Control section wrapper
const ControlSection = ({ title, children }) => (
  <div style={{ 
    padding: `${UI_CONSTANTS.CONTROL_SECTION_PADDING}px`, 
    border: '1px solid #e0e0e0', 
    borderRadius: '4px', 
    marginBottom: '10px' 
  }}>
    <h3 style={{ margin: '0 0 15px 0', fontSize: `${UI_CONSTANTS.HEADING_FONT_SIZE}px` }}>{title}</h3>
    {children}
  </div>
);

const ControlPanel = ({ 
  controls, 
  setters,
  canvasHeight 
}) => {
  return (
    <div style={{ 
      minWidth: `${UI_CONSTANTS.CONTROLS_MIN_WIDTH}px`,
      maxWidth: `${UI_CONSTANTS.CONTROLS_MAX_WIDTH}px`,
      maxHeight: `${canvasHeight}px`,
      overflowY: 'auto',
      padding: `${UI_CONSTANTS.CONTROLS_PADDING}px`,
      border: '1px solid #eee',
      borderRadius: '4px',
      flex: '0 0 auto'
    }}>
      {/* Scale Controls */}
      <ControlSection title="Scale">
        <SliderControl 
          label="Width" 
          value={controls.scaleX} 
          min={0.1} max={3.0} step={0.01}
          onChange={setters.setScaleX} 
        />
        <SliderControl 
          label="Height" 
          value={controls.scaleY} 
          min={0.1} max={3.0} step={0.01}
          onChange={setters.setScaleY} 
        />
        <SliderControl 
          label="Tilt" 
          value={controls.tiltX * 180 / Math.PI} 
          min={-45} max={45} step={0.1}
          onChange={(v) => setters.setTiltX(v * Math.PI / 180)} 
          suffix="°"
        />
        <SliderControl 
          label="Rotate" 
          value={controls.rotateY * 180 / Math.PI} 
          min={-45} max={45} step={0.1}
          onChange={(v) => setters.setRotateY(v * Math.PI / 180)} 
          suffix="°"
        />
        <SliderControl 
          label="Taper" 
          value={controls.taperRatio} 
          min={0.5} max={2.0} step={0.01}
          onChange={setters.setTaperRatio} 
        />
        <SliderControl 
          label="Base Width" 
          value={controls.baseWidth} 
          min={0.5} max={2.0} step={0.01}
          onChange={setters.setBaseWidth} 
        />
      </ControlSection>

      {/* 3D Position Controls */}
      <ControlSection title="3D Position">
        <SliderControl 
          label="X" 
          value={controls.modelX} 
          min={-200} max={200} step={1}
          onChange={setters.setModelX} 
        />
        <SliderControl 
          label="Y" 
          value={controls.modelY} 
          min={-200} max={200} step={1}
          onChange={setters.setModelY} 
        />
      </ControlSection>

      {/* Canvas Position Controls */}
      <ControlSection title="Canvas Position">
        <SliderControl 
          label="Horizontal" 
          value={controls.canvasX} 
          min={-300} max={300} step={1}
          onChange={setters.setCanvasX} 
        />
        <SliderControl 
          label="Vertical" 
          value={controls.canvasY} 
          min={-300} max={300} step={1}
          onChange={setters.setCanvasY} 
        />
      </ControlSection>

      {/* Camera Controls */}
      <ControlSection title="Camera">
        <SliderControl 
          label="FOV" 
          value={controls.cameraFOV} 
          min={10} max={90} step={1}
          onChange={setters.setCameraFOV} 
          suffix="°"
        />
        <SliderControl 
          label="Y-axis" 
          value={controls.cameraY} 
          min={-200} max={200} step={1}
          onChange={setters.setCameraY} 
        />
        <SliderControl 
          label="Z-axis" 
          value={controls.cameraZ} 
          min={-200} max={200} step={1}
          onChange={setters.setCameraZ} 
        />
      </ControlSection>

      {/* Front Side Engraving Controls */}
      <ControlSection title="Front Side">
        <SliderControl 
          label="Opacity" 
          value={controls.frontOpacity} 
          min={0.0} max={1.0} step={0.01}
          onChange={setters.setFrontOpacity} 
        />
        <SliderControl 
          label="Blur" 
          value={controls.frontBlur} 
          min={0.0} max={5.0} step={0.1}
          onChange={setters.setFrontBlur} 
          suffix="px"
        />
        <SliderControl 
          label="Grain" 
          value={controls.frontGrain} 
          min={0.0} max={1.0} step={0.01}
          onChange={setters.setFrontGrain} 
        />
      </ControlSection>

      {/* Reverse Side Engraving Controls */}
      <ControlSection title="Reverse Side">
        <SliderControl 
          label="Opacity" 
          value={controls.reverseOpacity} 
          min={0.0} max={1.0} step={0.01}
          onChange={setters.setReverseOpacity} 
        />
        <SliderControl 
          label="Blur" 
          value={controls.reverseBlur} 
          min={0.0} max={5.0} step={0.1}
          onChange={setters.setReverseBlur} 
          suffix="px"
        />
        <SliderControl 
          label="Grain" 
          value={controls.reverseGrain} 
          min={0.0} max={1.0} step={0.01}
          onChange={setters.setReverseGrain} 
        />
      </ControlSection>
    </div>
  );
};

export default ControlPanel;