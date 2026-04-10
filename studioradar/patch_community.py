import sys
import re

with open('./src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the entire Community functional component.
# First, locate where it starts and ends.
# It starts at: const Community = () => {
# and ends right before: const Footer = () => {

start_idx = content.find("const Community = () => {")
end_idx = content.find("const Footer = () => {")

if start_idx != -1 and end_idx != -1:
    new_community = """const Community = () => {
  const [selectedStudio, setSelectedStudio] = useState(null);

  return (
    <section className="py-24 overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-md border-y border-white/5" id="community">
      <div className="max-w-7xl mx-auto px-6 mb-12 flex justify-between items-end">
        <div>
          <h2 className="font-heading font-bold text-3xl text-white mb-2">Live Sessions Now</h2>
          <p className="font-ui text-text/60 text-sm">El ecosistema está activo.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-red-500/10 text-red-500 font-ui text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          ON AIR
        </div>
      </div>

      {/* Marquee */}
      <div className="flex gap-6 animate-[scroll_20s_linear_infinite] w-max select-none hover:[animation-play-state:paused]">
        {[1,2,3,4,5,6].map((i) => (
          <div 
            key={i} 
            onClick={() => setSelectedStudio(i)}
            className="glass-panel w-72 rounded-xl p-4 flex gap-4 items-center shrink-0 cursor-pointer hover:border-accent hover:shadow-[0_0_20px_rgba(138,43,226,0.3)] transition-all"
          >
            <img src={`https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=150&h=150&sig=${i}`} alt="Studio" className="w-16 h-16 rounded-lg object-cover bg-surface" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-red-500" />
                <span className="font-heading font-semibold text-white text-sm">Studio {String.fromCharCode(64+i)}</span>
              </div>
              <p className="font-ui text-xs text-text/60 flex items-center gap-1"><MapPin className="w-3 h-3"/> Madrid</p>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes liquid {
          0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; }
          100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
        }
        .liquid-icon {
           animation: liquid 4s ease-in-out infinite;
           box-shadow: inset 0 0 10px rgba(255,255,255,0.6), inset 0 10px 20px rgba(255,255,255,0.4), 0 10px 20px rgba(0,0,0,0.6);
        }
      `}</style>

      {/* Expansion Window */}
      {selectedStudio && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedStudio(null)}>
          <div 
            className="w-full max-w-md bg-gradient-to-b from-[#151515] to-[#050505] rounded-[2rem] border border-white/10 shadow-[0_40px_80px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] overflow-hidden relative flex flex-col items-center p-10 animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 w-full h-1/2 bg-red-500/10 blur-[60px] pointer-events-none"></div>

            {/* Close */}
            <button onClick={() => setSelectedStudio(null)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-colors z-20">✕</button>

            <h3 className="font-heading font-bold text-3xl text-white mb-1 relative z-10">Studio {String.fromCharCode(64+selectedStudio)}</h3>
            <p className="font-ui text-[10px] text-red-500 flex items-center gap-2 mb-10 tracking-[0.2em] font-bold relative z-10"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_#ef4444]"/> LIVE RECORDING</p>

            {/* Waves Animation (Grabo) */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-12">
              <div className="absolute inset-0 rounded-full border-[1.5px] border-red-500/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute inset-2 rounded-full border-[1.5px] border-accent/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.8s]"></div>
              <div className="absolute inset-4 rounded-full border-[1.5px] border-blue-500/40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_1.6s]"></div>
              
              <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-br from-red-500 via-accent to-blue-500 shadow-[0_0_40px_rgba(138,43,226,0.6)] z-10 animate-[pulse_3s_ease-in-out_infinite]">
                 <img src={`https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=150&h=150&sig=${selectedStudio}`} 
                      className="w-full h-full rounded-full object-cover border-[3px] border-[#111]" />
              </div>
            </div>

            {/* Social Metallic Liquid Icons */}
            <div className="flex gap-8 mb-12 relative z-10">
              {/* Instagram */}
              <a href="#" className="liquid-icon w-14 h-14 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.492a4.914 4.914 0 0 1 1.672 1.091 4.908 4.908 0 0 1 1.091 1.672c.275.638.442 1.363.492 2.428.05 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.217 1.79-.492 2.428a4.914 4.914 0 0 1-1.091 1.672 4.908 4.908 0 0 1-1.672 1.091c-.638.275-1.363.442-2.428.492-1.066.05-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.217-2.428-.492a4.914 4.914 0 0 1-1.672-1.091 4.908 4.908 0 0 1-1.091-1.672c-.275-.638-.442-1.363-.492-2.428C2.01 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.065.217-1.79.492-2.428a4.914 4.914 0 0 1 1.091-1.672A4.908 4.908 0 0 1 5.315 2.552c.638-.275 1.363-.442 2.428-.492C8.944 2.01 9.283 2 12 2zm0 1.802c-2.67 0-2.987.01-4.042.059-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.372-.058 4.042 0 2.67.01 2.987.058 4.042.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.372.058 4.042.058 2.67 0 2.987-.01 4.042-.058.975-.045 1.504-.207 1.857-.344.467-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.372.058-4.042 0-2.67-.01-2.987-.058-4.042-.045-.975-.207-1.504-.344-1.857a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.372-.059-4.042-.059zM12 6.865a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666zm5.338-3.205a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>
              </a>
              {/* YouTube */}
              <a href="#" className="liquid-icon w-14 h-14 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #ff0000 0%, #aa0000 100%)' }}>
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              {/* TikTok */}
              <a href="#" className="liquid-icon w-14 h-14 flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg" style={{ background: 'linear-gradient(135deg, #010101 0%, #1a1a1a 100%)', boxShadow: 'inset 0 0 10px rgba(0,255,255,0.6), inset 0 10px 20px rgba(255,0,80,0.6), 0 10px 20px rgba(0,0,0,0.8)' }}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
              </a>
            </div>

            {/* Situate on Map Button */}
            <button 
              onClick={() => {
                setSelectedStudio(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full py-4 bg-surface hover:bg-white/10 border border-white/10 rounded-[1rem] font-ui text-xs uppercase tracking-[0.2em] font-bold transition-all shadow-md flex items-center justify-center gap-2 group relative z-10"
            >
              <MapPin className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              Situar en el Mapa
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
"""
    content = content[:start_idx] + new_community + "\n\n" + content[end_idx:]

    with open('./src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("Community modal applied successfully.")
else:
    print("Could not locate Community bounds.")
