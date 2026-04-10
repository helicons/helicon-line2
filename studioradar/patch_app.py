import sys

with open('./src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add createPortal to imports
# Find the first import block
import_react = "import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';"
if import_react in content:
    content = content.replace(import_react, import_react + "\nimport { createPortal } from 'react-dom';")

# 2. Update style tag in Community
old_style = """      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes liquid {
          0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
          100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        }
        .liquid-icon {
           animation: liquid 4s ease-in-out infinite;
           box-shadow: inset 0 0 10px rgba(255,255,255,0.6), inset 0 10px 20px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.6);
        }
      `}</style>"""

new_style = """      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes liquid {
          0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
          100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        }
        .liquid-icon {
           animation: liquid 4s ease-in-out infinite;
           box-shadow: inset 0 0 10px rgba(255,255,255,0.6), inset 0 10px 20px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.6);
        }
        @keyframes custom-wave {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>"""
content = content.replace(old_style, new_style)


# 3. Update the Expansion Window to use createPortal and use the new animation
old_window = """      {/* Expansion Window */}
      {selectedStudio && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedStudio(null)}>
          <div 
            className="w-full max-w-md bg-gradient-to-b from-[#151515] to-[#050505] rounded-[2rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] overflow-hidden relative flex flex-col items-center p-10 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 w-full h-1/2 bg-red-500/10 blur-[60px] pointer-events-none"></div>

            {/* Close */}
            <button onClick={() => setSelectedStudio(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-colors z-20">✕</button>

            <h3 className="font-heading font-bold text-3xl text-white mb-1 relative z-10">Studio {String.fromCharCode(64+selectedStudio)}</h3>
            <p className="font-ui text-[10px] text-red-500 flex items-center gap-2 mb-10 tracking-[0.2em] font-bold relative z-10"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"/> LIVE RECORDING</p>

            {/* Waves Animation (Grabo) */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-12">
              <div className="absolute inset-0 rounded-full border-[1.5px] border-red-500/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute inset-2 rounded-full border-[1.5px] border-accent/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.8s]"></div>
              <div className="absolute inset-4 rounded-full border-[1.5px] border-blue-500/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1.6s]"></div>
              
              <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-red-500 via-accent to-blue-500 shadow-[0_0_40px_rgba(138,43,226,0.6)] z-10 animate-[pulse_3s_ease-in-out_infinite]">
                 <img src={`https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=150&h=150&sig=${selectedStudio}`} 
                      className="w-full h-full rounded-full object-cover border-[3px] border-[#111]" />
              </div>
            </div>"""


new_window = """      {/* Expansion Window */}
      {selectedStudio && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedStudio(null)}>
          <div 
            className="w-full max-w-md bg-gradient-to-b from-[#151515] to-[#050505] rounded-[2rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] overflow-hidden relative flex flex-col items-center p-10 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 w-full h-1/2 bg-red-500/10 blur-[60px] pointer-events-none"></div>

            {/* Close */}
            <button onClick={() => setSelectedStudio(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-colors z-20">✕</button>

            <h3 className="font-heading font-bold text-3xl text-white mb-1 relative z-10">Studio {String.fromCharCode(64+selectedStudio)}</h3>
            <p className="font-ui text-[10px] text-red-500 flex items-center gap-2 mb-10 tracking-[0.2em] font-bold relative z-10"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"/> LIVE RECORDING</p>

            {/* Waves Animation (Grabo) */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-12">
              <div className="absolute inset-10 rounded-full border-[1.5px] border-red-500" style={{animation: 'custom-wave 3s infinite linear 0s'}}></div>
              <div className="absolute inset-10 rounded-full border-[1.5px] border-accent" style={{animation: 'custom-wave 3s infinite linear 1s'}}></div>
              <div className="absolute inset-10 rounded-full border-[1.5px] border-blue-500" style={{animation: 'custom-wave 3s infinite linear 2s'}}></div>
              
              <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-red-500 via-accent to-blue-500 shadow-[0_0_40px_rgba(138,43,226,0.6)] z-10 relative">
                 <img src={`https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=150&h=150&sig=${selectedStudio}`} 
                      className="w-full h-full rounded-full object-cover border-[3px] border-[#111]" />
              </div>
            </div>"""
content = content.replace(old_window, new_window)

# 4. Close portal
old_end = """        </div>
      )}
    </section>"""

new_end = """          </div>
        </div>, document.body
      )}
    </section>"""
content = content.replace(old_end, new_end)

with open('./src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modal z-index and animations fixed!")
