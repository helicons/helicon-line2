import sys

with open('./src/BeatMarketplace.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports additions
imports_target = "ArrowLeft } from 'lucide-react';"
imports_repl = "ArrowLeft, TrendingUp, Music, Keyboard, Zap } from 'lucide-react';"
content = content.replace(imports_target, imports_repl)

# 2. State modifications
state_target = """  const [bpmMax, setBpmMax]             = useState(160);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);"""
state_repl = """  const [bpmMax, setBpmMax]             = useState(160);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const isExpanded = sidebarOpen || isSidebarHovered;"""
content = content.replace(state_target, state_repl)

# 3. Sidebar modifications
start_sidebar = content.find("{/* SIDEBAR FILTERS */}")
end_sidebar = content.find("</aside>", start_sidebar) + 8

new_sidebar = """{/* SIDEBAR WRAPPER to prevent layout shift */}
        <div 
          className="hidden lg:block shrink-0 transition-all duration-300 relative z-30" 
          style={{ width: sidebarOpen ? 256 : 60 }}
        >
          <aside
            className="fixed top-28 flex flex-col transition-all duration-300 group overflow-hidden bg-surface/80 backdrop-blur-xl rounded-2xl border border-white/5"
            style={{ width: isExpanded ? 256 : 60, height: 'calc(100vh - 8rem)' }}
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
        </div>"""

if start_sidebar != -1 and end_sidebar != -1:
    content = content[:start_sidebar] + new_sidebar + content[end_sidebar:]
    with open('./src/BeatMarketplace.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("sidebar patched successfully!")
else:
    print("could not find sidebar boundaries text: " + str(start_sidebar) + " " + str(end_sidebar))
