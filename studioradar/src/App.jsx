import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Play,
  MapPin,
  Calendar,
  Mic,
  Headphones,
  ArrowRight,
  Volume2,
  Radio,
  Map,
  Check,
  Activity,
  Zap,
  Disc3,
  Search,
  ShoppingCart
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// -------------------------------------------------------------
// UI COMPONENTS
// -------------------------------------------------------------

const Button = ({ children, className = '', variant = 'primary', ...props }) => {
  const base = "inline-flex items-center justify-center font-ui text-sm uppercase tracking-widest transition-all duration-300 ease-out active:scale-95 active:duration-75 rounded-lg";
  const variants = {
    primary: "bg-accent text-white hover:bg-[#9d3df2] shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_30px_rgba(138,43,226,0.6)] px-8 py-4",
    secondary: "bg-surface text-text hover:bg-[#252525] border border-white/10 px-6 py-3",
    ghost: "text-text hover:text-white hover:bg-white/5 px-4 py-2"
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// -------------------------------------------------------------
// SECTIONS
// -------------------------------------------------------------

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 transition-all duration-500`}>
      <div className={`flex items-center justify-between w-[90%] max-w-6xl rounded-full px-8 py-4 transition-all duration-500 ${scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-transparent border-transparent'
        }`}>
        <div className="flex items-center gap-2 group cursor-pointer">
          <Activity className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
          <span className="font-heading font-bold text-xl tracking-wide text-white">Helicon</span>
        </div>

        <div className="hidden md:flex items-center gap-8 font-ui text-sm text-text/80">
          <Link to="/book-studio" className="hover:text-accent transition-colors">Studios</Link>
          <a href="#workflow" className="hover:text-accent transition-colors">Sessions</a>
          <Link to="/artists" className="hover:text-accent transition-colors">Artistas</Link>
          <Link to="/beats" className="hover:text-accent transition-colors font-bold text-white flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Beats Market</Link>
        </div>

        <Link to="/book-studio">
          <Button variant={scrolled ? 'primary' : 'secondary'} className="px-6 py-2 text-xs">
            Open Studio
          </Button>
        </Link>
      </div>
    </nav>
  );
};

// -------------------------------------------------------------
// RADAR BACKGROUND — Vinyl Record + Studio Nodes
// -------------------------------------------------------------
const STUDIO_NODES = [
  { id: 1, name: 'Neon Room', x: 30, y: 30, accent: false, dist: '~1.2 km' },
  { id: 2, name: 'The Vault', x: 74, y: 28, accent: true, dist: '~2.8 km' },
  { id: 3, name: '808 Suite', x: 65, y: 73, accent: false, dist: '~4.5 km' },
];

function useWindowWidth() {
  const [width, setWidth] = React.useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  React.useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

const RadarBackground = () => {
  const cx = 50, cy = 50;
  const width = useWindowWidth();
  const isMobile = width < 768;
  // On mobile: smaller grooves & reduced node decorations
  const grooves = isMobile
    ? [5, 9, 14, 19, 25, 31]
    : [6, 11, 16.5, 22, 27.5, 33, 38, 43];

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ── Crosshair Lines ── */}
        <line x1="0" y1={cy} x2="100" y2={cy} stroke="rgba(255,255,255,0.04)" strokeWidth="0.1" />
        <line x1={cx} y1="0" x2={cx} y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.1" />

        {/* ── Vinyl Grooves ── */}
        {grooves.map((r, i) => (
          <circle key={`groove-${i}`} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={`rgba(255,255,255,${0.05 + i * 0.015})`}
            strokeWidth={isMobile ? '0.2' : '0.15'}
          />
        ))}

        {/* ── Center Spindle ── */}
        <circle cx={cx} cy={cy} r="1.2" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.15" />
        <circle cx={cx} cy={cy} r="0.4" fill="rgba(255,255,255,0.6)" />

        {/* ── Connection Lines ── */}
        {STUDIO_NODES.map((a, i) =>
          STUDIO_NODES.slice(i + 1).map(b => (
            <line key={`conn-${a.id}-${b.id}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.12"
              strokeDasharray="0.6 0.4"
            />
          ))
        )}

        {/* ── Studio Nodes ── */}
        {STUDIO_NODES.map(node => {
          const pinColor = node.accent ? 'rgba(0,122,255,0.95)' : 'rgba(255,255,255,0.9)';
          const pingColor = node.accent ? 'rgba(0,122,255,0.5)' : 'rgba(138,43,226,0.4)';
          // Mobile: tighten vertical spacing
          const labelY = isMobile ? node.y - 2.6 : node.y - 3.4;
          const distY = isMobile ? node.y + 1.6 : node.y + 2;
          const nameFontSize = isMobile ? '1.1' : '1.5';
          const distFontSize = isMobile ? '0.85' : '1.1';
          const pinScale = isMobile ? 0.07 : 0.1;
          const pinOffsetX = isMobile ? node.x - 0.84 : node.x - 1.2;
          const pinOffsetY = isMobile ? node.y - 1.96 : node.y - 2.8;

          return (
            <g key={node.id} style={{ animation: `node-float ${3 + node.id * 0.5}s ease-in-out infinite` }}>
              {/* Ping ring */}
              <circle cx={node.x} cy={node.y} r={isMobile ? '1.1' : '1.6'}
                fill="none" stroke={pingColor} strokeWidth="0.15"
                style={{ animation: `node-ping ${2 + node.id * 0.3}s ease-in-out infinite`, transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {/* Location Pin */}
              <g transform={`translate(${pinOffsetX}, ${pinOffsetY}) scale(${pinScale})`} filter="url(#glow-strong)">
                <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9zm0 12.75c-2.07 0-3.75-1.68-3.75-3.75S9.93 5.25 12 5.25s3.75 1.68 3.75 3.75-1.68 3.75-3.75 3.75z"
                  fill={pinColor} />
              </g>
              {/* Studio Name */}
              <text x={node.x} y={labelY} textAnchor="middle"
                fill="rgba(255,255,255,0.7)"
                fontSize={nameFontSize}
                fontFamily="'Space Mono',monospace"
                letterSpacing="0.06"
              >{node.name}</text>
              {/* Distance — hide on very small screens */}
              {!isMobile && (
                <text x={node.x} y={distY} textAnchor="middle"
                  fill="rgba(255,255,255,0.35)"
                  fontSize={distFontSize}
                  fontFamily="'Space Mono',monospace"
                  letterSpacing="0.04"
                >{node.dist}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* ── Rotating Sweep Arm ── */}
      <div className="absolute" style={{ top: 0, left: 0, width: '100%', height: '100%', animation: 'radar-spin 8s linear infinite' }}>
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: isMobile ? '40%' : '45%', height: '1px',
          transformOrigin: '0% 50%',
          background: 'linear-gradient(90deg, rgba(138,43,226,0.7), rgba(138,43,226,0))',
          boxShadow: '0 0 8px rgba(138,43,226,0.5)',
          animation: 'sweep-glow 4s ease-in-out infinite',
        }} />
      </div>

      {/* ── Expanding Pulse Waves ── */}
      {[0, 1.3, 2.6].map((delay, i) => (
        <div key={`pulse-${i}`} className="absolute rounded-full border pointer-events-none"
          style={{
            top: '50%', left: '50%',
            width: isMobile ? '70%' : '86%', height: isMobile ? '70%' : '86%',
            borderColor: 'rgba(138,43,226,0.12)',
            borderWidth: '1px',
            animation: `radar-pulse 4s ease-out ${delay}s infinite`,
          }}
        />
      ))}

      {/* ── Edge gradients ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/60" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/40 via-transparent to-[#050505]/50" />
    </div>
  );
};

const Hero = () => {
  const heroRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo('.hero-text',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, delay: 0.2 }
      )
        .fromTo('.hero-sub',
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 1 }, "-=0.8"
        )
        .fromTo('.hero-btn',
          { scale: 0.9, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.8 }, "-=0.6"
        );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
      <div className="relative z-10 text-center max-w-5xl px-6 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 text-accent font-ui text-xs tracking-widest backdrop-blur-md hero-text">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          System Online
        </div>

        <h1 className="font-heading font-bold text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight mb-6 relative z-10 text-center w-full">
          <div className="overflow-hidden"><div className="hero-text text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">Del Studio</div></div>
          <div className="overflow-hidden"><div className="hero-text text-accent glow-purple drop-shadow-[0_10px_30px_rgba(138,43,226,0.4)]">al Estadio.</div></div>
        </h1>

        <p className="hero-sub font-ui text-lg md:text-xl text-text/80 max-w-2xl mb-10 leading-relaxed">
          Reserva estudios premium cerca de ti por horas y encuentra el beat perfecto para tu próxima sesión. El estudio nocturno definitivo.
        </p>

        <div className="hero-btn">
          <Link to="/book-studio">
            <Button className="group text-lg px-10 py-5">
              Empieza a Crear Tu Próxima Canción
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  const sectionRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo('.feature-card',
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-primary/80 backdrop-blur-md relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Radar Scanner (Studios First) */}
          <div className="feature-card glass-panel rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-500 flex flex-col">
            <div className="mb-6 w-12 h-12 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-accent">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-2xl text-white mb-3">Estudios Cerca de Ti, Listos para Grabar</h3>
            <p className="font-ui text-sm text-text/70 mb-8 flex-grow">
              Encuentra y reserva sesiones por horas en los mejores estudios disponibles cerca de tu ubicación.
            </p>
            {/* Visual: Radar Simulation */}
            <div className="h-24 bg-[#0A0A0A] rounded-lg border border-accent/20 overflow-hidden relative flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(138,43,226,0.1)_0%,transparent_70%)]"></div>
              <div className="w-16 h-16 rounded-full border border-accent/40 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-accent animate-spin"></div>
                <div className="absolute w-2 h-2 bg-accent rounded-full animate-ping"></div>
              </div>
            </div>
          </div>

          {/* Card 2: Booking Fader (Sessions Second) */}
          <div className="feature-card glass-panel rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-500 flex flex-col">
            <div className="mb-6 w-12 h-12 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-accent">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-2xl text-white mb-3">Agenda Tu Sesión Sin Fricción</h3>
            <p className="font-ui text-sm text-text/70 mb-8 flex-grow">
              Desde alquiler de cabina hasta sesiones enteras con ingeniero, selecciona tu horario al instante.
            </p>
            {/* Visual: Fader/Calendar Simulation */}
            <div className="h-24 bg-[#0A0A0A] rounded-lg border border-white/5 overflow-hidden flex flex-col justify-between p-4 shadow-inner">
              <div className="flex justify-between items-center mb-2">
                <span className="font-ui text-xs text-text/50">LUN 24</span>
                <span className="font-ui text-xs text-accent glow-purple">23:00 - 03:00</span>
              </div>
              <div className="w-full bg-surface h-8 rounded border border-white/5 flex items-center px-3 relative">
                <div className="absolute left-0 top-0 bottom-0 w-3/4 bg-accent/20 rounded-l"></div>
                <div className="w-1 h-4 bg-accent rounded-full absolute left-3/4 shadow-[0_0_10px_#8A2BE2]"></div>
                <span className="font-ui text-[10px] text-white/80 z-10 font-bold">STUDIO RENTAL</span>
              </div>
            </div>
          </div>

          {/* Card 3: Sequencer (Beats Third) */}
          <div className="feature-card glass-panel rounded-2xl p-8 hover:-translate-y-2 transition-transform duration-500 flex flex-col">
            <div className="mb-6 w-12 h-12 rounded-xl bg-surface border border-white/10 flex items-center justify-center text-accent">
              <Disc3 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-2xl text-white mb-3">Encuentra o Trae Tu Propio Beat</h3>
            <p className="font-ui text-sm text-text/70 mb-8 flex-grow">
              Explora instrumentales profesionales y compra licencias al instante si aún no tienes tu sonido.
            </p>
            {/* Visual: Sequencer Marquee */}
            <div className="h-24 bg-[#0A0A0A] rounded-lg border border-white/5 overflow-hidden relative flex flex-col justify-center gap-2 p-3 shadow-inner">
              <div className="flex gap-2 animate-[pulse_2s_ease-in-out_infinite]">
                <div className="h-2 w-1/4 bg-accent/40 rounded-full"></div>
                <div className="h-2 w-1/2 bg-accent/80 rounded-full"></div>
                <div className="h-2 w-1/4 bg-accent rounded-full"></div>
              </div>
              <div className="flex gap-2 opacity-50">
                <div className="h-2 w-1/3 bg-white/20 rounded-full"></div>
                <div className="h-2 w-1/4 bg-white/40 rounded-full"></div>
                <div className="h-2 w-1/3 bg-white/20 rounded-full"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

const Workflow = () => {
  const workflowRef = useRef(null);

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      gsap.to('.workflow-line', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: workflowRef.current,
          start: "top 50%",
          end: "bottom 80%",
          scrub: 1
        }
      });

      gsap.utils.toArray('.workflow-step').forEach((step, i) => {
        gsap.fromTo(step,
          { x: i % 2 === 0 ? -30 : 30, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.8,
            scrollTrigger: {
              trigger: step,
              start: "top 80%",
            }
          }
        );
      });
    }, workflowRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    { icon: Map, title: "1. Locate a Studio", desc: "Find a premium recording studio nearby with real-time availability." },
    { icon: Mic, title: "2. Lock in your session", desc: "Reserve a recording booth or mixing session seamlessly." },
    { icon: Headphones, title: "3. Choose a Beat (Optional)", desc: "Need instrumentals? Browse and buy beats directly before you hit the booth." },
  ];

  return (
    <section ref={workflowRef} id="workflow" className="py-24 bg-[#080808]/80 backdrop-blur-md relative">
      <div className="max-w-4xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-4xl lg:text-5xl text-white mb-4">The Pipeline</h2>
          <p className="font-ui text-text/70">Tres simples pasos para materializar tu visión.</p>
        </div>

        <div className="relative">
          {/* Signal Line */}
          <div className="absolute left-[39px] md:left-1/2 top-0 bottom-0 w-[2px] bg-white/5 -ml-[1px]">
            <div className="workflow-line w-full bg-accent h-0 shadow-[0_0_15px_#8A2BE2]"></div>
          </div>

          <div className="space-y-16">
            {steps.map((step, idx) => (
              <div key={idx} className={`workflow-step flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className={`md:w-1/2 flex ${idx % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}>
                  <div className="glass-panel p-6 rounded-2xl w-full max-w-sm hover:border-accent/40 transition-colors">
                    <h4 className="font-heading font-semibold text-xl text-white mb-2">{step.title}</h4>
                    <p className="font-ui text-sm text-text/70">{step.desc}</p>
                  </div>
                </div>

                <div className="relative z-10 w-20 flex justify-center shrink-0">
                  <div className="w-16 h-16 rounded-full bg-primary border-2 border-accent flex items-center justify-center shadow-[0_0_20px_rgba(138,43,226,0.2)]">
                    <step.icon className="w-6 h-6 text-accent" />
                  </div>
                </div>

                <div className="hidden md:block md:w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Commerce = () => {
  return (
    <section className="py-24 bg-primary/80 backdrop-blur-md" id="beats">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

          {/* STUDIO SESSIONS FIRST */}
          <div id="studios">
            <div className="flex items-center gap-3 mb-8">
              <Radio className="w-6 h-6 text-accent" />
              <h2 className="font-heading font-bold text-3xl text-white">Studio Sessions</h2>
            </div>

            <div className="glass-panel rounded-2xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-6 pb-6 border-b border-white/10">
                <MapPin className="w-4 h-4 text-accent" />
                <span className="font-ui text-sm text-text/80">Disponibilidad en: <strong className="text-white">Madrid (Vallecas, Torrejón)</strong></span>
              </div>

              <div className="space-y-4 font-ui text-sm">
                <div className="flex justify-between items-center py-2 hover:text-white transition-colors">
                  <span className="text-text/80">Studio Rental (Booth Only)</span>
                  <span className="text-accent">from 20€/h</span>
                </div>
                <div className="flex justify-between items-center py-2 hover:text-white transition-colors">
                  <span className="text-text/80">Recording w/ Engineer</span>
                  <span className="text-accent">from 15€/h</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-white/5 pt-4 mt-2">
                  <span className="text-white font-bold">Full Artist Session <span className="text-[10px] text-text/50 uppercase block mt-1">Rec + Mix + Master</span></span>
                  <span className="text-accent font-bold text-lg">from 350€</span>
                </div>
              </div>

              <Link to="/book-studio" className="w-full mt-8 block">
                <Button className="w-full text-black" variant="primary">Ver Horarios Disponibles</Button>
              </Link>
            </div>
          </div>

          {/* BEAT LICENSES SECOND */}
          <div id="beats">
            <div className="flex items-center gap-3 mb-8">
              <Volume2 className="w-6 h-6 text-accent" />
              <h2 className="font-heading font-bold text-3xl text-white">Beat Licenses</h2>
            </div>

            <div className="space-y-4">
              {[
                { name: 'Basic', format: 'MP3 License', price: '29€' },
                { name: 'Premium', format: 'WAV License', price: '79€', popular: true },
                { name: 'Exclusive', format: 'WAV + Stems', price: '450€' },
              ].map((tier, i) => (
                <div key={i} className={`flex items-center justify-between p-5 rounded-xl border transition-all duration-300 ${tier.popular ? 'border-accent bg-accent/5 shadow-[0_0_30px_rgba(138,43,226,0.1)]' : 'border-white/10 bg-surface/30 hover:bg-surface'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-semibold text-lg text-white">{tier.name}</span>
                      {tier.popular && <span className="text-[10px] font-ui bg-accent text-white px-2 py-0.5 rounded uppercase tracking-wider">Pop</span>}
                    </div>
                    <span className="font-ui text-sm text-text/60">{tier.format}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-ui font-bold text-xl text-white">{tier.price}</span>
                    <Link to="/beats" className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/beats" className="w-full mt-6 block">
              <Button className="w-full" variant="secondary">Explorar Mercado de Beats</Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

const Community = () => {
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
      <div className="flex gap-6 animate-[scroll_20s_linear_infinite] w-max select-none">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-panel w-72 rounded-xl p-4 flex gap-4 items-center shrink-0">
            <img src={`https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=150&h=150`} alt="Studio" className="w-16 h-16 rounded-lg object-cover bg-surface" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-red-500" />
                <span className="font-heading font-semibold text-white text-sm">Studio {String.fromCharCode(64 + i)}</span>
              </div>
              <p className="font-ui text-xs text-text/60 flex items-center gap-1"><MapPin className="w-3 h-3" /> Madrid</p>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-[#030303]/90 backdrop-blur-md pt-24 pb-8 border-t border-white/5 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4 group cursor-pointer">
              <Activity className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
              <span className="font-heading font-bold text-2xl tracking-wide text-white">Helicon</span>
            </div>
            <p className="font-ui text-sm text-text/60 max-w-sm leading-relaxed mb-6">
              Where artists turn ideas into songs. Reserva tu sesión de estudio por horas y encuentra el beat perfecto en un solo lugar.
            </p>
            <div className="flex items-center gap-2 font-ui text-xs text-green-500 bg-green-500/10 px-3 py-1.5 rounded w-max">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              System Operational
            </div>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2 font-ui text-sm text-text/60">
              <li><Link to="/book-studio" className="hover:text-accent transition-colors">Book Studios</Link></li>
              <li><Link to="/beats" className="hover:text-accent transition-colors">Browse Beats</Link></li>
              <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
              <li><Link to="/producers" className="hover:text-accent transition-colors">Producers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 font-ui text-sm text-text/60">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">License Agreements</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-ui text-xs text-text/40">© {new Date().getFullYear()} Helicon. All rights reserved.</p>
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-surface border border-white/5 flex items-center justify-center text-text/60 hover:text-white hover:border-white/20 transition-all cursor-pointer">
              X
            </div>
            <div className="w-8 h-8 rounded-full bg-surface border border-white/5 flex items-center justify-center text-text/60 hover:text-white hover:border-white/20 transition-all cursor-pointer">
              IG
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

function App() {
  return (
    <div className="min-h-screen relative antialiased bg-[#050505]">
      {/* GLOBAL VINYL RADAR BACKGROUND */}
      <RadarBackground />

      <div className="relative z-10 w-full">
        <Navbar />
        <Hero />
        <Features />
        <Workflow />
        <Commerce />
        <Community />
        <Footer />
      </div>
    </div>
  );
}

export default App;
