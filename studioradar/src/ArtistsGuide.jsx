import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import {
  MapPin, Calendar, Music, CreditCard, ArrowLeft, ArrowRight,
  CheckCircle2, Radio, Mic, Headphones, Zap, ChevronDown, Play
} from 'lucide-react';
import PaymentOverlay from './components/PaymentOverlay';

// ─── Radar mini background (same palette, smaller) ───────────────
const MiniRadar = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <filter id="ag-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {[8, 16, 24, 32, 40].map((r, i) => (
        <circle key={i} cx="50" cy="50" r={r} fill="none"
          stroke={`rgba(255,255,255,${0.03 + i * 0.01})`} strokeWidth="0.15"/>
      ))}
      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="0.1"/>
      <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="0.1"/>
      <circle cx="50" cy="50" r="0.5" fill="rgba(255,255,255,0.6)" filter="url(#ag-glow)"/>
    </svg>
    <div className="absolute inset-0" style={{ animation: 'radar-spin 10s linear infinite' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '40%', height: '1px', transformOrigin: '0% 50%',
        background: 'linear-gradient(90deg, rgba(138,43,226,0.5), rgba(138,43,226,0))',
      }}/>
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80"/>
    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]/80"/>
  </div>
);
// ─── Steps data ───────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    icon: MapPin,
    tag: 'PASO 01',
    title: 'Encuentra tu Estudio',
    subtitle: 'Radar de Estudios Cercanos',
    color: '#8A2BE2',
    description: 'Abre el Radar de Helicon y deja que escanee estudios premium cerca de ti en tiempo real. Vallecas, Torrejón, Centro — todos a un toque.',
    details: [
      'Activa tu ubicación o escribe tu barrio',
      'El radar detecta estudios disponibles en tu zona',
      'Filtra por precio, horario y equipamiento',
      'Compara Neon Room, The Vault y 808 Suite',
    ],
    demo: (active) => (
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 flex items-center justify-center">
        <div className="absolute inset-0">
          <svg viewBox="0 0 100 60" className="w-full h-full">
            {[8, 16, 24].map((r, i) => (
              <circle key={i} cx="50" cy="30" r={r} fill="none" stroke={`rgba(138,43,226,${0.1 + i * 0.08})`} strokeWidth="0.3"/>
            ))}
            {[{x:35,y:18,l:'Neon Room'},{x:70,y:20,l:'The Vault',a:true},{x:62,y:45,l:'808 Suite'}].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="1.5" fill="none" stroke={p.a ? 'rgba(0,122,255,0.6)' : 'rgba(138,43,226,0.5)'} strokeWidth="0.3"
                  style={{ animation: `node-ping ${2+i*0.4}s ease-in-out infinite`, transformOrigin: `${p.x}px ${p.y}px` }}/>
                <circle cx={p.x} cy={p.y} r="0.8" fill={p.a ? 'rgba(0,122,255,0.9)' : 'rgba(255,255,255,0.9)'}/>
                <text x={p.x} y={p.y - 2.5} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="2.2" fontFamily="monospace">{p.l}</text>
              </g>
            ))}
          </svg>
        </div>
        {active && (
          <div className="absolute inset-0" style={{ animation: 'radar-spin 6s linear infinite' }}>
            <div style={{ position:'absolute', top:'50%', left:'50%', width:'35%', height:'1px', transformOrigin:'0% 50%', background:'linear-gradient(90deg,rgba(138,43,226,0.6),transparent)' }}/>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#050505]/80 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"/>
          <span className="font-ui text-[9px] text-white/60 uppercase tracking-widest">Radar Activo · Madrid</span>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    icon: Calendar,
    tag: 'PASO 02',
    title: 'Reserva tu Sesión',
    subtitle: 'Booking Sin Fricción',
    color: '#7C3AED',
    description: 'Selecciona el estudio, elige tu franja horaria nocturna y configura los servicios que necesitas. Sin llamadas, sin esperas.',
    details: [
      'Elige entre Booth Only, Ingeniero o Sesión Completa',
      'Franjas disponibles de 18:00 a 04:00',
      'Añade acompañantes artísticos (máx. 3)',
      'Confirmación instantánea vía notificación',
    ],
    demo: (active) => (
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="font-heading font-bold text-white text-sm">Neon Room</span>
          <span className="font-ui text-accent text-xs">20€/h</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {['18h','20h','21h','22h','00h','01h','02h','03h','04h','05h'].map((t, i) => (
            <div key={i} className={`py-1 rounded text-center font-ui text-[9px] border transition-all duration-300 ${
              i === (active ? 3 : 99) ? 'bg-accent/20 border-accent text-white' : i === 1 ? 'bg-white/3 border-white/5 text-white/20' : 'bg-white/5 border-white/10 text-white/50'
            }`}>{t}</div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-5 h-5 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-accent"/>
            </div>
            <span className="font-ui text-[10px] text-white/60">22:00 seleccionado</span>
          </div>
          <span className="font-ui text-[9px] text-accent/60 border border-accent/20 px-2 py-0.5 rounded">HOY</span>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    icon: Music,
    tag: 'PASO 03',
    title: 'Consigue tu Beat',
    subtitle: 'Beat Marketplace',
    color: '#9333EA',
    description: 'Sin beat, sin canción. Explora nuestro mercado de instrumentales antes de entrar al estudio. Compra la licencia directamente desde la app.',
    details: [
      'Más de 50 beats disponibles: Trap, Drill, R&B, Reggaetón',
      'Preview en 30 segundos antes de comprar',
      'Licencia básica MP3 desde 29€, WAV+Stems desde 79€',
      'Descarga inmediata, el beat es tuyo al instante',
    ],
    demo: (active) => (
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 p-4 flex flex-col gap-2">
        {[{ name: 'Night Drift', genre: 'TRAP', price: '29€', bars: [0.3,0.8,0.5,1,0.7,0.4,0.9,0.6,0.8,0.3] },
          { name: 'Vault 808', genre: 'DRILL', price: '49€', bars: [0.6,0.4,0.9,0.3,0.7,1,0.5,0.8,0.4,0.7], active: active }].map((beat, bi) => (
          <div key={bi} className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${beat.active ? 'border-accent/40 bg-accent/5' : 'border-white/5 bg-white/3'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${beat.active ? 'border-accent bg-accent/20' : 'border-white/10 bg-white/5'}`}>
              {beat.active ? <span className="w-2 h-2 bg-accent rounded-full animate-pulse"/> : <Play className="w-3 h-3 text-white/40"/>}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-heading font-bold text-xs text-white">{beat.name}</span>
                <span className={`font-ui text-[9px] ${beat.active ? 'text-accent' : 'text-white/40'}`}>{beat.price}</span>
              </div>
              <div className="flex gap-px items-end h-3">
                {beat.bars.map((h, i) => (
                  <div key={i} className={`flex-1 rounded-full transition-all ${beat.active ? 'bg-accent/60' : 'bg-white/20'}`}
                    style={{ height: `${h * 100}%`, animation: beat.active ? `wave-bar ${0.4 + i * 0.05}s ease-in-out infinite alternate` : 'none' }}/>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 4,
    icon: Mic,
    tag: 'PASO 04',
    title: 'Entra al Estudio',
    subtitle: 'Tu Sesión Empieza',
    color: '#6D28D9',
    description: 'Con el boleto confirmado, llegas al estudio, te presentas con tu nombre artístico y empiezas a grabar. Todo está listo para ti.',
    details: [
      'Muestra tu boleto digital en la puerta',
      'El estudio está pre-configurado a tu nombre',
      'Ingenieros disponibles si los reservaste',
      'WiFi, snacks y ambiente premium incluidos',
    ],
    demo: (active) => (
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 p-4 flex flex-col justify-between">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div>
            <span className="font-ui text-[9px] text-accent uppercase tracking-widest block mb-0.5">Boleto de Sesión</span>
            <span className="font-heading font-bold text-white text-sm">Neon Room · 22:00</span>
            <span className="font-ui text-[8px] text-text/40 block mt-0.5">DISPONIBLE: 18:00 - 05:00</span>
          </div>
          <div className={`text-[10px] font-ui px-2 py-1 rounded-full border transition-all ${active ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-white/10 text-white/30'}`}>
            {active ? '✓ ACTIVO' : 'PENDIENTE'}
          </div>
        </div>
        <div className="flex gap-4 text-[10px] font-ui text-white/50">
          <span className="flex items-center gap-1"><Mic className="w-3 h-3 text-accent"/> Booth Only</span>
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-accent"/> 4 horas</span>
        </div>
        <div className="flex gap-2 items-center">
          {['Tu Artista', 'Invitado 1'].map((n, i) => (
            <div key={i} className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-accent/60"/>
              <span className="font-ui text-[9px] text-white/60">{n}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 5,
    icon: Headphones,
    tag: 'PASO 05',
    title: 'Publica tu Canción',
    subtitle: 'Del Studio al Estadio',
    color: '#5B21B6',
    description: 'Grabada, mezclada y masterizada. Ahora es tu momento. Sube tu track, conviértete en artista y vuelve a Helicon para la siguiente sesión.',
    details: [
      'Mix & Master disponible como add-on desde 150€',
      'Archivos WAV de alta calidad entregados en 48h',
      'Asistencia para distribución digital (Spotify, Apple Music)',
      'Únete al ecosistema de artistas de Helicon',
    ],
    demo: (active) => (
      <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/5 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${active ? 'border-accent bg-accent/20' : 'border-white/10 bg-white/5'}`}>
            <Zap className={`w-5 h-5 ${active ? 'text-accent' : 'text-white/30'}`}/>
          </div>
          <div>
            <span className="font-heading font-bold text-white text-sm block">Tu Canción</span>
            <span className="font-ui text-[10px] text-white/40">Night Session · Neon Room</span>
          </div>
          <div className="ml-auto font-ui text-[9px] text-accent">WAV</div>
        </div>
        <div className="space-y-1.5">
          {['Grabación ✓', 'Mix & Master ✓', 'Distribución →'].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${active && i < 2 ? 'bg-green-400' : active && i === 2 ? 'bg-accent animate-pulse' : 'bg-white/20'}`}/>
              <span className={`font-ui text-[10px] ${active && i < 2 ? 'text-green-400' : active && i === 2 ? 'text-accent' : 'text-white/30'}`}>{s}</span>
            </div>
          ))}
        </div>
        {active && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-accent/10 border border-accent/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse"/>
            <span className="font-ui text-[9px] text-accent">Live on Spotify</span>
          </div>
        )}
      </div>
    ),
  },
];

const FAQS = [
  { q: '¿Necesito experiencia previa en estudio?', a: 'No. Nuestros estudios están disponibles tanto para artistas independientes como para profesionales.' },
  { q: '¿Puedo traer mi propio beat?', a: 'Por supuesto. Puedes traer tu instrumental en cualquier formato (WAV, MP3).' },
  { q: '¿Cuánto tiempo de antelación necesito para reservar?', a: 'Puedes reservar con tan solo 1 hora de antelación si hay disponibilidad.' },
  { q: '¿Qué pasa si quiero cancelar?', a: 'Puedes cancelar hasta 4 horas antes de tu sesión sin coste.' },
  { q: '¿Ofrecéis mezcla y masterización?', a: 'Sí. Puedes añadir Mix & Master a tu reserva desde 150€ por canción.' },
];

export default function ArtistsGuide() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [paymentState, setPaymentState] = useState(null);
  const stepRefs = useRef([]);

  useEffect(() => {
    const observers = stepRefs.current.map((el, i) => {
      if (!el) return null;
      const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setActiveStep(i); }, { threshold: 0.5 });
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach(o => o?.disconnect());
  }, []);

  const scrollToStep = (i) => stepRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <div className="min-h-screen bg-[#050505] text-text relative overflow-x-hidden">
      <MiniRadar />
      {paymentState && <PaymentOverlay status={paymentState} onClose={() => setPaymentState(null)} />}
      <Navbar />
      <section className="relative min-h-[60vh] flex flex-col items-center justify-center text-center px-6 pt-32 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-white/5 border border-white/10 text-accent font-ui text-xs tracking-widest">
          <Radio className="w-3.5 h-3.5"/> Guía Para Artistas
        </div>
        <h1 className="font-heading font-bold text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight mb-6 text-white">Del Studio<br/><span className="text-accent" style={{ textShadow: '0 0 40px rgba(138,43,226,0.4)' }}>al Estadio.</span></h1>
        <p className="font-ui text-lg text-text/60 max-w-2xl mb-8 leading-relaxed">Todo lo que necesitas para convertir tu próxima idea en una canción profesional. Sin complicaciones, sin excusas.</p>
        <div className="flex flex-wrap gap-5 justify-center mb-10">
          {[
            { n: '12', label: 'productores de élite', dot: 'bg-accent' },
            { n: '3', label: 'estudios activos', dot: 'bg-blue-400' },
            { n: '50+', label: 'beats exclusivos', dot: 'bg-green-400' },
          ].map(({ n, label, dot }) => (
            <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className={`w-1.5 h-1.5 ${dot} rounded-full animate-pulse`}/>
              <span className="font-heading font-bold text-white text-sm">{n}</span>
              <span className="font-ui text-xs text-white/40">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-10 flex-wrap justify-center">
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => scrollToStep(i)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-ui text-xs border transition-all duration-300 ${activeStep === i ? 'bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(138,43,226,0.3)]' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}><s.icon className="w-3 h-3"/>{s.tag}</button>
          ))}
        </div>
        <div className="animate-bounce text-white/20"><ChevronDown className="w-6 h-6"/></div>
      </section>
      <section className="py-8 px-6 max-w-6xl mx-auto">
        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/5 -translate-x-1/2"/>
          <div className="space-y-24 md:space-y-32">
            {STEPS.map((step, i) => {
              const isActive = activeStep === i;
              const isLeft = i % 2 === 0;
              return (
                <div key={step.id} ref={el => stepRefs.current[i] = el} className={`relative flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16 ${!isLeft ? 'md:flex-row-reverse' : ''}`}>
                  <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full border-2 items-center justify-center z-10 transition-all duration-500" style={{ borderColor: isActive ? step.color : 'rgba(255,255,255,0.1)', backgroundColor: isActive ? `${step.color}20` : '#050505', boxShadow: isActive ? `0 0 20px ${step.color}50` : 'none' }}>
                    <step.icon className="w-5 h-5" style={{ color: isActive ? step.color : 'rgba(255,255,255,0.3)' }}/>
                  </div>
                  <div className={`flex-1 md:w-1/2 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16'}`}>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full font-ui text-xs border transition-all duration-500 ${isLeft ? 'md:flex-row-reverse' : ''} ${isActive ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/10 bg-white/5 text-white/40'}`}><step.icon className="w-3.5 h-3.5"/>{step.tag}</div>
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-2 leading-tight">{step.title}</h2>
                    <p className="font-ui text-sm text-accent mb-4">{step.subtitle}</p>
                    <p className="font-ui text-text/60 leading-relaxed mb-6">{step.description}</p>
                    <ul className={`space-y-2 ${isLeft ? 'md:items-end' : ''}`}>
                      {step.details.map((d, di) => (
                        <li key={di} className={`flex items-start gap-2 font-ui text-sm text-text/70 ${isLeft ? 'md:flex-row-reverse md:text-right' : ''}`}><div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: step.color }}/>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={`flex-1 md:w-1/2 ${isLeft ? 'md:pl-16' : 'md:pr-16'}`}>
                    <div className={`relative rounded-2xl border overflow-hidden transition-all duration-700 ${isActive ? 'border-accent/20 shadow-[0_0_40px_rgba(138,43,226,0.1)]' : 'border-white/5'}`}>
                      <div className="absolute inset-0 pointer-events-none transition-opacity duration-700" style={{ opacity: isActive ? 1 : 0.4 }}><div className="absolute inset-0 bg-gradient-to-br from-white/2 to-transparent"/></div>
                      {step.demo(isActive)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none"/>
        <div className="max-w-3xl mx-auto relative z-10">
          <h2 className="font-heading font-bold text-4xl md:text-6xl text-white mb-6 leading-tight">¿Listo para<br/><span className="text-accent">grabar hoy?</span></h2>
          <p className="font-ui text-text/60 mb-10 leading-relaxed">Empieza con tu beat. Cuando lo tengas, reserva tu estudio en menos de 2 minutos.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/beats"><button className="inline-flex items-center gap-2 font-ui text-sm uppercase tracking-widest bg-accent text-white px-8 py-4 rounded-xl hover:bg-[#9d3df2] transition-all shadow-[0_0_30px_rgba(138,43,226,0.3)] hover:shadow-[0_0_50px_rgba(138,43,226,0.6)]"><Music className="w-4 h-4"/>Encuentra tu Beat</button></Link>
            <Link to="/book-studio"><button className="inline-flex items-center gap-2 font-ui text-sm uppercase tracking-widest bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all">Abrir Radar<ArrowRight className="w-4 h-4"/></button></Link>
          </div>
        </div>
      </section>
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <h2 className="font-heading font-bold text-3xl text-white mb-2 text-center">FAQ</h2>
        {FAQS.map((faq, i) => (
          <div key={i} className="border-b border-white/5 last:border-0" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
            <div className="flex justify-between items-center py-5 cursor-pointer">
              <span className="font-ui text-white/80">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-white/20 transition-transform ${openFaq === i ? 'rotate-180 text-accent' : ''}`}/>
            </div>
            {openFaq === i && <p className="font-ui text-sm text-text/50 pb-5">{faq.a}</p>}
          </div>
        ))}
      </section>
      <div className="py-12 border-t border-white/5 text-center text-text/20 font-ui text-[10px] tracking-widest uppercase">© {new Date().getFullYear()} Helicon · From Studio to Stadium</div>
      <style>{`
        @keyframes wave-bar { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
        .sound-signal-line { stroke-dasharray: 40; stroke-dashoffset: 40; animation: sound-pulse-anim 2.5s ease-in-out infinite; }
        @keyframes sound-pulse-anim { 0%, 10% { stroke-dashoffset: 40; filter: drop-shadow(0 0 0 transparent); } 50% { stroke-dashoffset: 0; filter: drop-shadow(0 0 8px #00F0FF); } 90%, 100% { stroke-dashoffset: -40; filter: drop-shadow(0 0 0 transparent); } }
      `}</style>
    </div>
  );
}
