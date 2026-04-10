import sys

# 1. Update BeatMarketplace.jsx
with open('./src/BeatMarketplace.jsx', 'r', encoding='utf-8') as f:
    beat_content = f.read()

start_exp = beat_content.find("{/* EXPANDED FULLSCREEN PLAYER */}")
end_exp = beat_content.find("</div>{/* end z-10 wrapper */}")

new_exp = """{/* EXTENDED "TOP CENTER" iPod PLAYER */}
      <div 
         className={`fixed top-4 md:top-6 left-1/2 -translate-x-1/2 w-[98vw] md:w-[94vw] max-w-[1000px] z-[100] transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isPlayerExpanded ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-[120%] opacity-0 pointer-events-none scale-95'}`}
      >
         <div className="w-full bg-[#0a0a0a]/90 backdrop-blur-[40px] rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] overflow-hidden flex flex-col relative relative before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05)_0%,transparent_60%)]">
           
           {currentTrack && isPlaying && (
              <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen transition-opacity duration-1000" style={{ background: `radial-gradient(circle at 0% 0%, rgba(${currentTrack.colors[0].join(',')}, 0.8) 0%, transparent 50%)` }} />
           )}

           {/* Close Button Inside Console */}
           <button 
             onClick={() => setIsPlayerExpanded(false)} 
             className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-all z-30 group shadow-lg"
           >
             <ChevronDown className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-y-0.5 drop-shadow-md" />
           </button>

           <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 md:gap-12 p-6 md:p-12 relative z-10">
              
              {/* Left Model: Big 3D Album */}
              <div className="w-40 md:w-72 shrink-0 perspective-[1000px] group z-20">
                 <div className="relative w-full aspect-square rounded-[1.5rem] md:rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-transform duration-700 ease-out preserve-3d group-hover:rotate-y-[8deg] group-hover:-rotate-x-[5deg]">
                    <img src={currentTrack?.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s] ease-out" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-[1.5rem] md:rounded-[2rem] mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-transparent to-white/10 pointer-events-none"></div>
                 </div>
              </div>

              {/* Right Model: Console interface */}
              <div className="flex-1 flex flex-col justify-center min-w-0 w-full mt-4 md:mt-0">
                 <div className="mb-6 md:mb-10 text-center md:text-left">
                    <h2 className="font-heading font-black text-3xl md:text-5xl text-white mb-1 md:mb-2 truncate drop-shadow-lg">{currentTrack?.title}</h2>
                    <p className="font-ui text-xs md:text-sm text-white/50 uppercase tracking-[0.2em] truncate">{currentTrack?.producer}</p>
                 </div>

                 {/* Top Center iPod Scrubber */}
                 <div className="w-full mb-6 md:mb-10 px-4 md:px-0">
                    <div className="flex justify-between items-center mb-3 font-ui text-[10px] text-white/40 font-bold tracking-widest">
                      <span>0:45</span>
                      <span>2:45</span>
                    </div>
                    <div className="h-2.5 bg-black/40 rounded-full w-full relative overflow-hidden cursor-pointer shadow-inner border border-white/5 group">
                      <div className="absolute left-0 top-0 bottom-0 bg-white group-hover:bg-accent transition-colors w-1/3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] relative"></div>
                    </div>
                 </div>

                 {/* Massive tactile play button controls */}
                 <div className="flex items-center justify-center md:justify-start gap-6 md:gap-10 border-b border-white/5 pb-8 md:pb-10">
                    <button className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-surface border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all shadow-[0_6px_0_rgba(0,0,0,0.4)] active:translate-y-[6px] active:shadow-none hover:-translate-y-1 hover:bg-white/5">
                       <SkipBack className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </button>
                    <button 
                       onClick={() => setIsPlaying(!isPlaying)} 
                       className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center transition-all bg-gradient-to-b from-white to-gray-300 hover:from-white hover:to-white border border-white/40 text-black shadow-[0_12px_0_rgba(200,200,200,0.2),0_20px_40px_rgba(0,0,0,0.6)] active:translate-y-[12px] active:shadow-[0_0_0_rgba(200,200,200,0.2),0_5px_10px_rgba(0,0,0,0.6)]"
                    >
                       {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current drop-shadow-md" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current ml-2 drop-shadow-md" />}
                    </button>
                    <button className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-surface border border-white/10 rounded-2xl text-white/50 hover:text-white transition-all shadow-[0_6px_0_rgba(0,0,0,0.4)] active:translate-y-[6px] active:shadow-none hover:-translate-y-1 hover:bg-white/5">
                       <SkipForward className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                    </button>
                 </div>

                 {/* Vinyl Sleeve Up Next Queue */}
                 <div className="w-full pt-6 md:pt-8 px-2 md:px-0">
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-ui text-[9px] md:text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">Up Next (Vinyl Queue)</h3>
                       <span className="font-ui text-[9px] text-accent border border-accent/20 px-2 py-0.5 rounded-full uppercase tracking-widest bg-accent/10">Slide to reveal</span>
                    </div>
                    <div className="flex gap-6 md:gap-8 overflow-x-auto pb-6 scrollbar-none snap-x mask-fade-right">
                      {BEATS.filter(b => b.id !== playingId).slice(0, 4).map((b, i) => (
                        <div key={b.id} onClick={() => { setPlayingId(b.id); setIsPlaying(true); }} className="relative flex items-center group cursor-pointer shrink-0 snap-start w-56 md:w-64">
                           {/* Sleeve (Cover) */}
                           <div className="w-16 h-16 md:w-20 md:h-20 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-20 relative overflow-hidden border border-white/20 bg-[#111] transition-transform duration-500 group-hover:-translate-y-2 group-hover:scale-105">
                             <img src={b.image} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 ring-1 ring-inset ring-black/50 pointer-events-none"></div>
                           </div>

                           {/* Vinyl Disc sliding out */}
                           <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#1a1a1a] to-[#050505] border border-white/10 absolute left-2 md:left-4 z-10 shadow-[8px_8px_20px_rgba(0,0,0,0.6)] group-hover:translate-x-10 md:group-hover:translate-x-14 group-hover:rotate-[180deg] transition-all duration-[800ms] ease-out flex items-center justify-center overflow-hidden">
                              <div className="absolute inset-[15%] rounded-full border border-white/5 mix-blend-screen"></div>
                              <div className="absolute inset-[30%] rounded-full border border-white/5 mix-blend-screen"></div>
                              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_45deg,rgba(255,255,255,0.05)_90deg,transparent_135deg)] pointer-events-none mix-blend-screen"></div>
                              
                              <div className="w-[35%] h-[35%] rounded-full overflow-hidden relative border border-[#111] z-10 shadow-inner">
                                 <img src={b.image} className="w-full h-full object-cover rotate-45 contrast-125 saturate-150" />
                                 <div className="absolute inset-[25%] bg-[#0a0a0a] rounded-full border border-white/30 drop-shadow-md"></div>
                              </div>
                           </div>

                           <div className="flex flex-col ml-12 md:ml-16 min-w-0 z-30 pointer-events-none drop-shadow-md flex-1 pr-2 opacity-80 group-hover:opacity-100 transition-opacity">
                             <h4 className="font-heading font-bold text-sm md:text-base text-white truncate drop-shadow-sm">{b.title}</h4>
                             <span className="font-ui text-[9px] text-white/50 uppercase tracking-[0.2em] truncate">{b.producer}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>

              </div>
           </div>
         </div>
      </div>
"""

