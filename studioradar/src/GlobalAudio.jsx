import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ListMusic, Activity } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const HITS = [
  { 
    id: 'h1', 
    title: 'HELICON HYPERDRIVE', 
    producer: 'Helicon Origin', 
    file: '/bg-audio.wav',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200'
  },
  { 
    id: 'h2', 
    title: 'CYBERPUNK NIGHTS', 
    producer: 'Mod-A', 
    file: '/bg-audio.wav', 
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=200'
  },
  { 
    id: 'h3', 
    title: 'RETRO FUTURE', 
    producer: 'Analog Soul', 
    file: '/bg-audio.wav',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200'
  }
];

const HitsOverlay = ({ trackIdx, setTrackIdx, isPlaying, onTogglePlay, onClose }) => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-md bg-[#111] rounded-[2rem] border border-white/10 p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="font-heading font-bold text-2xl text-white mb-6 flex items-center gap-3">
          <ListMusic className="w-6 h-6 text-accent" />
          Featured Hits
        </h2>
        
        <div className="space-y-3">
          {HITS.map((track, i) => (
            <div 
              key={track.id}
              onClick={() => { setTrackIdx(i); if(!isPlaying) onTogglePlay(); }}
              className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all border ${trackIdx === i ? 'bg-accent/10 border-accent/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
            >
              <img src={track.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${trackIdx === i ? 'text-accent' : 'text-white'}`}>{track.title}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{track.producer}</p>
              </div>
              {trackIdx === i && isPlaying && (
                <div className="flex items-end gap-0.5 h-3">
                  {[1,2,3].map(j => <div key={j} className="w-1 bg-accent rounded-full animate-[waveform_0.6s_ease-in-out_infinite]" style={{ animationDelay: `${j*0.1}s` }} />)}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-accent text-white font-bold rounded-xl hover:bg-accent/80 transition-all uppercase tracking-widest text-xs"
        >
          Back to Player
        </button>
      </div>
    </div>
  );
};

export default function GlobalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [minimized, setMinimized] = useState(true);
  const [trackIdx, setTrackIdx] = useState(0);
  const [showHits, setShowHits] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef(null);
  const location = useLocation();
  const isOnBeatsPage = location.pathname === '/beats';
  const isLanding = location.pathname === '/';
  
  const track = HITS[trackIdx];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, volume, isMuted, trackIdx]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  if (isOnBeatsPage) return null;

  return (
    <>
      <audio ref={audioRef} src={track.file} loop />
      
      {showHits && (
        <HitsOverlay 
          trackIdx={trackIdx} 
          setTrackIdx={setTrackIdx} 
          isPlaying={isPlaying} 
          onTogglePlay={togglePlay} 
          onClose={() => setShowHits(false)} 
        />
      )}

      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-8 right-8 z-[9999] flex flex-col items-center justify-end px-6 pb-2 pt-1 rounded-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:bg-[#1a1a1a]/90 transition-all duration-300 cursor-pointer group scale-100 hover:scale-105"
        >
          <div className="flex items-end gap-1 h-4 opacity-50 group-hover:opacity-100 transition-opacity mb-1">
            {[2,4,3,5,2].map((h,i) => (
              <div 
                key={i} 
                className={`w-[2px] rounded-full bg-accent ${isPlaying ? 'animate-[waveform_0.8s_ease-in-out_infinite]' : ''}`} 
                style={{ height: `${h*(isPlaying?3:1.5)}px`, animationDelay: `${i*0.1}s` }} 
              />
            ))}
          </div>
          <div className="w-10 h-1 bg-white/20 rounded-full group-hover:bg-accent/40 transition-colors"></div>
        </button>
      ) : (
        <div className="fixed bottom-8 right-8 z-[9999] animate-in slide-in-from-right-12 duration-500" style={{ width: 260 }}>
          {/* iPod physical enclosure */}
          <div className="w-full bg-[#e8e8e8] rounded-[2.5rem] p-4 shadow-[20px_40px_80px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,1)] border border-white/30 relative overflow-hidden flex flex-col items-center">
            
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/20 to-transparent z-10"></div>
            
            {/* Close Button top center */}
            <button onClick={() => setMinimized(true)} className="w-10 h-1.5 bg-black/10 rounded-full mb-4 hover:bg-black/20 transition-colors relative z-20"></button>

            {/* Screen Area (Braun OLED Style) */}
            <div className="w-full bg-[#0a0a0a] rounded-xl p-4 mb-6 shadow-[inner_0_4px_10px_rgba(0,0,0,0.8)] border border-white/5 relative group overflow-hidden">
               <div className="relative z-10 flex flex-col h-24">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[9px] text-accent uppercase tracking-[0.2em] mb-1">Now Playing</p>
                      <h3 className="font-heading font-black text-xs text-white truncate uppercase">{track.title}</h3>
                    </div>
                    {isPlaying && <Activity className="w-3 h-3 text-accent animate-pulse" />}
                  </div>
                  
                  {/* Digital Waveform Screen */}
                  <div className="flex-1 flex items-center justify-center gap-[3px] mt-2">
                    {Array.from({length: 24}).map((_, i) => {
                      const heights = [30, 60, 45, 80, 50, 90, 40, 70, 35, 85, 55, 65];
                      return (
                        <div 
                          key={i} 
                          className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-accent shadow-[0_0_5px_rgba(138,43,226,0.5)]' : 'bg-white/10'}`}
                          style={{ 
                            height: isPlaying ? `${heights[i % heights.length]}%` : '15%',
                            animation: isPlaying ? `waveform 0.8s ease-in-out infinite ${i * 0.05}s` : 'none'
                          }}
                        />
                      );
                    })}
                  </div>
               </div>
               {/* Reflection */}
               <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 skew-y-[-10deg] translate-y-[-50%] pointer-events-none"></div>
            </div>

            {/* Controls Area */}
            <div className="w-full flex flex-col items-center gap-6 px-2 pb-2">
               {/* Click Wheel / Buttons Layout */}
               <div className="relative w-40 h-40 rounded-full bg-white shadow-[0_10px_20px_rgba(0,0,0,0.1),inset_0_-2px_5px_rgba(0,0,0,0.05)] border border-gray-200 flex items-center justify-center group overflow-hidden">
                  
                  {/* Internal grid for segments (conceptual) */}
                  <button onClick={() => setShowHits(true)} className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] font-bold text-gray-400 hover:text-black uppercase tracking-widest transition-colors z-20">Hits</button>
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors z-20"><SkipForward className="w-5 h-5 fill-current" /></button>
                  <button className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors z-20"><SkipBack className="w-5 h-5 fill-current" /></button>
                  <button onClick={() => setIsMuted(!isMuted)} className="absolute bottom-4 left-1/2 -translate-x-1/2 text-gray-400 hover:text-black transition-colors z-20">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  {/* Central Play/Pause Button */}
                  <button 
                    onClick={togglePlay}
                    className="w-16 h-16 rounded-full bg-[#fcfcfc] border border-gray-100 shadow-[0_8px_15px_rgba(0,0,0,0.1),inset_0_2px_2px_white] hover:scale-105 active:scale-95 active:shadow-inner transition-all flex items-center justify-center z-30"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 text-black fill-current" /> : <Play className="w-6 h-6 text-black fill-current ml-1" />}
                  </button>

                  {/* Tactile Grooves */}
                  <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-gray-50/50 pointer-events-none"></div>
               </div>

               {/* Design Brand Text */}
               <div className="flex flex-col items-center opacity-30 select-none">
                  <p className="font-heading font-black text-[10px] tracking-[0.4em] text-black">STUDIORADAR</p>
                  <p className="font-ui text-[7px] text-black/60 uppercase">System T3-L // Design 1987</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
