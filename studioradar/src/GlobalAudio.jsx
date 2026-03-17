import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Disc3, ChevronDown, ChevronUp } from 'lucide-react';

export default function GlobalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [minimized, setMinimized] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolume = (change) => {
    let newVol = volume + change;
    if (newVol > 1) newVol = 1;
    if (newVol < 0) newVol = 0;
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
  };

  // Prevenir que event.stopPropagation cause problemas con botones
  const preventProp = (e) => e.stopPropagation();

  return (
    <>
      <audio ref={audioRef} src="#" loop />

      {/* MINIMIZED TAB */}
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-8 right-8 z-[9999] flex items-center gap-3 px-5 py-3 bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)] hover:border-accent/40 transition-all duration-300 group"
        >
          <Disc3 className={`w-5 h-5 text-accent shrink-0 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'opacity-50'}`} />
          <span className="font-ui text-xs text-white/70 font-bold uppercase tracking-widest">Helicon</span>
          <ChevronUp className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
        </button>
      ) : (
        /* FULL iPod */
        <div className="fixed bottom-8 right-8 z-[9999] w-[300px] h-[440px] bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.8),inset_0_2px_2px_rgba(255,255,255,0.1)] flex flex-col p-6 hover:border-accent/40 transition-colors duration-500">

          {/* Minimize Tab */}
          <button
            onClick={() => setMinimized(true)}
            className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-full text-white/40 hover:text-white hover:border-accent/30 transition-all z-50 shadow-lg"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="font-ui text-[9px] font-bold uppercase tracking-widest">Minimizar</span>
          </button>

          {/* Screen */}
          <div className="w-full h-[160px] bg-[#050505] rounded-t-[1.5rem] rounded-b-xl border border-white/5 relative overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,1)] flex flex-col justify-between p-4">
            {/* Header bar */}
            <div className="flex justify-between items-center px-1">
              <span className="font-ui text-xs text-white/50 font-bold uppercase tracking-[0.2em]">Now Playing</span>
              <div className={`w-3 h-3 rounded-full transition-colors ${isPlaying ? 'bg-accent animate-pulse shadow-[0_0_10px_#8A2BE2]' : 'bg-white/20'}`}></div>
            </div>

            {/* Track Info */}
            <div className="flex justify-center items-center h-full w-full gap-4 overflow-hidden mt-2">
              <Disc3 className={`w-10 h-10 text-accent shrink-0 ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'opacity-50'}`} />
              <div className="w-full overflow-hidden relative h-8">
                <p className="absolute font-heading font-bold text-xl text-white whitespace-nowrap animate-[marquee_6s_linear_infinite]">Helicon Lo-Fi Loop  </p>
              </div>
            </div>

            {/* Volume Bar inside screen */}
            <div className="w-full h-2 bg-white/10 rounded-full mt-auto mb-1 overflow-hidden">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${volume * 100}%` }}></div>
            </div>
          </div>

          {/* iPod Click Wheel */}
          <div className="w-[200px] h-[200px] bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] rounded-full border border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.05)] mx-auto mt-[24px] relative flex items-center justify-center">

            {/* Menu / Vol + (Top) */}
            <button onClick={() => handleVolume(0.1)} onMouseDown={preventProp} className="absolute top-[16px] text-white/60 hover:text-white transition-colors p-3 active:scale-95" title="Volumen +">
              <span className="font-ui text-sm font-bold block pt-1 tracking-widest uppercase text-center w-full">MENU (Vol +)</span>
            </button>

            {/* Play/Pause / Vol - (Bottom) */}
            <button onClick={() => handleVolume(-0.1)} onMouseDown={preventProp} className="absolute bottom-[16px] text-white/60 hover:text-white transition-colors flex items-center justify-center p-3 active:scale-95" title="Volumen -">
              <div className="flex flex-col items-center">
                <div className="flex gap-1.5 opacity-80 mb-0.5">
                  <Play className="w-4 h-4" />
                  <Pause className="w-4 h-4" />
                </div>
                <span className="font-ui text-[10px] font-bold block pb-1 tracking-widest uppercase">Vol -</span>
              </div>
            </button>

            {/* Prev (Left) */}
            <button onClick={preventProp} className="absolute left-[16px] text-white/60 hover:text-white transition-colors p-3 active:scale-95 cursor-not-allowed">
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Next (Right) */}
            <button onClick={preventProp} className="absolute right-[16px] text-white/60 hover:text-white transition-colors p-3 active:scale-95 cursor-not-allowed">
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Center Button (Select/Toggle Play) */}
            <button
              onClick={togglePlay}
              onMouseDown={preventProp}
              className="w-[72px] h-[72px] bg-gradient-to-br from-[#151515] to-[#0A0A0A] rounded-full border border-white/5 flex items-center justify-center text-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:border-accent/40 transition-all active:scale-[0.95] z-10 hover:text-accent font-ui text-[10px] uppercase font-bold tracking-widest"
            >
              {isPlaying ? 'PAUSE' : 'PLAY'}
            </button>

          </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100px); }
          100% { transform: translateX(-100px); }
        }
      `}</style>
    </>
  );
}
