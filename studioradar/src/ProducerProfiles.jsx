import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import { createPortal } from 'react-dom';
import { ActivitySquare, Star, Zap, X, MessageSquare, CheckCircle2, Music2, Headphones, Instagram, Twitter, Youtube } from 'lucide-react';

const PRODUCERS = [
  {
    id: 1,
    name: 'Helicon Origin',
    hp: '10M', // Streams
    type: 'TRAP',
    color: '#8A2BE2', // Neon Violet
    image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=400',
    abilities: [
      { name: 'Platinum Hook', desc: '50,000 Sales. Hook +15% Catch Rate.', damage: '50k' },
      { name: '808 Earthquake', desc: 'Shatters speakers. +20% Bass.', damage: 'MAX' }
    ],
    weakness: 'Acoustic',
    resistance: 'Drill',
    retreat: 2
  },
  {
    id: 2,
    name: 'Metro Shadows',
    hp: '24M',
    type: 'DRILL',
    color: '#FF003C', // Red/Magenta
    image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=400',
    abilities: [
      { name: 'Ghost Melody', desc: 'Haunting counter-melodies.', damage: '30k' },
      { name: 'Sliding Bass', desc: 'Unpredictable 808 glides.', damage: '80k' }
    ],
    weakness: 'Lo-Fi',
    resistance: 'Boom Bap',
    retreat: 1
  },
  {
    id: 3,
    name: 'Cloud Nine',
    hp: '5M',
    type: 'R&B',
    color: '#00F0FF', // Neon Cyan
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    abilities: [
      { name: 'Silk Chords', desc: 'Instant vibe setter.', damage: '15k' },
      { name: 'Midnight Groove', desc: 'Irresistible slow jam.', damage: '40k' }
    ],
    weakness: 'Hardstyle',
    resistance: 'Chillwave',
    retreat: 3
  },
  {
    id: 4,
    name: 'Iron Foundry',
    hp: '12M',
    type: 'TECHNO',
    color: '#FFD700', // Gold
    image: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?auto=format&fit=crop&q=80&w=400',
    abilities: [
      { name: 'Industrial Kick', desc: 'Punches through any mix.', damage: '45k' },
      { name: 'Acid Arp', desc: 'Tearout synth line sequence.', damage: '90k' }
    ],
    weakness: 'Pop',
    resistance: 'House',
    retreat: 4
  }
];

