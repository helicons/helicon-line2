import sys

with open('./src/BeatMarketplace.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Producer Cards Centering
old_carousel = '<div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none">'
new_carousel = '<div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none lg:justify-center px-4">'
content = content.replace(old_carousel, new_carousel)

# 2. Perfect Center Footer + Expanded Glass Player
start_footer = content.find("{/* GLOBAL AUDIO PLAYER FOOTER")
end_footer = content.find("</div>{/* end z-10 wrapper */}")

new_footer = """{/* GLOBAL AUDIO PLAYER FOOTER & EXPANDED VIEW */}
      <div className={`fixed bottom-0 left-0 right-0 h-24 bg-[#0A0A0A]/95 backdrop-blur-3xl border-t border-white/5 z-[60] transform transition-transform duration-500 ease-out flex items-center justify-between px-4 md:px-8 shadow-[0_-20px_40px_rgba(0,0,0,0.8)] ${currentTrack && !isPlayerExpanded ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Left: Track Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-0 cursor-pointer group" onClick={() => setIsPlayerExpanded(true)}>
          {currentTrack && (
            <>
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/10 shadow-lg group-hover:scale-105 transition-transform flex-shrink-0">
                 <img src={currentTrack.image} className="w-full h-full object-cover" alt="Artwork" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronDown className="w-6 h-6 text-white rotate-180 drop-shadow-md" />
                 </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-bold text-base text-white truncate drop-shadow-sm">{currentTrack.title}</span>
                <span className="font-ui text-xs text-white/50 truncate uppercase tracking-wider">{currentTrack.producer}</span>
              </div>
            </>
          )}
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center gap-2 w-1/3 max-w-xl">
          <div className="flex items-center gap-8">
            <button className="text-white/40 hover:text-white transition-colors hover:scale-110"><SkipBack className="w-5 h-5 fill-current" /></button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-white/10"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>
            <button className="text-white/40 hover:text-white transition-colors hover:scale-110"><SkipForward className="w-5 h-5 fill-current" /></button>
          </div>
          <div className="w-full hidden md:flex items-center gap-3 font-ui text-[10px] text-white/30 font-medium">
            <span className="w-8 text-right">0:45</span>
            <div className={`flex-1 h-1.5 bg-white/5 rounded-full relative cursor-pointer overflow-hidden ${isPlaying ? 'group' : ''}`}>
               <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-white group-hover:bg-accent transition-colors rounded-full"></div>
            </div>
            <span className="w-8">2:45</span>
          </div>
        </div>

        {/* Right: Triggers & Volume (Balances the flex layout) */}
        <div className="hidden md:flex items-center justify-end gap-6 w-1/3">
           <button className="text-white/40 hover:text-white transition-colors" title="Queue">
              <Activity className="w-5 h-5" />
           </button>
           <button className="text-white/40 hover:text-white transition-colors" title="Shopping Cart">
              <ShoppingCart className="w-5 h-5" />
           </button>
           <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-white/40" />
              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden cursor-pointer group">
                 <div className="w-2/3 h-full bg-white/50 group-hover:bg-white transition-colors rounded-full"></div>
              </div>
           </div>
        </div>
      </div>

      {/* EXPANDED FULLSCREEN PLAYER */}
      <div 
         className={`fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 transition-all duration-700 ${isPlayerExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
         {/* Deep Blur Background */}
         <div 
           className="absolute inset-0 bg-black/60 backdrop-blur-[60px] transition-opacity duration-1000"
         />
         
         {/* Colored Ambiance specific to the track */}
         {currentTrack && isPlaying && (
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-1000 mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 50% 40%, rgba(${currentTrack.colors[0].join(',')}, 0.8) 0%, transparent 60%)`
              }}
            />
         )}

         {/* Close Button */}
         <button 
           onClick={() => setIsPlayerExpanded(false)} 
           className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors font-ui text-xs font-bold uppercase tracking-widest z-10"
         >
           <ChevronDown className="w-4 h-4" /> Close
         </button>
         
         {currentTrack && (
           <div className="w-full max-w-6xl h-full max-h-[850px] flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-24 relative z-10">
              
              {/* LEFT: Huge Artwork Area */}
              <div className="w-full max-w-[320px] md:max-w-[400px] lg:max-w-[500px] relative group perspective-1000">
                 <div 
                   className={`w-full aspect-square rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden border border-white/5 transition-transform duration-1000 transform-gpu ${isPlaying ? 'scale-100' : 'scale-95 opacity-90'}`}
                 >
                    <img src={currentTrack.image} className="w-full h-full object-cover" />
                 </div>
              </div>

              {/* RIGHT: Player Controls & Up Next */}
              <div className="w-full max-w-md flex flex-col pt-4">
                 
                 {/* Metadata */}
                 <div className="mb-10 text-center lg:text-left">
                    <h2 className="font-heading font-black text-4xl lg:text-5xl text-white mb-2 leading-tight drop-shadow-lg">{currentTrack.title}</h2>
                    <p className="font-ui text-lg lg:text-xl text-white/50 uppercase tracking-widest">{currentTrack.producer}</p>
                 </div>

                 {/* Scrubber */}
                 <div className="w-full mb-10 hidden md:block">
                    <div className="flex justify-between items-center mb-3 font-ui text-xs text-white/40 font-bold">
                      <span>0:45</span>
                      <span>2:45</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full w-full relative overflow-hidden group cursor-pointer shadow-inner">
                      <div className="absolute left-0 top-0 bottom-0 bg-white w-1/3 group-hover:bg-accent transition-colors rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    </div>
                 </div>

                 {/* Main Controls */}
                 <div className="flex items-center justify-center lg:justify-start gap-10 mb-12">
                    <button className="text-white/30 hover:text-white transition-colors hover:scale-110"><SkipBack className="w-8 h-8 fill-current" /></button>
                    <button 
                       onClick={() => setIsPlaying(!isPlaying)} 
                       className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all hover:scale-105 border border-white/10"
                       style={{ 
                         background: isPlaying ? 'rgba(255,255,255,0.1)' : 'white',
                         color: isPlaying ? 'white' : 'black',
                         boxShadow: isPlaying ? `0 0 50px rgba(${currentTrack.colors[0].join(',')},0.3)` : '0 10px 30px rgba(255,255,255,0.2)'
                       }}
                    >
                       {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-2" />}
                    </button>
                    <button className="text-white/30 hover:text-white transition-colors hover:scale-110"><SkipForward className="w-8 h-8 fill-current" /></button>
                 </div>

                 {/* Up Next Condensed */}
                 <div className="w-full hidden md:block">
                    <h3 className="font-ui text-[10px] text-white/30 uppercase tracking-widest mb-4">Up Next</h3>
                    <div className="flex flex-col gap-2">
                       {BEATS.filter(b => b.id !== playingId).slice(0, 3).map((b, i) => (
                         <div key={b.id} onClick={() => { setPlayingId(b.id); setIsPlaying(true); }} className="flex items-center gap-4 group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                           <img src={b.image} className="w-12 h-12 rounded-lg object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                           <div className="flex-1 min-w-0">
                             <p className="font-heading font-bold text-base text-white/80 group-hover:text-white transition-colors truncate">{b.title}</p>
                             <p className="font-ui text-[10px] text-white/40 uppercase tracking-wider truncate">{b.producer}</p>
                           </div>
                           <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-white/50 hover:text-white">
                             <Play className="w-4 h-4 fill-current" />
                           </button>
                         </div>
                       ))}
                    </div>
                 </div>
                 
              </div>
           </div>
         )}
      </div>
"""

if start_footer != -1 and end_footer != -1:
    content = content[:start_footer] + new_footer + "\n      " + content[end_footer:]
    with open('./src/BeatMarketplace.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("UI Polish alignment patched successfully!")
else:
    print("could not find footer boundaries")
