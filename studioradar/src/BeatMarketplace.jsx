import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, Search, Filter, SlidersHorizontal, ShoppingCart, Heart, MoreHorizontal, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, SkipBack, SkipForward, Volume2, Activity, ArrowLeft, TrendingUp, Music, Keyboard, Zap, Pencil } from 'lucide-react';
import { PRODUCERS, PokemonCard } from './ProducerProfiles';

const KEY_OPTIONS = ['C Maj', 'C Min', 'C# Maj', 'C# Min', 'D Maj', 'D Min', 'D# Maj', 'D# Min', 'E Maj', 'E Min', 'F Maj', 'F Min', 'F# Maj', 'F# Min', 'G Maj', 'G Min', 'G# Maj', 'G# Min', 'A Maj', 'A Min', 'A# Maj', 'A# Min', 'B Maj', 'B Min'];

// Hardcoded dummy data for beats
const BEATS = [
  { id: 1, title: 'NEON TEARS',  producer: 'Helicon Origin', bpm: 140, key: 'C# Min', tags: ['Synthwave', 'Dark'],     price: 29, plays: '8.4M',  image: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&q=80&w=200', colors: [[138,43,226],[80,0,180]] },
  { id: 2, title: 'GHOST RIDE',  producer: 'Metro Shadows',  bpm: 120, key: 'F Min',   tags: ['Trap', 'Hard'],         price: 35, plays: '12.1M', image: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?auto=format&fit=crop&q=80&w=200', colors: [[255,0,60],[180,0,40]] },
  { id: 3, title: 'LUCID',       producer: 'Cloud Nine',     bpm: 95,  key: 'A Maj',   tags: ['R&B', 'Chill'],         price: 29, plays: '5.2M',  image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=200', colors: [[0,240,255],[0,150,200]] },
  { id: 4, title: 'BRUTALIST',   producer: 'Iron Foundry',   bpm: 130, key: 'D Min',   tags: ['Techno', 'Industrial'], price: 45, plays: '2.9M',  image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=200', colors: [[255,215,0],[200,150,0]] },
  { id: 5, title: 'VOID WALKER', producer: 'Helicon Origin', bpm: 145, key: 'G Min',   tags: ['Drill', 'Dark'],        price: 39, plays: '3.8M',  image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=200', colors: [[138,43,226],[60,0,120]] },
  { id: 6, title: 'PULSE 808',   producer: 'Metro Shadows',  bpm: 110, key: 'B Min',   tags: ['Trap', 'Bouncy'],       price: 29, plays: '7.6M',  image: 'https://plus.unsplash.com/premium_photo-1681335029094-846c770c06ae?auto=format&fit=crop&q=80&w=200', colors: [[255,0,60],[120,0,30]] },
];

const LICENSES = [
  {
    id: 'basic',
    name: 'Basic',
    tag: 'MP3 Lease',
    multiplier: 1,
    features: ['MP3 320kbps', '2.500 copias físicas', '500K streams', 'No radio comercial', 'Crédito: "Prod. por [productor]"'],
  },
  {
    id: 'standard',
    name: 'Standard',
    tag: 'WAV + Stems',
    multiplier: 2.5,
    features: ['WAV sin comprimir + stems', 'Copias ilimitadas', 'Streams ilimitados', 'Radio comercial incluida', 'Crédito: "Prod. por [productor]"'],
  },
  {
    id: 'exclusive',
    name: 'Exclusive',
    tag: 'Derechos Totales',
    multiplier: 5,
    features: ['WAV + stems + proyecto DAW', 'Derechos exclusivos totales', 'Beat retirado del mercado', 'TV / Sync / Publicidad', 'Sin crédito obligatorio'],
  },
];

export default function BeatMarketplace() {
  const navigate = useNavigate();
  const [showLoading, setShowLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [cart, setCart] = useState([]);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState('basic');
  const [showQueue, setShowQueue] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [lyrics, setLyrics] = useState({});
  const [playerTab, setPlayerTab] = useState('licenses'); // 'licenses' | 'lyrics'

  const toggleWishlist = (id) => setWishlist(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isExpanded = sidebarOpen || isSidebarHovered;
  
  const [activeView, setActiveView] = useState('feed');
  const [filterGenre, setFilterGenre] = useState(null);
  const [filterMood, setFilterMood] = useState(null);
  const [bpmMin, setBpmMin] = useState(60);
  const [bpmMax, setBpmMax] = useState(160);
  const [filterKey, setFilterKey] = useState(null);
  
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setIsPlayerExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const anyFilter = filterGenre || filterMood || filterKey || bpmMin > 60 || bpmMax < 160;
  const clearFilters = () => {
    setFilterGenre(null);
    setFilterMood(null);
    setFilterKey(null);
    setBpmMin(60);
    setBpmMax(160);
  };

  const handlePlayToggle = (id) => {
    if (playingId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingId(id);
      setIsPlaying(true);
    }
  };

  const handleBeatDoubleClick = (id) => {
    setPlayingId(id);
    setIsPlaying(true);
    setIsPlayerExpanded(true);
  };

  const currentTrack = BEATS.find(b => b.id === playingId) || null;

  const filteredBeats = BEATS.filter(b => {
    if (filterGenre && !b.tags.includes(filterGenre)) return false;
    if (filterMood && !b.tags.includes(filterMood)) return false;
    if (b.bpm < bpmMin || b.bpm > bpmMax) return false;
    if (filterKey && b.key !== filterKey) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-text font-sans flex flex-col pt-16 pb-32 selection:bg-accent selection:text-white relative overflow-x-hidden">
      {/* Animated ambient background that responds to current track */}
      <div className="fixed inset-0 pointer-events-none z-0 transition-all duration-[2000ms]">
        <div className="absolute inset-0 bg-[#050505]" />
        {currentTrack && isPlaying ? (
          <>
            <div className="absolute top-0 left-0 w-[60vw] h-[60vh] rounded-full blur-[200px] opacity-10 transition-all duration-[3000ms]" style={{ background: `rgba(${currentTrack.colors[0].join(',')},1)` }} />
            <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] rounded-full blur-[150px] opacity-8 transition-all duration-[3000ms]" style={{ background: `rgba(${currentTrack.colors[1].join(',')},1)` }} />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-[40vw] h-[40vh] rounded-full blur-[200px] opacity-5" style={{ background: 'rgba(138,43,226,1)' }} />
            <div className="absolute bottom-0 right-1/4 w-[30vw] h-[30vh] rounded-full blur-[150px] opacity-5" style={{ background: 'rgba(80,0,180,1)' }} />
          </>
        )}
      </div>
      
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
          {/* iPod Easter Egg Trigger */}
          {currentTrack && (
            <button
              onClick={() => setIsPlayerExpanded(true)}
              title="Open iPod Player"
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-accent/40 transition-all group"
              style={{ boxShadow: isPlaying ? '0 0 12px rgba(138,43,226,0.3)' : 'none' }}
            >
              <span className="relative flex h-2 w-2">
                {isPlaying && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              <span className="font-ui text-[10px] text-white/70 group-hover:text-white uppercase tracking-widest hidden sm:inline">
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
              <ChevronDown className="w-3 h-3 text-white/40 rotate-180 group-hover:text-white transition-colors" />
            </button>
          )}
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
      <div className="relative z-10 flex-1 max-w-[1600px] w-full mx-auto flex gap-6 px-4 md:px-6 pt-6">
        
{/* SIDEBAR WRAPPER to prevent layout shift */}
        <div 
          className="hidden lg:block shrink-0 transition-all duration-300 relative z-30" 
          style={{ width: sidebarOpen ? 256 : 60 }}
        >
          <aside
            className="fixed top-28 flex flex-col transition-all duration-300 group overflow-hidden bg-surface/80 backdrop-blur-xl rounded-2xl border border-white/5"
            style={{ width: isExpanded ? 256 : 60, height: 'calc(100vh - 17rem)', paddingBottom: '1rem' }}
            onMouseEnter={() => !sidebarOpen && setIsSidebarHovered(true)}
            onMouseLeave={() => !sidebarOpen && setIsSidebarHovered(false)}
          >
            <div className="flex flex-col h-full p-3 overflow-y-auto overflow-x-hidden scrollbar-none custom-scroll">
              
              {/* Toggle button */}
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-black/40 hover:bg-white/10 transition-colors mb-6 shrink-0 mx-auto lg:mx-0"
              >
                {sidebarOpen ? <ChevronLeft className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
              </button>

              {/* Discover */}
              <div className="flex flex-col gap-1 mb-6">
                <h3 className={`font-ui text-[10px] text-text/50 uppercase tracking-widest pl-2 mb-2 transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Discover</h3>
                
                <button onClick={() => setActiveView('feed')} className="w-full flex items-center justify-start gap-3 p-2 rounded-xl font-bold transition-all hover:bg-white/5 group-btn" style={{ background: activeView === 'feed' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeView === 'feed' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  <Activity className={`w-5 h-5 shrink-0 ${activeView === 'feed' ? 'text-accent' : ''}`} />
                  <span className={`whitespace-nowrap transition-all duration-300 font-ui text-sm ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Feed</span>
                  {activeView === 'feed' && isExpanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_#8A2BE2]"></div>}
                </button>
                
                <button onClick={() => setActiveView('charts')} className="w-full flex items-center justify-start gap-3 p-2 rounded-xl font-bold transition-all hover:bg-white/5 group-btn" style={{ background: activeView === 'charts' ? 'rgba(255,255,255,0.08)' : 'transparent', color: activeView === 'charts' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  <TrendingUp className={`w-5 h-5 shrink-0 ${activeView === 'charts' ? 'text-accent' : ''}`} />
                  <span className={`whitespace-nowrap transition-all duration-300 font-ui text-sm ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Top Charts</span>
                  {activeView === 'charts' && isExpanded && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_#8A2BE2]"></div>}
                </button>
              </div>

              <div className="h-px w-full bg-white/5 mb-6"></div>

              {/* Filters */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-2 text-text/50">
                  <SlidersHorizontal className="w-5 h-5 shrink-0" />
                  <h3 className={`font-ui text-[10px] uppercase tracking-widest transition-all duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>Filters</h3>
                </div>

                {anyFilter && isExpanded && (
                  <button onClick={clearFilters} className="mx-2 mb-2 py-1.5 rounded-full font-ui text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/30 hover:bg-accent/10 transition-colors">
                    Clear filters
                  </button>
                )}

                {/* Genre */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 p-2 group cursor-pointer" title="Genre">
                     <Music className={`w-5 h-5 shrink-0 transition-colors ${filterGenre ? 'text-accent' : 'text-white/40 group-hover:text-white'}`} />
                     <p className={`text-sm font-bold text-white transition-all duration-300 ${isExpanded ? 'opacity-100 flex gap-2 items-center' : 'opacity-0 hidden'}`}>
                       Genre {filterGenre && <span className="text-accent text-[10px]">({filterGenre})</span>}
                     </p>
                  </div>
                  <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 px-2 mt-1 mb-4' : 'opacity-0 h-0 m-0'}`} style={{ maxHeight: isExpanded ? '500px' : '0px' }}>
                    <div className="flex flex-wrap gap-1.5">
                      {['Trap','R&B','Drill','Synthwave','Techno','Industrial','Hard','Bouncy','Chill'].map(g => (
                        <button key={g} onClick={() => setFilterGenre(filterGenre === g ? null : g)} className="px-2.5 py-1 rounded-full border text-[10px] font-ui transition-all" style={{ background: filterGenre === g ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.04)', borderColor: filterGenre === g ? 'rgba(138,43,226,0.5)' : 'rgba(255,255,255,0.1)', color: filterGenre === g ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mood */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 p-2 group cursor-pointer" title="Mood">
                     <Zap className={`w-5 h-5 shrink-0 transition-colors ${filterMood ? 'text-accent' : 'text-white/40 group-hover:text-white'}`} />
                     <p className={`text-sm font-bold text-white transition-all duration-300 ${isExpanded ? 'opacity-100 flex items-center gap-2' : 'opacity-0 hidden'}`}>
                       Mood {filterMood && <span className="text-accent text-[10px]">({filterMood})</span>}
                     </p>
                  </div>
                  <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 px-2 mt-1 mb-4' : 'opacity-0 h-0 m-0'}`} style={{ maxHeight: isExpanded ? '500px' : '0px' }}>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dark','Aggressive','Chill','Sad'].map(m => (
                        <button key={m} onClick={() => setFilterMood(filterMood === m ? null : m)} className="px-2.5 py-1 rounded-full border text-[10px] font-ui transition-all" style={{ background: filterMood === m ? 'rgba(138,43,226,0.2)' : 'rgba(255,255,255,0.04)', borderColor: filterMood === m ? 'rgba(138,43,226,0.5)' : 'rgba(255,255,255,0.1)', color: filterMood === m ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BPM */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 p-2 group cursor-pointer" title="BPM">
                     <Activity className={`w-5 h-5 shrink-0 transition-colors ${bpmMin > 80 || bpmMax < 160 ? 'text-accent' : 'text-white/40 group-hover:text-white'}`} />
                     <p className={`text-sm font-bold text-white transition-all duration-300 ${isExpanded ? 'opacity-100 flex items-center gap-2' : 'opacity-0 hidden'}`}>
                       BPM <span className="font-ui text-[9px] text-text/40">{bpmMin}–{bpmMax}</span>
                     </p>
                  </div>
                  <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 px-2 mt-1 mb-4' : 'opacity-0 h-0 m-0'}`} style={{ maxHeight: isExpanded ? '500px' : '0px' }}>
                    <div className="flex gap-2">
                      <input type="number" value={bpmMin} onChange={e => setBpmMin(Number(e.target.value))} className="w-14 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-ui text-white focus:outline-none focus:border-accent" min={60} max={bpmMax} />
                      <span className="text-white/30 font-ui text-xs self-center">–</span>
                      <input type="number" value={bpmMax} onChange={e => setBpmMax(Number(e.target.value))} className="w-14 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs font-ui text-white focus:outline-none focus:border-accent" min={bpmMin} max={220} />
                    </div>
                  </div>
                </div>

                {/* KEY */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 p-2 group cursor-pointer" title="Key">
                     <Keyboard className={`w-5 h-5 shrink-0 transition-colors ${filterKey ? 'text-accent' : 'text-white/40 group-hover:text-white'}`} />
                     <p className={`text-sm font-bold text-white transition-all duration-300 ${isExpanded ? 'opacity-100 flex items-center gap-2' : 'opacity-0 hidden'}`}>
                       Key {filterKey && <span className="text-accent text-[10px]">({filterKey})</span>}
                     </p>
                  </div>
                  <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'opacity-100 px-2 mt-1 mb-4' : 'opacity-0 h-0 m-0'}`} style={{ maxHeight: isExpanded ? '500px' : '0px' }}>
                    <div className="max-h-32 overflow-y-auto flex flex-wrap gap-1.5 custom-scroll pr-1">
                      {KEY_OPTIONS.map(k => (
                        <button key={k} onClick={() => setFilterKey(filterKey === k ? null : k)} className="px-2 py-0.5 rounded-md border font-ui text-[9px] transition-all" style={{ background: filterKey === k ? 'rgba(138,43,226,0.25)' : 'rgba(255,255,255,0.03)', borderColor: filterKey === k ? 'rgba(138,43,226,0.5)' : 'rgba(255,255,255,0.08)', color: filterKey === k ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            
            <style>{`.custom-scroll::-webkit-scrollbar{width:4px;} .custom-scroll::-webkit-scrollbar-track{background:transparent;} .custom-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1); border-radius:4px;}`}</style>
          </aside>
        </div>

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
              <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-none lg:justify-center px-4">
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

          {/* Beat Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-2xl text-white">Trending Beats</h2>
              <span className="font-ui text-xs text-white/30">{filteredBeats.length} tracks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBeats.map((beat, i) => {
                const isCurrentlyPlaying = playingId === beat.id;
                const color0 = `rgba(${beat.colors[0].join(',')},1)`;
                const color1 = `rgba(${beat.colors[1].join(',')},1)`;

                return (
                  /* Animated border wrapper — same technique as PokemonCard */
                  <div
                    key={beat.id}
                    className="relative rounded-[22px] p-[2px] cursor-pointer"
                    style={{
                      boxShadow: isCurrentlyPlaying
                        ? `0 0 40px ${color0}40, 0 20px 60px rgba(0,0,0,0.6)`
                        : '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                    onClick={() => handlePlayToggle(beat.id)}
                    onDoubleClick={() => handleBeatDoubleClick(beat.id)}
                  >
                    {/* Spinning conic border layer */}
                    <div
                      className="absolute inset-0 rounded-[22px] overflow-hidden"
                      aria-hidden="true"
                    >
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%]"
                        style={{
                          background: isCurrentlyPlaying
                            ? `conic-gradient(from 0deg, transparent 0 300deg, ${color0} 360deg)`
                            : 'conic-gradient(from 0deg, transparent 0 330deg, rgba(255,255,255,0.2) 360deg)',
                          animation: isCurrentlyPlaying
                            ? 'spin 2s linear infinite'
                            : 'spin 6s linear infinite',
                        }}
                      />
                    </div>

                    {/* Card body (clips the border to 2px) */}
                    <div
                      className="relative rounded-[20px] overflow-hidden group"
                      style={{
                        background: isCurrentlyPlaying
                          ? `linear-gradient(135deg, ${color0}15 0%, #0a0a0a 60%)`
                          : 'linear-gradient(135deg,#111 0%,#0a0a0a 100%)',
                      }}
                    >
                    {/* Glow inner overlay on playing */}
                    {isCurrentlyPlaying && (
                      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: `inset 0 0 60px ${color0}20` }} />
                    )}

                    {/* Top: Art + overlay */}
                    <div className="relative h-40 overflow-hidden">
                      <img src={beat.image} alt={beat.title} className={`w-full h-full object-cover transition-transform duration-700 ${ isCurrentlyPlaying ? 'scale-110' : 'group-hover:scale-105' }`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-transparent" />

                      {/* Color accent top bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: `linear-gradient(90deg, ${color0}, ${color1})` }} />
                      {/* Wishlist heart */}
                      <button
                        onClick={e => { e.stopPropagation(); toggleWishlist(beat.id); }}
                        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-md border z-20"
                        style={{
                          background: wishlist.includes(beat.id) ? `${color0}30` : 'rgba(0,0,0,0.4)',
                          borderColor: wishlist.includes(beat.id) ? color0 : 'rgba(255,255,255,0.2)',
                        }}
                      >
                        <Heart className="w-3.5 h-3.5" style={{ color: wishlist.includes(beat.id) ? color0 : 'rgba(255,255,255,0.6)', fill: wishlist.includes(beat.id) ? color0 : 'none' }}/>
                      </button>

                      {/* Play button center */}
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${ isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100' }`}>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 shadow-2xl transition-transform duration-300 ${ isCurrentlyPlaying ? 'scale-100' : 'scale-75 group-hover:scale-100' }`}
                          style={{ background: isCurrentlyPlaying ? color0 : 'rgba(255,255,255,0.15)' }}
                        >
                          {isCurrentlyPlaying && isPlaying
                            ? <Pause className="w-6 h-6 text-white fill-current drop-shadow" />
                            : <Play className="w-6 h-6 text-white fill-current ml-1 drop-shadow" />
                          }
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="absolute bottom-3 left-3 flex gap-1.5">
                        {beat.tags.map(tag => (
                          <span key={tag} className="font-ui text-[9px] px-2 py-0.5 rounded-full bg-black/50 border border-white/10 text-white/70 backdrop-blur-sm">{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom: Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-heading font-bold text-lg text-white truncate leading-tight">{beat.title}</h3>
                          <p className="font-ui text-xs text-white/50 truncate mt-0.5">{beat.producer} · {beat.plays}</p>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); setCart([...cart, beat]); }}
                          className="shrink-0 font-ui text-xs font-bold px-3 py-1.5 rounded-full transition-all border"
                          style={{
                            background: `${color0}20`,
                            borderColor: `${color0}50`,
                            color: color0,
                            boxShadow: isCurrentlyPlaying ? `0 0 16px ${color0}40` : 'none'
                          }}
                        >
                          {beat.price}€
                        </button>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 font-ui text-[10px] text-white/40">
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3" />{beat.bpm}</span>
                          <span>{beat.key}</span>
                        </div>

                        {/* Animated waveform bars */}
                        <div className="ml-auto flex items-end gap-[3px] h-5">
                          {[3,5,4,7,5,3,6,4].map((h,idx) => (
                            <div
                              key={idx}
                              className="w-[3px] rounded-full"
                              style={{
                                height: isCurrentlyPlaying && isPlaying ? `${h * 2}px` : '3px',
                                background: isCurrentlyPlaying ? color0 : 'rgba(255,255,255,0.15)',
                                transition: 'height 0.3s ease, background 0.5s ease',
                                animation: isCurrentlyPlaying && isPlaying ? `waveform ${0.4 + idx * 0.08}s ease-in-out infinite` : 'none',
                                transformOrigin: 'bottom',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    </div>{/* end card body */}
                  </div>
                );
              })}
            </div>

            {filteredBeats.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/30">
                <Music className="w-12 h-12 mb-4 opacity-30" />
                <p className="font-ui text-sm">No beats match your filters</p>
              </div>
            )}
            
            {/* ── Beatstars-style list ───────────────────────────── */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-xl text-white">New Releases</h2>
                <span className="font-ui text-xs text-white/30">{BEATS.length * 2} tracks</span>
              </div>
              {/* Header row */}
              <div className="hidden md:grid grid-cols-[24px_40px_1fr_80px_60px_60px_70px_36px] gap-4 px-3 pb-2 border-b border-white/5 font-ui text-[10px] text-white/25 uppercase tracking-widest">
                <span>#</span><span/><span>Título</span><span>Género</span><span>BPM</span><span>Key</span><span className="text-right">Precio</span><span/>
              </div>
              {[...BEATS, ...BEATS.map(b => ({
                ...b,
                id: b.id + 100,
                title: b.title + ' (VIP)',
                price: Math.round(b.price * 1.4),
              }))].map((beat, i) => {
                const isActive = playingId === beat.id;
                const [r,g,b2] = beat.colors[0];
                return (
                  <div
                    key={beat.id}
                    onClick={() => handlePlayToggle(beat.id)}
                    onDoubleClick={() => handleBeatDoubleClick(beat.id)}
                    className="grid grid-cols-[24px_40px_1fr_auto] md:grid-cols-[24px_40px_1fr_80px_60px_60px_70px_36px] gap-4 px-3 py-3 items-center rounded-xl cursor-pointer transition-all duration-200 group"
                    style={{ background: isActive ? `rgba(${r},${g},${b2},0.08)` : 'transparent' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* # */}
                    <span className="font-ui text-xs text-white/25 text-right select-none">
                      {isActive && isPlaying
                        ? <span className="flex gap-[2px] items-end h-3">{[3,5,4].map((h,k) => <span key={k} className="w-[2px] rounded-full" style={{ height:`${h*3}px`, background:`rgb(${r},${g},${b2})`, animation:`waveform ${0.3+k*0.1}s ease-in-out infinite alternate` }}/>)}</span>
                        : i + 1}
                    </span>
                    {/* Thumb */}
                    <img src={beat.image} alt={beat.title} className="w-10 h-10 rounded-lg object-cover border border-white/10"/>
                    {/* Title + producer */}
                    <div className="min-w-0">
                      <p className="font-heading font-bold text-sm text-white truncate leading-tight" style={{ color: isActive ? `rgb(${r},${g},${b2})` : '#fff' }}>{beat.title}</p>
                      <p className="font-ui text-[10px] text-white/40 truncate">{beat.producer} · {beat.plays}</p>
                    </div>
                    {/* Genre */}
                    <span className="hidden md:inline font-ui text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40 bg-white/3 truncate">{beat.tags[0]}</span>
                    {/* BPM */}
                    <span className="hidden md:inline font-ui text-xs text-white/30">{beat.bpm}</span>
                    {/* Key */}
                    <span className="hidden md:inline font-ui text-xs text-white/30">{beat.key}</span>
                    {/* Price */}
                    <span className="font-heading font-bold text-sm text-right" style={{ color: `rgb(${r},${g},${b2})` }}>{beat.price}€</span>
                    {/* Cart */}
                    <button
                      onClick={e => { e.stopPropagation(); setCart(c => [...c, beat]); }}
                      className="hidden md:flex w-8 h-8 rounded-full items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                    >
                      <ShoppingCart className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>

      {/* GLOBAL AUDIO PLAYER FOOTER & EXPANDED VIEW */}
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
            <span className="w-8 text-right">0:00</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full relative cursor-pointer overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  background: isPlaying ? '#8A2BE2' : 'rgba(255,255,255,0.3)',
                  width: '0%',
                  animation: isPlaying ? 'progress-bar 165s linear forwards' : 'none',
                  transition: 'background 0.3s',
                }}
              />
            </div>
            <span className="w-8">2:45</span>
          </div>
        </div>

        {/* Right: Triggers & Volume (Balances the flex layout) */}
        <div className="hidden md:flex items-center justify-end gap-6 w-1/3">
           <button
             onClick={() => { setPlayerTab('lyrics'); setIsPlayerExpanded(true); }}
             className={`transition-colors relative ${playerTab === 'lyrics' && isPlayerExpanded ? 'text-white' : 'text-white/40 hover:text-white'}`}
             title="Escribir letra"
           >
             <Pencil className="w-4 h-4" />
             {currentTrack && lyrics[currentTrack.id] && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"/>}
           </button>
           <button onClick={() => setShowQueue(q => !q)} className={`transition-colors relative ${showQueue ? 'text-white' : 'text-white/40 hover:text-white'}`} title="Cola de reproducción">
              <Activity className="w-5 h-5" />
              {showQueue && <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full"/>}
           </button>
           <button onClick={() => setShowCheckout(true)} className="relative text-white/40 hover:text-white transition-colors" title="Carrito">
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full font-ui text-[9px] font-bold flex items-center justify-center text-white">{cart.length}</span>}
           </button>
           <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-white/40" />
              <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden cursor-pointer group">
                 <div className="w-2/3 h-full bg-white/50 group-hover:bg-white transition-colors rounded-full"></div>
              </div>
           </div>
        </div>
      </div>

      {/* Backdrop dim when iPod is open */}
      {isPlayerExpanded && currentTrack && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setIsPlayerExpanded(false)}
        />
      )}

      {/* EXTENDED "TOP CENTER" iPod PLAYER — appears below navbar */}
      <div 
         className={`fixed top-20 left-1/2 -translate-x-1/2 w-[98vw] md:w-[94vw] max-w-[1000px] z-[100] transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isPlayerExpanded && currentTrack ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-[130%] opacity-0 pointer-events-none scale-95'}`}
      >
         <div className="w-full bg-[#0a0a0a]/95 backdrop-blur-[40px] rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] overflow-hidden max-h-[80vh] overflow-y-auto flex flex-col relative before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05)_0%,transparent_60%)] scrollbar-none">
           
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
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h2 className="font-heading font-black text-3xl md:text-5xl text-white mb-1 md:mb-2 truncate drop-shadow-lg">{currentTrack?.title}</h2>
                        <div className="flex items-center gap-3">
                          <p className="font-ui text-xs md:text-sm text-white/50 uppercase tracking-[0.2em] truncate">{currentTrack?.producer}</p>
                          {currentTrack && (
                            <button
                              onClick={() => toggleWishlist(currentTrack.id)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 shrink-0"
                              style={{
                                background: wishlist.includes(currentTrack.id) ? `rgba(${currentTrack.colors[0].join(',')},0.15)` : 'transparent',
                                borderColor: wishlist.includes(currentTrack.id) ? `rgba(${currentTrack.colors[0].join(',')},0.5)` : 'rgba(255,255,255,0.1)',
                              }}
                            >
                              <Heart className="w-3 h-3" style={{ color: wishlist.includes(currentTrack.id) ? `rgb(${currentTrack.colors[0].join(',')})` : 'rgba(255,255,255,0.3)', fill: wishlist.includes(currentTrack.id) ? `rgb(${currentTrack.colors[0].join(',')})` : 'none' }}/>
                              <span className="font-ui text-[9px]" style={{ color: wishlist.includes(currentTrack.id) ? `rgb(${currentTrack.colors[0].join(',')})` : 'rgba(255,255,255,0.3)' }}>{wishlist.includes(currentTrack.id) ? 'Guardado' : 'Guardar'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                 </div>

                 {/* Top Center iPod Scrubber */}
                 <div className="w-full mb-6 md:mb-10 px-4 md:px-0">
                    <div className="flex justify-between items-center mb-3 font-ui text-[10px] text-white/40 font-bold tracking-widest">
                      <span>0:45</span>
                      <span>2:45</span>
                    </div>
                    <div className="h-2.5 bg-black/40 rounded-full w-full relative overflow-hidden cursor-pointer shadow-inner border border-white/5">
                      <div
                        className="absolute left-0 top-0 bottom-0 rounded-full"
                        style={{
                          background: currentTrack ? `rgb(${currentTrack.colors[0].join(',')})` : '#fff',
                          boxShadow: currentTrack && isPlaying ? `0 0 16px rgba(${currentTrack.colors[0].join(',')},0.8)` : 'none',
                          width: '0%',
                          animation: isPlaying ? 'progress-bar 165s linear forwards' : 'none',
                          transition: 'background 0.3s',
                        }}
                      />
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

                 {/* Tabs: Licencias | Letra */}
                 <div className="w-full pt-6 md:pt-8 px-2 md:px-0">
                   <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-xl border border-white/5">
                     {[{id:'licenses',label:'Licencias'},{id:'lyrics',label:'Escribir Letra'}].map(tab => (
                       <button
                         key={tab.id}
                         onClick={() => setPlayerTab(tab.id)}
                         className="flex-1 py-2 rounded-lg font-ui text-xs font-bold tracking-wide transition-all duration-200"
                         style={{
                           background: playerTab === tab.id ? currentTrack ? `rgba(${currentTrack.colors[0].join(',')},0.2)` : 'rgba(255,255,255,0.1)' : 'transparent',
                           color: playerTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                           borderBottom: playerTab === tab.id && currentTrack ? `1px solid rgba(${currentTrack.colors[0].join(',')},0.5)` : '1px solid transparent',
                         }}
                       >
                         {tab.label}
                       </button>
                     ))}
                   </div>

                   {playerTab === 'lyrics' ? (
                     <div className="flex flex-col gap-2">
                       <textarea
                         value={lyrics[currentTrack?.id] || ''}
                         onChange={e => setLyrics(l => ({ ...l, [currentTrack.id]: e.target.value }))}
                         placeholder={"Escribe tu letra aquí...\n\n[Intro]\n\n[Verso 1]\n\n[Estribillo]"}
                         className="w-full h-52 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:border-white/20 leading-relaxed scrollbar-none"
                         style={{ caretColor: currentTrack ? `rgb(${currentTrack.colors[0].join(',')})` : '#8A2BE2' }}
                       />
                       <div className="flex justify-between items-center">
                         <span className="font-ui text-[10px] text-white/20">{(lyrics[currentTrack?.id] || '').length} caracteres</span>
                         {lyrics[currentTrack?.id] && (
                           <button onClick={() => setLyrics(l => ({ ...l, [currentTrack.id]: '' }))} className="font-ui text-[10px] text-white/20 hover:text-red-400 transition-colors">Borrar</button>
                         )}
                       </div>
                     </div>
                   ) : (
                   <div className="flex flex-col gap-2">
                     {LICENSES.map(lic => {
                       const price = currentTrack ? Math.round(currentTrack.price * lic.multiplier) : 0;
                       const isOpen = selectedLicense === lic.id;
                       return (
                         <div
                           key={lic.id}
                           onClick={() => setSelectedLicense(isOpen ? null : lic.id)}
                           className="rounded-xl border cursor-pointer transition-all duration-300 overflow-hidden"
                           style={{
                             borderColor: isOpen ? `rgba(${currentTrack?.colors[0].join(',')},0.5)` : 'rgba(255,255,255,0.07)',
                             background: isOpen ? `rgba(${currentTrack?.colors[0].join(',')},0.08)` : 'rgba(255,255,255,0.03)',
                           }}
                         >
                           {/* Row comprimida — siempre visible */}
                           <div className="flex items-center justify-between px-4 py-3 gap-3">
                             <div className="flex items-center gap-3 min-w-0">
                               <div
                                 className="w-2 h-2 rounded-full shrink-0"
                                 style={{ background: isOpen ? `rgb(${currentTrack?.colors[0].join(',')})` : 'rgba(255,255,255,0.2)' }}
                               />
                               <span className="font-heading font-bold text-sm text-white truncate">{lic.name}</span>
                               <span className="font-ui text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/40 hidden sm:inline">{lic.tag}</span>
                             </div>
                             <div className="flex items-center gap-3 shrink-0">
                               <span className="font-heading font-bold text-sm" style={{ color: isOpen ? `rgb(${currentTrack?.colors[0].join(',')})` : 'rgba(255,255,255,0.6)' }}>
                                 {price}€
                               </span>
                               <ChevronDown
                                 className="w-4 h-4 text-white/30 transition-transform duration-300"
                                 style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                               />
                             </div>
                           </div>
                           {/* Detalle expandido */}
                           <div
                             className="overflow-hidden transition-all duration-300"
                             style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}
                           >
                             <div className="px-4 pb-4 flex flex-col gap-3">
                               <ul className="space-y-1.5">
                                 {lic.features.map(f => (
                                   <li key={f} className="flex items-center gap-2 font-ui text-xs text-white/60">
                                     <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: `rgb(${currentTrack?.colors[0].join(',')})` }} />
                                     {f}
                                   </li>
                                 ))}
                               </ul>
                               <button
                                 onClick={e => {
                                   e.stopPropagation();
                                   const item = { ...currentTrack, licenseId: lic.id, licensePrice: price };
                                   const newCart = [...cart, item];
                                   setCart(newCart);
                                   localStorage.setItem('helicon_cart', JSON.stringify(newCart));
                                   setShowLoading(true);
                                   setTimeout(() => navigate('/checkout'), 1600);
                                 }}
                                 className="w-full py-2.5 rounded-xl font-ui font-bold text-xs uppercase tracking-widest text-white transition-all"
                                 style={{ background: `rgb(${currentTrack?.colors[0].join(',')})` }}
                               >
                                 Comprar por {price}€
                               </button>
                             </div>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                   )}
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

      {/* ── QUEUE PANEL ─────────────────────────────────────────── */}
      <div className={`fixed top-0 right-0 h-full w-80 z-[200] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${showQueue ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full bg-[#0a0a0a]/98 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between px-5 pt-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="font-heading font-bold text-white text-lg">Cola</h2>
              <p className="font-ui text-xs text-white/30 mt-0.5">{BEATS.filter(b => b.id !== playingId).length} beats pendientes</p>
            </div>
            <button onClick={() => setShowQueue(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
              <ChevronDown className="w-4 h-4 rotate-[-90deg]"/>
            </button>
          </div>
          {currentTrack && (
            <div className="px-5 py-4 border-b border-white/5">
              <p className="font-ui text-[10px] text-white/30 uppercase tracking-widest mb-2">Reproduciendo</p>
              <div className="flex items-center gap-3">
                <img src={currentTrack.image} className="w-10 h-10 rounded-lg object-cover border border-white/10"/>
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-bold text-sm text-accent truncate">{currentTrack.title}</p>
                  <p className="font-ui text-[10px] text-white/40">{currentTrack.producer}</p>
                </div>
                <div className="flex gap-[2px] items-end h-4">
                  {[3,5,4,6,3].map((h,k) => <span key={k} className="w-[2px] rounded-full bg-accent" style={{ height:`${h*3}px`, animation: isPlaying ? `waveform ${0.3+k*0.1}s ease-in-out infinite alternate` : 'none' }}/>)}
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto scrollbar-none px-5 py-4">
            <p className="font-ui text-[10px] text-white/30 uppercase tracking-widest mb-3">Siguiente</p>
            <div className="flex flex-col gap-1">
              {BEATS.filter(b => b.id !== playingId).map((b, i) => (
                <div key={b.id} onClick={() => { setPlayingId(b.id); setIsPlaying(true); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group">
                  <span className="font-ui text-xs text-white/20 w-4 text-right shrink-0">{i+1}</span>
                  <img src={b.image} className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"/>
                  <div className="min-w-0 flex-1">
                    <p className="font-heading font-bold text-sm text-white truncate group-hover:text-accent transition-colors">{b.title}</p>
                    <p className="font-ui text-[10px] text-white/40 truncate">{b.producer}</p>
                  </div>
                  <span className="font-heading font-bold text-xs text-white/40 shrink-0">{b.price}€</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {showQueue && <div className="fixed inset-0 z-[199]" onClick={() => setShowQueue(false)}/>}

      {/* ── CHECKOUT PANEL ──────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCheckout(false)}/>
          <div className="relative w-full md:max-w-lg bg-[#0a0a0a] border border-white/10 rounded-t-3xl md:rounded-3xl shadow-[0_-20px_80px_rgba(0,0,0,0.8)] overflow-hidden z-10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div>
                <h2 className="font-heading font-bold text-xl text-white">Tu Carrito</h2>
                <p className="font-ui text-xs text-white/30">{cart.length} {cart.length === 1 ? 'beat' : 'beats'}</p>
              </div>
              <button onClick={() => setShowCheckout(false)} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <ChevronDown className="w-4 h-4"/>
              </button>
            </div>
            {/* Items */}
            <div className="flex-1 overflow-y-auto scrollbar-none px-6 py-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-white/20">
                  <ShoppingCart className="w-10 h-10 mb-3"/>
                  <p className="font-ui text-sm">El carrito está vacío</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cart.map((item, i) => {
                    const [r,g,b2] = item.colors[0];
                    const lic = LICENSES.find(l => l.id === (item.licenseId || 'basic'));
                    return (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-white/5 bg-white/2">
                        <img src={item.image} className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"/>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-sm text-white truncate">{item.title}</p>
                          <p className="font-ui text-[10px] text-white/40">{item.producer}</p>
                          <span className="font-ui text-[9px] px-2 py-0.5 rounded-full border mt-1 inline-block" style={{ borderColor:`rgba(${r},${g},${b2},0.4)`, color:`rgb(${r},${g},${b2})`, background:`rgba(${r},${g},${b2},0.08)` }}>{lic?.tag || 'MP3 Lease'}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="font-heading font-bold text-sm text-white">{item.licensePrice || item.price}€</span>
                          <button onClick={() => setCart(c => c.filter((_,j) => j !== i))} className="font-ui text-[10px] text-white/20 hover:text-red-400 transition-colors">Quitar</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-6 py-5 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-ui text-sm text-white/50">Total</span>
                  <span className="font-heading font-bold text-2xl text-white">{cart.reduce((s,b) => s + (b.licensePrice || b.price), 0)}€</span>
                </div>
                <button className="w-full py-4 rounded-2xl font-ui font-bold text-sm uppercase tracking-widest text-white bg-accent hover:bg-[#9d3df2] transition-all shadow-[0_0_30px_rgba(138,43,226,0.4)] hover:shadow-[0_0_50px_rgba(138,43,226,0.6)]">
                  Pagar con Stripe
                </button>
                <p className="font-ui text-[10px] text-white/20 text-center">Descarga inmediata tras el pago · Licencia entregada por email</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