// Inner visual part of the card extracted to avoid duplicating code in the modal
const PokemonCardInner = ({ prod }) => (
  <div className="flex-1 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-xl flex flex-col overflow-hidden relative border-2 border-black/40">
    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(${prod.color} 1px, transparent 1px)`, backgroundSize: '10px 10px' }}></div>
    
    <div className="relative z-10 flex justify-between items-center p-3 font-heading font-bold text-white bg-gradient-to-r from-black/80 to-transparent">
      <span className="text-lg sm:text-xl tracking-wide truncate">{prod.name}</span>
      <div className="flex items-center gap-1 text-base sm:text-lg">
        <span className="text-red-500 font-ui text-[9px] sm:text-[10px] uppercase">Strm</span>
        {prod.hp}
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-white/20 shadow-inner" style={{ backgroundColor: prod.color }}>
          <Star className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
        </div>
      </div>
    </div>

    <div className="relative z-10 px-3 pb-1">
      <div className="w-full aspect-[4/3] border-[3px] border-gray-400 bg-surface rounded-sm overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        <img src={prod.image} alt={prod.name} className="w-full h-full object-cover filter contrast-125 saturate-150" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
      <div className="bg-gradient-to-r from-gray-300 via-white to-gray-300 shadow-sm border border-gray-400 text-black text-[9px] sm:text-[10px] font-ui px-2 py-0.5 flex justify-between items-center -mt-2 relative z-20 mx-2">
        <span className="font-bold flex items-center gap-1"><Zap className="w-2 h-2 sm:w-3 sm:h-3"/> {prod.type} TYPE BEATMAKER</span>
        <span className="hidden sm:inline">Length: 1.8m, Wt: 75kg</span>
      </div>
    </div>

    <div className="relative z-10 flex-1 px-3 sm:px-4 py-2 sm:py-3 flex flex-col gap-2 sm:gap-3">
      {prod.abilities.map((ability, idx) => (
        <div key={idx} className="flex gap-2">
           <div className="flex gap-0.5 pt-1 shrink-0">
             {[...Array(idx + 1)].map((_, i) => (
                <div key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full shadow-inner" style={{ backgroundColor: prod.color }}></div>
             ))}
           </div>
           <div className="flex-1 min-w-0">
             <div className="flex justify-between items-center font-bold font-heading text-white">
               <span className="text-xs sm:text-sm truncate mr-2">{ability.name}</span>
               <span className="text-xs sm:text-sm">{ability.damage}</span>
             </div>
             <p className="font-ui text-[8px] sm:text-[9px] text-text/70 leading-tight mt-0.5">{ability.desc}</p>
           </div>
        </div>
      ))}
    </div>

    <div className="relative z-10 border-t-[1.5px] border-black/40 px-3 sm:px-4 py-1.5 flex justify-between text-[8px] sm:text-[9px] font-ui uppercase tracking-wider font-bold text-text/90">
      <div className="flex flex-col items-center">
        <span className="text-text/50">Weakness</span>
        <span className="flex items-center gap-1">{prod.weakness} <div className="w-2 h-2 rounded-full bg-blue-500"></div></span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-text/50">Resistance</span>
        <span className="flex items-center gap-1">{prod.resistance} <div className="w-2 h-2 rounded-full bg-orange-500"></div></span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-text/50">Retreat Cost</span>
        <div className="flex gap-0.5 mt-0.5">
           {[...Array(prod.retreat)].map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400"></div>
           ))}
        </div>
      </div>
    </div>

    <div className="relative z-10 px-4 pb-2 pt-1 flex justify-between items-center text-[7px] font-ui text-text/50">
      <span className="italic">Illus. Helicon AI</span>
      <span className="font-bold flex items-center gap-0.5"><Star className="w-2 h-2 fill-current"/> Edition 1</span>
    </div>
  </div>
);

const PokemonCard = ({ prod }) => {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [backgroundPosition, setBackgroundPosition] = useState('0% 0%');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current || isExpanded) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -15;
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setRotation({ x: rotateX, y: rotateY });

    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;
    setBackgroundPosition(`${bgX}% ${bgY}%`);
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setBackgroundPosition('50% 50%');
  };

  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isExpanded]);

  return (
    <>
      <div className="perspective-[1000px] w-full max-w-[340px] aspect-[63/88] mx-auto cursor-pointer group" onClick={() => setIsExpanded(true)}>
        <div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full relative preserve-3d transition-transform duration-200 ease-out rounded-2xl"
          style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        >
          {/* Holographic foil overlay layer */}
          <div 
            className="absolute inset-0 z-30 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-color-dodge"
            style={{
              background: `radial-gradient(circle at ${backgroundPosition}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%), 
                           linear-gradient(125deg, #ff008450, #00f0ff50, #8a2be250, #ffd70050)`,
              backgroundSize: '200% 200%',
              backgroundPosition: backgroundPosition
            }}
          ></div>

          {/* Card Border / Neon Glow Spinning */}
          <div className="absolute inset-0 p-[2px] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(138,43,226,0.3)] z-0 group-hover:shadow-[0_0_60px_rgba(138,43,226,0.6)] transition-shadow duration-500">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(138,43,226,1)_360deg)] animate-[spin_3s_linear_infinite]"></div>
             <div className="absolute inset-[2px] rounded-[14px] bg-[#0a0a0a] flex flex-col p-2 sm:p-3 z-10 pointer-events-none">
               <PokemonCardInner prod={prod} />
             </div>
          </div>
        </div>
      </div>

      {/* EXPANDED MODAL via Portal */}
      {isExpanded && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#050505]/90 backdrop-blur-md" onClick={() => setIsExpanded(false)}>
           <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] rounded-[2rem] border border-accent/20 shadow-[0_0_60px_rgba(138,43,226,0.2)] flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200 scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent" onClick={e => e.stopPropagation()}>
              
              <button className="absolute top-4 right-4 z-50 p-2 md:bg-white/5 md:hover:bg-white/10 bg-black/50 md:border border-white/10 rounded-full text-white/50 hover:text-white transition-colors" onClick={() => setIsExpanded(false)}>
                 <X className="w-5 h-5" />
              </button>

              {/* Left Side: The Card Visual */}
              <div className="w-full md:w-[45%] p-8 bg-surface/30 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5 min-h-[350px]">
                 <div className="absolute inset-0 bg-accent/20 blur-[100px] pointer-events-none"></div>
                 <div className="w-full max-w-[320px] aspect-[63/88] pointer-events-none relative z-10 p-[2px] rounded-2xl shadow-[0_0_50px_rgba(138,43,226,0.4)] overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(138,43,226,1)_360deg)] animate-[spin_3s_linear_infinite]"></div>
                    <div className="absolute inset-[2px] rounded-[14px] bg-[#0a0a0a] flex flex-col p-2 sm:p-3 z-10">
                      <PokemonCardInner prod={prod} />
                    </div>
                 </div>
              </div>

              {/* Right Side: Stats & Contact */}
              <div className="w-full md:w-[55%] p-6 md:p-12 flex flex-col relative z-20">
                <span className="font-ui text-[10px] text-accent font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                  <ActivitySquare className="w-4 h-4"/> Certified Helicon Creator
                </span>
                
                <h2 className="font-heading font-bold text-4xl md:text-5xl text-white mb-6 uppercase tracking-tight leading-none">{prod.name}</h2>
                
                <div className="flex flex-wrap items-center gap-3 mb-10">
                  <span className="px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full font-ui text-sm text-accent glow-purple font-bold">
                     {prod.type} TYPE
                  </span>
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-ui text-sm text-white/80">
                     {prod.hp} Streams
                  </span>
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full font-ui text-sm text-white/80 flex items-center gap-1">
                     <Star className="w-3 h-3 text-yellow-500 fill-current"/> Edition 1
                  </span>
                </div>

                <div className="flex-1 space-y-6">
                
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

                   <div>
                     <h3 className="font-ui text-xs text-text/50 uppercase tracking-widest mb-4">Signature Abilities</h3>
                     <div className="space-y-3">
                       {prod.abilities.map((ab, i) => (
                         <div key={i} className="bg-surface/30 border border-white/5 p-4 rounded-xl hover:border-accent/30 transition-colors">
                           <div className="flex justify-between items-center mb-1">
                             <div className="flex items-center gap-2">
                               <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor]" style={{ color: prod.color, backgroundColor: prod.color }}></div>
                               <span className="font-heading font-bold text-white text-lg">{ab.name}</span>
                             </div>
                             <span className="font-heading font-bold text-accent glow-purple">{ab.damage}</span>
                           </div>
                           <p className="font-ui text-sm text-text/70 ml-[18px]">{ab.desc}</p>
                         </div>
                       ))}
                     </div>
                   </div>
                </div>

                <div className="mt-10 md:mt-12 pt-6 md:pt-8 border-t border-white/10">
                  <button className="w-full py-4 md:py-5 bg-accent hover:bg-[#9d3df2] rounded-2xl font-ui font-bold text-white uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(138,43,226,0.3)] hover:shadow-[0_0_50px_rgba(138,43,226,0.6)] transition-all flex items-center justify-center gap-3">
                    <MessageSquare className="w-5 h-5" /> Request Custom Beat
                  </button>
                </div>

              </div>
           </div>
        </div>
      , document.body)}
    </>
  );
};

