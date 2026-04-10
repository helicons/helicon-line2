import sys

with open('./src/GlobalAudio.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
old_imports = """import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';"""
new_imports = """import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, X, Volume2, VolumeX } from 'lucide-react';
import { useLocation } from 'react-router-dom';"""
content = content.replace(old_imports, new_imports)

# 2. Update hooks and state
old_state = """export default function GlobalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume]    = useState(0.4);
  const [minimized, setMinimized] = useState(true);
  const [trackIdx,  setTrackIdx]  = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [showHits,  setShowHits]  = useState(false);
  const audioRef = useRef(null);
  const track    = HITS[trackIdx];"""

new_state = """export default function GlobalAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume]    = useState(0.4);
  const [minimized, setMinimized] = useState(true);
  const [trackIdx,  setTrackIdx]  = useState(0);
  const [progress,  setProgress]  = useState(0);
  const [showHits,  setShowHits]  = useState(false);
  const [isMuted,   setIsMuted]   = useState(false);
  const audioRef = useRef(null);
  
  const location = useLocation();
  const isLanding = location.pathname === '/';
  
  const track = HITS[trackIdx];
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);"""

content = content.replace(old_state, new_state)

# 3. Add the mute button just before the closing tag of the component
old_end = """      </div>
      )}
    </>
  );
}"""

new_end = """      </div>
      )}

      {isLanding && isPlaying && (
        <button 
          onClick={() => setIsMuted(m => !m)}
          title={isMuted ? "Unmute Intro" : "Mute Intro"}
          className="fixed bottom-6 left-6 z-[9999] flex items-center justify-center p-3 rounded-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-5 duration-500"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </>
  );
}"""

content = content.replace(old_end, new_end)

with open('./src/GlobalAudio.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Mute button added successfully!")
