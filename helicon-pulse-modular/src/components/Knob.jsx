import React, { useState, useEffect, useRef } from 'react';

/**
 * Knob
 * A custom SVG rotary knob for tactile synth control.
 * Maps Y-axis dragging to a value between min and max.
 */
export function Knob({ 
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  label = "KNOB", 
  unit = "", 
  size = 50,
  color = "violet" // 'violet' or 'cyan'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(value);

  const colors = {
    violet: { ring: '#8A2BE2', glow: 'rgba(138,43,226,0.5)' },
    cyan: { ring: '#00F0FF', glow: 'rgba(0,240,255,0.5)' }
  };
  const theme = colors[color] || colors.violet;

  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDragging) return;
      const deltaY = startY.current - e.clientY; // Up is positive
      // Sensitivity: 1 pixel = 1 step
      const range = max - min;
      const step = range / 150; // 150px drag for full range
      let newVal = startVal.current + (deltaY * step);
      newVal = Math.max(min, Math.min(max, newVal));
      onChange(newVal);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, min, max, onChange]);

  // Map value to -135deg to +135deg rotation
  const percentage = (value - min) / (max - min);
  const rotation = -135 + (percentage * 270);

  return (
    <div className="flex flex-col items-center justify-center knob-container select-none g-4">
      <div 
        className="relative cursor-ns-resize group"
        style={{ width: size, height: size }}
        onPointerDown={handlePointerDown}
      >
        {/* Outer Ring Border */}
        <div className="absolute inset-0 rounded-full border-2 border-surface bg-[#0B0F19] shadow-xl"></div>
        
        {/* Active Value Ring (Optional SVG arc could go here, simulating with shadow for now) */}
        <div 
          className="absolute inset-1 rounded-full transition-shadow duration-150"
          style={{ 
            boxShadow: `inset 0 0 ${isDragging ? '15px' : '5px'} ${theme.glow}, 0 0 ${isDragging ? '10px' : '0px'} ${theme.glow}`
          }}
        ></div>

        {/* The rotating actual knob */}
        <div 
          className="absolute inset-[15%] rounded-full bg-surface border border-white/10 flex items-start justify-center pt-2 shadow-[0_5px_10px_rgba(0,0,0,0.5)] transition-transform duration-75"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {/* Indicator Dot/Line */}
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.ring, boxShadow: `0 0 5px ${theme.ring}` }}></div>
        </div>
      </div>
      
      {/* Label and Value Display */}
      <div className="text-center mt-3 flex flex-col items-center gap-1">
        <span className="font-mono text-[9px] uppercase tracking-widest text-muted">{label}</span>
        <span className="font-mono text-xs font-bold" style={{ color: isDragging ? theme.ring : '#E2E8F0' }}>
          {typeof value === 'number' ? value.toFixed(value < 10 ? 1 : 0) : value}{unit}
        </span>
      </div>
    </div>
  );
}