// ─── ELITE PRODUCER CARD ──────────────────────────────────────────────────────
const EliteProducerCard = ({ prod }) => {
  const cardRef = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const onMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    setRot({ x: ((y - r.height / 2) / r.height) * -10, y: ((x - r.width / 2) / r.width) * 10 });
    setGlow({ x: (x / r.width) * 100, y: (y / r.height) * 100 });
  };

  useEffect(() => {
    document.body.style.overflow = expanded ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [expanded]);

  return (
    <>
      <div
        className="perspective-[1200px] cursor-pointer group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setRot({ x: 0, y: 0 }); }}
        onClick={() => setExpanded(true)}
      >
        <div
          ref={cardRef}
          onMouseMove={onMove}
          className="relative rounded-2xl overflow-hidden transition-all duration-200 ease-out"
          style={{
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            background: 'linear-gradient(160deg, #141414 0%, #0a0a0a 100%)',
            border: `1px solid ${hovered ? prod.color + '50' : 'rgba(255,255,255,0.07)'}`,
            boxShadow: hovered
              ? `0 24px 60px rgba(0,0,0,0.7), 0 0 50px ${prod.color}20`
              : '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Holographic shimmer on hover */}
          <div
            className="absolute inset-0 z-20 pointer-events-none mix-blend-screen transition-opacity duration-300"
            style={{
              opacity: hovered ? 0.25 : 0,
              background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, ${prod.color}cc, transparent 55%)`,
            }}
          />

          {/* Photo */}
          <div className="relative h-52 overflow-hidden">
            <img
              src={prod.image} alt={prod.name}
              className="w-full h-full object-cover transition-transform duration-700"
              style={{ transform: hovered ? 'scale(1.07)' : 'scale(1)' }}
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
            {/* Color haze top-right */}
            <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full blur-3xl opacity-25 pointer-events-none"
              style={{ background: prod.color }} />
            {/* Type pill */}
            <div
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full font-ui text-[9px] font-bold uppercase tracking-widest"
              style={{ background: prod.color + '25', border: `1px solid ${prod.color}50`, color: prod.color }}
            >
              {prod.type}
            </div>
            {/* Elite badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/70 border border-accent/30">
              <Star className="w-2.5 h-2.5 text-accent fill-current" />
              <span className="font-ui text-[9px] text-accent uppercase tracking-widest font-bold">Elite</span>
            </div>
          </div>

          {/* Info body */}
          <div className="p-4 space-y-3">
            {/* Name + verified + streams */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-heading font-bold text-white text-xl leading-tight truncate">{prod.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3 text-accent/60 shrink-0" />
                  <span className="font-ui text-[9px] text-accent/50 uppercase tracking-widest">Verified Creator</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading font-bold text-2xl leading-none"
                  style={{ background: `linear-gradient(135deg,#fff,${prod.color})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {prod.hp}
                </p>
                <p className="font-ui text-[8px] text-white/25 uppercase tracking-widest mt-0.5">Streams</p>
              </div>
            </div>

            <div className="border-t border-white/5" />

            {/* Signature beats */}
            <div className="space-y-2">
              <p className="font-ui text-[9px] text-white/25 uppercase tracking-widest flex items-center gap-1">
                <Music2 className="w-3 h-3" /> Signature
              </p>
              {prod.abilities.map((ab, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: prod.color }} />
                    <span className="font-ui text-xs text-white/60 truncate">{ab.name}</span>
                  </div>
                  <span className="font-heading font-bold text-xs shrink-0" style={{ color: prod.color }}>{ab.damage}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              className="w-full py-2.5 rounded-xl font-ui font-bold text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5"
              style={{
                background: hovered ? prod.color : 'transparent',
                border: `1px solid ${prod.color}50`,
                color: hovered ? '#fff' : prod.color,
                boxShadow: hovered ? `0 0 24px ${prod.color}40` : 'none',
              }}
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            >
              <Headphones className="w-3.5 h-3.5" />
              Ver Perfil Completo
            </button>
          </div>
        </div>
      </div>

      {/* Expanded modal — reuses existing PokemonCard modal layout */}
      {expanded && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#050505]/90 backdrop-blur-md"
          onClick={() => setExpanded(false)}>
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex flex-col md:flex-row relative animate-in fade-in zoom-in-95 duration-200"
            style={{ borderColor: prod.color + '25' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 z-50 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/50 hover:text-white transition-colors"
              onClick={() => setExpanded(false)}
            ><X className="w-5 h-5" /></button>

            {/* Left — card visual */}
            <div className="w-full md:w-[45%] p-8 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-white/5 min-h-[350px]">
              <div className="absolute inset-0 blur-[120px] opacity-20 pointer-events-none rounded-l-[2rem]"
                style={{ background: prod.color }} />
              <div className="w-full max-w-[300px] pointer-events-none relative z-10">
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ border: `1px solid ${prod.color}40`, boxShadow: `0 0 60px ${prod.color}30` }}>
                  <img src={prod.image} alt={prod.name} className="w-full aspect-square object-cover" draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full mb-2"
                      style={{ background: prod.color + '30', border: `1px solid ${prod.color}50` }}>
                      <Star className="w-3 h-3 fill-current" style={{ color: prod.color }} />
                      <span className="font-ui text-[10px] font-bold uppercase tracking-widest" style={{ color: prod.color }}>Elite · Edition 1</span>
                    </div>
                    <h2 className="font-heading font-bold text-white text-3xl leading-none">{prod.name}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — details */}
            <div className="w-full md:w-[55%] p-6 md:p-12 flex flex-col relative z-20">
              <span className="font-ui text-[10px] text-accent font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                <ActivitySquare className="w-4 h-4" /> Certified Helicon Creator
              </span>
              <h2 className="font-heading font-bold text-4xl md:text-5xl text-white mb-2 uppercase tracking-tight leading-none">{prod.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mb-8 mt-3">
                <span className="px-3 py-1 rounded-full font-ui text-xs font-bold uppercase tracking-widest"
                  style={{ background: prod.color + '20', border: `1px solid ${prod.color}40`, color: prod.color }}>
                  {prod.type} TYPE
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full font-ui text-xs text-white/70 flex items-center gap-1">
                  <Headphones className="w-3 h-3" /> {prod.hp} Streams
                </span>
              </div>
              <div className="flex-1 space-y-3">
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

                <h3 className="font-ui text-xs text-text/40 uppercase tracking-widest mb-3">Signature Abilities</h3>
                {prod.abilities.map((ab, i) => (
                  <div key={i} className="bg-white/3 border border-white/5 hover:border-accent/20 p-4 rounded-xl transition-colors">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: prod.color, boxShadow: `0 0 8px ${prod.color}` }} />
                        <span className="font-heading font-bold text-white text-base">{ab.name}</span>
                      </div>
                      <span className="font-heading font-bold text-accent">{ab.damage}</span>
                    </div>
                    <p className="font-ui text-sm text-text/60 ml-[18px]">{ab.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-white/8">
                <button
                  className="w-full py-4 rounded-2xl font-ui font-bold text-white uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${prod.color}, #8A2BE2)`,
                    boxShadow: `0 0 30px ${prod.color}30`,
                  }}
                >
                  <MessageSquare className="w-5 h-5" /> Request Custom Beat
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default function ProducerProfiles() {
  return (
    <div className="min-h-screen bg-[#050505] text-text pb-24 relative overflow-hidden">
      <Navbar />

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-accent/10 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 pt-24">

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/5 border border-white/10 text-accent font-ui text-xs tracking-widest">
            <ActivitySquare className="w-4 h-4" />
            Hall of Fame
          </div>
          <h1 className="font-heading font-bold text-5xl md:text-6xl text-white mb-4 uppercase tracking-tight">Our Producers</h1>
          <p className="font-ui text-text/60 max-w-xl mx-auto">Collecciona beats de creadores de élite. Descubre sus estadísticas de reproducciones y su poder en cada género.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PRODUCERS.map(prod => (
            <EliteProducerCard key={prod.id} prod={prod} />
          ))}
        </div>

      </div>
    </div>
  );
}

export { PRODUCERS, PokemonCard };
