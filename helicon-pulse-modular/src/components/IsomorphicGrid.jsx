import React, { useState } from 'react';
import { useSynthStore } from '../store';

/**
 * IsomorphicGrid
 * A Launchpad/Push style grid for playing the synthesizer.
 * Maps coordinates to frequencies (e.g. 4ths or semitones).
 */
export function IsomorphicGrid() {
  const { noteOn, noteOff, isAudioEngineRunning } = useSynthStore();
  const [activePads, setActivePads] = useState(new Set());

  // Grid setup: 8 rows x 8 cols
  const rows = 4;
  const cols = 12;
  
  // Base frequency (C2)
  const baseFreq = 65.41;
  
  // Calculate frequency based on row/col (Isomorphic layout: cols = semitones, rows = perfect 4ths)
  const getFreq = (row, col) => {
    // Row 0 is bottom, Row (rows-1) is top.
    const steps = col + (row * 5); // 5 semitones = Perfect 4th
    return baseFreq * Math.pow(2, steps / 12);
  };

  const handlePointerDown = (row, col) => {
    if (!isAudioEngineRunning) return;
    const freq = getFreq(row, col);
    const id = `${row}-${col}`;
    setActivePads(prev => new Set(prev).add(id));
    noteOn({ freq, id });
  };

  const handlePointerUp = (row, col) => {
    const freq = getFreq(row, col);
    const id = `${row}-${col}`;
    setActivePads(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    noteOff(freq);
  };

  return (
    <div className="w-full bg-[#050A10] p-4 rounded-xl border border-white/5 flex flex-col gap-2 relative">
      {!isAudioEngineRunning && (
        <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <span className="text-active font-mono font-bold animate-pulse tracking-widest">AWAITING ENGINE START</span>
        </div>
      )}
      
      {/* Generate Grid from top to bottom technically, visually bottom to top */}
      {Array.from({ length: rows }).map((_, rIdx) => {
        const visualRow = rows - 1 - rIdx; // Bottom row is index 0 for mapping logic
        return (
          <div key={`row-${visualRow}`} className="flex gap-2 w-full">
            {Array.from({ length: cols }).map((_, cIdx) => {
              const isActive = activePads.has(`${visualRow}-${cIdx}`);
              
              // Color coding (highlight C notes or octaves)
              const isRoot = cIdx % 12 === 0;
              
              return (
                <div 
                  key={`pad-${visualRow}-${cIdx}`}
                  onPointerDown={(e) => { e.preventDefault(); handlePointerDown(visualRow, cIdx); }}
                  onPointerUp={() => handlePointerUp(visualRow, cIdx)}
                  onPointerLeave={() => { if(isActive) handlePointerUp(visualRow, cIdx); }}
                  className={`flex-1 h-12 md:h-16 rounded-md border transition-all duration-75 select-none touch-none ${
                    isActive 
                      ? 'bg-neon/20 border-neon shadow-glow-cyan transform scale-95' 
                      : isRoot 
                        ? 'bg-surface border-white/20 hover:bg-surface/80' 
                        : 'bg-[#0B0F19] border-white/10 hover:border-white/30'
                  }`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
