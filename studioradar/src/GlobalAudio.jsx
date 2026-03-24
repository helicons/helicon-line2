import { useState, useEffect, useRef } from 'react';

export default function GlobalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.4;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  return (
    <>
      <audio ref={audioRef} src="/bg-audio.wav" loop />

      <button
        onClick={togglePlay}
        title={isPlaying ? 'Pausar música' : 'Reproducir música'}
        className={`
          fixed bottom-8 right-8 z-[9999]
          w-14 h-14 rounded-full
          bg-accent shadow-[0_0_24px_rgba(138,43,226,0.5)]
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-all duration-200
          ${isPlaying ? 'ring-2 ring-accent/30 ring-offset-2 ring-offset-black' : ''}
        `}
      >
        {isPlaying ? (
          /* Pause icon — dos barras */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <rect x="5" y="4" width="4" height="16" rx="1.5" />
            <rect x="15" y="4" width="4" height="16" rx="1.5" />
          </svg>
        ) : (
          /* Play icon — triángulo */
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
        )}

        {/* Onda animada cuando está reproduciendo */}
        {isPlaying && (
          <span className="absolute inset-0 rounded-full animate-ping bg-accent/20 pointer-events-none" />
        )}
      </button>
    </>
  );
}
