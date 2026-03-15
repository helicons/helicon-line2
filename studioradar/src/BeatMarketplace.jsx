import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, Search, Filter, SlidersHorizontal, ShoppingCart, Heart, MoreHorizontal, CheckCircle2, ChevronDown, SkipBack, SkipForward, Volume2, Activity, ArrowLeft } from 'lucide-react';
import { PRODUCERS, PokemonCard } from './ProducerProfiles';

// Hardcoded dummy data for beats
const BEATS = [
  { id: 1, title: 'NEON TEARS', producer: 'Helicon Origin', bpm: 140, key: 'C# Min', tags: ['Synthwave', 'Dark'], price: 29, image: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=200' },
  { id: 2, title: 'GHOST RIDE', producer: 'Metro Shadows', bpm: 120, key: 'F Min', tags: ['Trap', 'Hard'], price: 35, image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=200' },
  { id: 3, title: 'LUCID', producer: 'Cloud Nine', bpm: 95, key: 'A Maj', tags: ['R&B', 'Chill'], price: 29, image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=200' },
  { id: 4, title: 'BRUTALIST', producer: 'Iron Foundry', bpm: 130, key: 'D Min', tags: ['Techno', 'Industrial'], price: 45, image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=200' },
  { id: 5, title: 'VOID WALKER', producer: 'Helicon Origin', bpm: 145, key: 'G Min', tags: ['Drill', 'Dark'], price: 39, image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=200' },
  { id: 6, title: 'PULSE 808', producer: 'Metro Shadows', bpm: 110, key: 'B Min', tags: ['Trap', 'Bouncy'], price: 29, image: 'https://plus.unsplash.com/premium_photo-1681335029094-846c770c06ae?auto=format&fit=crop&q=80&w=200' },
];

export default function BeatMarketplace() {
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cart, setCart] = useState([]);

  const handlePlayToggle = (id) => {
    if (playingId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingId(id);
      setIsPlaying(true);
    }
  };

  const currentTrack = BEATS.find(b => b.id === playingId) || null;

  return (
    <div className="min-h-screen bg-primary text-text font-sans flex flex-col pt-16 pb-24 selection:bg-accent selection:text-white">
      
      {/* 
        TOP NAVBAR OVERRIDE (Specific for Marketplace) 
      */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-[#050505]/90 backdrop-blur-xl border-b border-white/10 z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer hover:opacity-80 transition-opacity">
            <Activity className="w-5 h-5 text-accent group-hover:scale-110 transition-transform" />
            <span className="font-heading font-bold text-lg tracking-wide text-white">Helicon</span>
          </Link>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="font-ui text-xs text-text/60 tracking-widest uppercase">Beat Market</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/40 group-focus-within:text-accent transition-colors" />
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              className="bg-surface/50 border border-white/10 rounded-full py-2 pl-10 pr-4 w-64 text-sm font-ui focus:outline-none focus:border-accent/50 focus:bg-surface transition-all placeholder:text-text/30 text-white"
            />
          </div>
          <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
            <ShoppingCart className="w-5 h-5 text-text/80 hover:text-white" />
            {cart.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </nav>

      {/* 
        MAIN LAYOUT 
      */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex gap-6 px-4 md:px-6 pt-6">
        
        {/* SIDEBAR FILTERS (Sticky on Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-28 h-fit">
          <div>
            <h3 className="font-ui text-[10px] text-text/50 uppercase tracking-widest mb-4">Discover</h3>
            <ul className="space-y-1 font-heading text-lg">
              <li><button className="w-full text-left px-3 py-2 rounded-lg bg-surface/80 text-white font-bold border border-white/5 shadow-[0_0_15px_rgba(138,43,226,0.15)] flex justify-between items-center">Feed <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_#8A2BE2]"></div></button></li>
              <li><button className="w-full text-left px-3 py-2 rounded-lg text-text/70 hover:text-white hover:bg-white/5 transition-colors">Top Charts</button></li>
              <li><button className="w-full text-left px-3 py-2 rounded-lg text-text/70 hover:text-white hover:bg-white/5 transition-colors">Playlists</button></li>
            </ul>
          </div>

          <div className="h-px w-full bg-white/5"></div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-ui text-[10px] text-text/50 uppercase tracking-widest">Filters</h3>
              <SlidersHorizontal className="w-3 h-3 text-text/50" />
            </div>
            
            <div className="space-y-4">
              {/* Genre Filter */}
              <div>
                <button className="flex items-center justify-between w-full text-sm font-bold text-white mb-2">
                  Genre <ChevronDown className="w-4 h-4 text-text/40" />
                </button>
                <div className="flex flex-wrap gap-2">
                  {['Trap', 'R&B', 'Drill', 'Synthwave'].map(g => (
                    <span key={g} className="px-3 py-1 rounded-full border border-white/10 text-xs font-ui text-text/70 hover:border-accent/40 hover:text-white cursor-pointer transition-colors bg-surface/30 hover:bg-surface">{g}</span>
                  ))}
                </div>
              </div>

              {/* Mood Filter */}
              <div>
                <button className="flex items-center justify-between w-full text-sm font-bold text-white mb-2">
                  Mood <ChevronDown className="w-4 h-4 text-text/40" />
                </button>
                <div className="flex flex-wrap gap-2">
                  {['Dark', 'Aggressive', 'Chill', 'Sad'].map(m => (
                    <span key={m} className="px-3 py-1 rounded-full border border-white/10 text-xs font-ui text-text/70 hover:border-accent/40 hover:text-white cursor-pointer transition-colors bg-surface/30 hover:bg-surface">{m}</span>
                  ))}
                </div>
              </div>

              {/* BPM Range */}
              <div>
                <button className="flex items-center justify-between w-full text-sm font-bold text-white mb-2">
                  BPM <span className="font-ui text-[10px] text-text/40 font-normal">90 - 150</span>
                </button>
                <div className="w-full h-1 bg-surface rounded-full mt-2 relative">
                   <div className="absolute left-[20%] right-[30%] h-full bg-accent rounded-full shadow-[0_0_10px_rgba(138,43,226,0.5)]"></div>
                   <div className="absolute left-[20%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border-2 border-accent"></div>
                   <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border-2 border-accent"></div>
                </div>
              </div>

            </div>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-1 min-w-0 flex flex-col gap-8 w-full max-w-full overflow-hidden">
          
          {/* TOP PRODUCERS CAROUSEL (Moved & Themed) */}
          <div className="bg-accent/10 border border-accent/30 rounded-[2rem] p-6 md:p-8 relative overflow-hidden shadow-[0_0_40px_rgba(138,43,226,0.15)] flex-shrink-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-accent/20 blur-[120px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="font-heading font-bold text-3xl text-white drop-shadow-[0_2px_10px_rgba(138,43,226,0.5)]">Our Producers</h2>
                <p className="font-ui text-sm text-accent glow-purple font-bold tracking-widest uppercase mt-1">Top streaming architects</p>
              </div>
              <Link to="/producers" className="text-accent hover:text-white font-ui text-sm font-bold flex items-center gap-2 transition-colors bg-accent/10 px-4 py-2 rounded-full border border-accent/20 hover:border-accent">
                View Hall of Fame <ArrowLeft className="w-4 h-4 rotate-180" />
              </Link>
            </div>

            <div className="w-full relative z-10 pr-2">
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none">
                {PRODUCERS.map(prod => (
                  <div key={prod.id} className="snap-start shrink-0 w-[260px] md:w-[280px] transform origin-left hover:scale-[1.02] transition-transform">
                    <PokemonCard prod={prod} />
                  </div>
                ))}
                <div className="shrink-0 w-8"></div>
              </div>
              <div className="absolute top-0 right-0 bottom-6 w-32 bg-gradient-to-l from-[#130624] via-[#130624]/80 to-transparent pointer-events-none rounded-r-3xl"></div>
            </div>
          </div>

          {/* Hero Trending Banner */}
          <div className="w-full h-[250px] rounded-2xl overflow-hidden relative group cursor-pointer border border-white/10 hover:border-accent/30 transition-colors">
            <img src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=2070" className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" alt="Trending Pack" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent"></div>
            
            <div className="absolute inset-0 p-8 flex flex-col justify-end">
              <span className="font-ui text-[10px] bg-accent/20 text-accent px-2 py-1 rounded-sm w-fit uppercase tracking-widest border border-accent/20 mb-3">Trending Pack</span>
              <h2 className="font-heading font-bold text-4xl text-white mb-2 leading-none">CYBER TRAP VOL. 1</h2>
              <p className="font-ui text-sm text-text/70 mb-4">By Helicon Origin • 15 Exclusive Beats</p>
              <button className="bg-white text-black font-ui text-xs uppercase tracking-widest font-bold px-6 py-3 rounded-full w-fit hover:bg-gray-200 transition-colors">
                Explore Collection
              </button>
            </div>
          </div>

          {/* Filters / Utility Bar on Mobile */}
          <div className="lg:hidden flex items-center justify-between border-b border-white/5 pb-4">
             <button className="flex items-center gap-2 font-ui text-xs px-4 py-2 bg-surface rounded-full border border-white/10"><Filter className="w-4 h-4" /> Filters</button>
             <button className="flex items-center gap-2 font-ui text-xs px-4 py-2 bg-surface rounded-full border border-white/10">Sort: Trending <ChevronDown className="w-3 h-3"/></button>
          </div>

          {/* Track List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-2xl text-white">Trending Beats</h2>
            </div>
            
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_100px_150px_100px_80px_120px] gap-4 px-4 py-2 font-ui text-[10px] uppercase tracking-widest text-text/40 border-b border-white/5 mb-2">
               <div>#</div>
               <div>TITLE</div>
               <div className="text-center">BPM</div>
               <div>TAGS</div>
               <div>KEY</div>
               <div>TIME</div>
               <div className="text-right">PRICE</div>
            </div>

            <div className="space-y-1">
              {BEATS.map((beat, i) => {
                const isCurrentlyPlaying = playingId === beat.id;
                
                return (
                  <div 
                    key={beat.id} 
                    className={`group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_100px_150px_100px_80px_120px] items-center gap-4 p-2 pr-4 rounded-xl transition-all duration-200 border border-transparent ${isCurrentlyPlaying ? 'bg-surface/80 border-white/5 shadow-md' : 'hover:bg-surface/40'}`}
                  >
                    {/* Art & Play */}
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 cursor-pointer" onClick={() => handlePlayToggle(beat.id)}>
                      <img src={beat.image} alt={beat.title} className={`w-full h-full object-cover transition-all duration-300 ${isCurrentlyPlaying ? 'scale-110 blur-[2px]' : 'group-hover:scale-110'}`} />
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        {isCurrentlyPlaying && isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 text-white ml-1" />
                        )}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="font-heading font-bold text-base text-white truncate group-hover:text-accent transition-colors cursor-pointer">{beat.title}</span>
                      <span className="font-ui text-[11px] text-text/60 truncate">{beat.producer}</span>
                    </div>

                    {/* Stats (Desktop only) */}
                    <div className="hidden md:flex justify-center font-ui text-xs text-text/80">{beat.bpm}</div>
                    <div className="hidden md:flex gap-1 overflow-hidden">
                      {beat.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-ui border border-white/10 px-1.5 py-0.5 rounded text-text/60 bg-surface/50 whitespace-nowrap">{tag}</span>
                      ))}
                    </div>
                    <div className="hidden md:flex font-ui text-xs text-text/80">{beat.key}</div>
                    <div className="hidden md:flex font-ui text-xs text-text/50">2:45</div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                      <button className="text-text/40 hover:text-white transition-colors p-1 hidden sm:block">
                        <Heart className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCart([...cart, beat])}
                        className="bg-accent/10 hover:bg-accent text-accent hover:text-white border border-accent/20 hover:border-accent font-ui text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-1.5 rounded-full transition-all shadow-[0_0_10px_rgba(138,43,226,0)] hover:shadow-[0_0_15px_rgba(138,43,226,0.4)] whitespace-nowrap"
                      >
                        {beat.price}€
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex justify-center mb-16">
               <button className="font-ui text-xs text-text/60 hover:text-white border border-white/10 bg-surface/30 hover:bg-surface px-6 py-2 rounded-full transition-all">
                 Load More Tracks
               </button>
            </div>

          </div>
        </main>
      </div>

      {/* 
        GLOBAL AUDIO PLAYER FOOTER 
      */}
      <div className={`fixed bottom-0 left-0 right-0 h-20 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/10 z-50 transform transition-transform duration-500 ease-out flex items-center justify-between px-4 md:px-6 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] ${currentTrack ? 'translate-y-0' : 'translate-y-full'}`}>
        
        {/* Track Info */}
        <div className="flex items-center gap-3 md:w-1/4 min-w-0">
          {currentTrack && (
            <>
              <img src={currentTrack.image} className="w-12 h-12 rounded object-cover border border-white/10" alt="Artwork" />
              <div className="flex flex-col min-w-0">
                <span className="font-heading font-bold text-sm text-white truncate">{currentTrack.title}</span>
                <span className="font-ui text-[10px] text-text/60 truncate">{currentTrack.producer}</span>
              </div>
              <button className="text-text/40 hover:text-accent ml-2 transition-colors hidden sm:block">
                <Heart className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Transport Controls */}
        <div className="flex-1 max-w-xl hidden md:flex flex-col items-center gap-1.5 px-4">
          <div className="flex items-center gap-6">
            <button className="text-text/50 hover:text-white transition-colors"><SkipBack className="w-5 h-5 fill-current" /></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 hover:bg-accent hover:text-white hover:shadow-[0_0_20px_rgba(138,43,226,0.5)] transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button className="text-text/50 hover:text-white transition-colors"><SkipForward className="w-5 h-5 fill-current" /></button>
          </div>
          
          <div className="w-full flex items-center gap-3 font-ui text-[10px] text-text/40">
            <span>0:45</span>
            <div className="flex-1 h-1 bg-surface rounded-full relative cursor-pointer group">
              <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-accent rounded-full group-hover:bg-[#9d3df2] transition-colors"></div>
              <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span>2:45</span>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-4">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center transition-all"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
        </div>

        {/* Output & License */}
        <div className="hidden md:flex items-center justify-end gap-6 w-1/4">
          <div className="flex items-center gap-2 text-text/50 hover:text-white transition-colors cursor-pointer group">
            <Volume2 className="w-4 h-4" />
            <div className="w-20 h-1 bg-surface rounded-full overflow-hidden">
               <div className="w-2/3 h-full bg-white group-hover:bg-accent transition-colors"></div>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10"></div>
          
          {currentTrack && (
             <button 
               onClick={() => setCart([...cart, currentTrack])}
               className="bg-accent hover:bg-[#9d3df2] text-white font-ui text-xs font-bold px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.6)] whitespace-nowrap"
             >
               Add {currentTrack.price}€
             </button>
          )}
        </div>

      </div>

    </div>
  );
}