if start_exp != -1 and end_exp != -1:
    beat_content = beat_content[:start_exp] + new_exp + "\n      " + beat_content[end_exp:]
    with open('./src/BeatMarketplace.jsx', 'w', encoding='utf-8') as f:
        f.write(beat_content)
    print("BeatMarketplace top-center and vinyl update applied!")
else:
    print("Could not find boundaries in BeatMarketplace.")


# 2. Update ProducerProfiles.jsx
with open('./src/ProducerProfiles.jsx', 'r', encoding='utf-8') as f:
    prod_content = f.read()

imports_old = "import { ActivitySquare, Star, Zap, X, MessageSquare, CheckCircle2, Music2, Headphones } from 'lucide-react';"
imports_new = "import { ActivitySquare, Star, Zap, X, MessageSquare, CheckCircle2, Music2, Headphones, Instagram, Twitter, Youtube } from 'lucide-react';"
prod_content = prod_content.replace(imports_old, imports_new)

search_str = '<div className="flex-1 space-y-3">'
socials_block = """<div className="flex-1 space-y-3">
                {/* 3D SOCIAL TACTILE BUTTONS */}
                <div className="flex items-center gap-4 mb-8">
                   <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-surface border border-white/10 shadow-[0_6px_0_rgba(138,43,226,0.5)] hover:shadow-[0_2px_0_rgba(138,43,226,0.8)] hover:translate-y-1 hover:bg-accent/20 hover:text-accent active:translate-y-[6px] active:shadow-none text-white/70">
                      <Instagram className="w-6 h-6" />
                   </button>
                   <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-surface border border-white/10 shadow-[0_6px_0_rgba(138,43,226,0.5)] hover:shadow-[0_2px_0_rgba(138,43,226,0.8)] hover:translate-y-1 hover:bg-accent/20 hover:text-accent active:translate-y-[6px] active:shadow-none text-white/70">
                      <Twitter className="w-6 h-6" />
                   </button>
                   <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-surface border border-white/10 shadow-[0_6px_0_rgba(138,43,226,0.5)] hover:shadow-[0_2px_0_rgba(138,43,226,0.8)] hover:translate-y-1 hover:bg-accent/20 hover:text-accent active:translate-y-[6px] active:shadow-none text-white/70">
                      <Youtube className="w-6 h-6" />
                   </button>
                </div>
"""
prod_content = prod_content.replace(search_str, socials_block)

search_str2 = '<div className="flex-1 space-y-6">'
socials_block2 = """<div className="flex-1 space-y-6">
                {/* 3D SOCIAL TACTILE BUTTONS FOR REGULAR CARDS */}
                <div className="flex items-center gap-3 mb-6">
                   <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-surface border border-white/10 shadow-[0_6px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_0_rgba(255,255,255,0.3)] hover:translate-y-1 hover:bg-white/10 hover:text-white text-white/50 active:translate-y-[6px] active:shadow-none">
                      <Instagram className="w-5 h-5" />
                   </button>
                   <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-surface border border-white/10 shadow-[0_6px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_0_rgba(255,255,255,0.3)] hover:translate-y-1 hover:bg-white/10 hover:text-white text-white/50 active:translate-y-[6px] active:shadow-none">
                      <Twitter className="w-5 h-5" />
                   </button>
                   <button className="w-12 h-12 rounded-xl flex items-center justify-center transition-all bg-surface border border-white/10 shadow-[0_6px_0_rgba(255,255,255,0.15)] hover:shadow-[0_2px_0_rgba(255,255,255,0.3)] hover:translate-y-1 hover:bg-white/10 hover:text-white text-white/50 active:translate-y-[6px] active:shadow-none">
                      <Youtube className="w-5 h-5" />
                   </button>
                </div>
"""
prod_content = prod_content.replace(search_str2, socials_block2)

with open('./src/ProducerProfiles.jsx', 'w', encoding='utf-8') as f:
    f.write(prod_content)
print("ProducerProfiles tactile buttons updated!")
