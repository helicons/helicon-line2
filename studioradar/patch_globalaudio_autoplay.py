import sys

with open('./src/GlobalAudio.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the early return for minimized
old_early_return = """  if (minimized) return (
    <button
      onClick={() => setMinimized(false)}
      className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center justify-end px-8 pb-1 pt-0 rounded-b-[2rem] bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:bg-[#1a1a1a]/90 transition-all duration-300 cursor-pointer group"
      style={{ minHeight: '32px' }}
    >
      <div className="flex items-end gap-0.5 h-3 opacity-50 group-hover:opacity-100 transition-opacity mb-1">
        {[2,4,2,5,3].map((h,i) => <div key={i} className="w-[2px] rounded-full bg-accent" style={{ height: `${h*(isPlaying?2:1)}px` }} />)}
      </div>
      <div className="w-12 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>
    </button>
  );

  );"""

content = content.replace(old_early_return, "")

# Now find the main return
main_return = """  return (
    <>
      <audio ref={audioRef} src="/bg-audio.wav" loop />
      {showHits && (
        <HitsOverlay
          trackIdx={trackIdx}
          setTrackIdx={setTrackIdx}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onClose={() => setShowHits(false)}
        />
      )}

      <div className="fixed top-2 md:top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-12 duration-500" style={{ width: 260, filter: 'drop-shadow(0 40px 100px rgba(0,0,0,0.9))' }}>"""

new_main_return = """  return (
    <>
      <audio ref={audioRef} src="/bg-audio.wav" loop />
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
          className="fixed top-0 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center justify-end px-8 pb-1 pt-0 rounded-b-[2rem] bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] hover:bg-[#1a1a1a]/90 transition-all duration-300 cursor-pointer group"
          style={{ minHeight: '32px' }}
        >
          <div className="flex items-end gap-0.5 h-3 opacity-50 group-hover:opacity-100 transition-opacity mb-1">
            {[2,4,2,5,3].map((h,i) => <div key={i} className="w-[2px] rounded-full bg-accent" style={{ height: `${h*(isPlaying?2:1)}px` }} />)}
          </div>
          <div className="w-12 h-1 bg-white/20 rounded-full group-hover:bg-white/40 transition-colors"></div>
        </button>
      ) : (
      <div className="fixed top-2 md:top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-12 duration-500" style={{ width: 260, filter: 'drop-shadow(0 40px 100px rgba(0,0,0,0.9))' }}>"""

content = content.replace(main_return, new_main_return)

# Close the new ternary
content = content.replace("</div>\n      </div>\n    </>\n  );\n}", "</div>\n      </div>\n      )}\n    </>\n  );\n}")

with open('./src/GlobalAudio.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("GlobalAudio structure updated!")
