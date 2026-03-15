import React from 'react';

export function ModuleCard({ title, children, color = 'violet' }) {
  const glows = {
    violet: 'shadow-glow-violet border-accent/30',
    cyan: 'shadow-glow-cyan border-neon/30',
    magenta: 'shadow-glow-magenta border-active/30',
  };

  const headerText = {
    violet: 'text-accent',
    cyan: 'text-neon',
    magenta: 'text-active',
  };

  return (
    <div className={`glass-panel rounded-xl flex flex-col overflow-hidden transition-all hover:bg-surface/60 border ${glows[color]}`}>
      {/* Module Header */}
      <div className={`px-4 py-2 border-b border-white/5 bg-black/40 flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          {/* Faux Screws */}
          <div className="w-1.5 h-1.5 rounded-full bg-white/20 shadow-inner"></div>
          <span className={`font-mono text-[10px] uppercase tracking-widest font-bold ${headerText[color]}`}>{title}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/20 shadow-inner"></div>
      </div>
      
      {/* Module Content */}
      <div className="p-5 flex-grow">
        {children}
      </div>
    </div>
  );
}
