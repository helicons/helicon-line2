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
  Search
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
      <div className={`flex items-center justify-between w-[90%] max-w-6xl rounded-full px-8 py-4 transition-all duration-500 ${
        scrolled ? 'bg-[#050505]/80 backdrop-blur-xl border border-white/10 shadow-2xl' : 'bg-transparent border-transparent'
      }`}>
        <div className="flex items-center gap-2 group cursor-pointer">
          <Activity className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
          <span className="font-heading font-bold text-xl tracking-wide text-white">Helicon</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 font-ui text-sm text-text/80">
          <a href="#studios" className="hover:text-accent transition-colors">Studios</a>
          <a href="#workflow" className="hover:text-accent transition-colors">Sessions</a>
          <a href="#community" className="hover:text-accent transition-colors">Artists</a>
          <a href="#beats" className="hover:text-accent transition-colors">Beats</a>
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
      {/* Background with Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=2070" 
          alt="Dark Recording Studio" 
          className="w-full h-full object-cover opacity-20 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/90 via-[#050505]/60 to-transparent"></div>
      </div>

      <div className="relative z-10 text-center max-w-5xl px-6 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 text-accent font-ui text-xs tracking-widest backdrop-blur-md hero-text">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
          System Online
        </div>
        
        <h1 className="font-heading font-bold text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight mb-6 relative z-10 text-center w-full">
          <div className="overflow-hidden"><div className="hero-text text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">Del Beat</div></div>
          <div className="overflow-hidden"><div className="hero-text text-accent glow-purple drop-shadow-[0_10px_30px_rgba(138,43,226,0.4)]">a Tu Canción.</div></div>
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
          { x: 0, opacity: 1, duration: 0.8,
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
                    <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
        {[1,2,3,4,5,6].map((i) => (
          <div key={i} className="glass-panel w-72 rounded-xl p-4 flex gap-4 items-center shrink-0">
            <img src={`https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=150&h=150`} alt="Studio" className="w-16 h-16 rounded-lg object-cover bg-surface" />
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
              <li><a href="#" className="hover:text-accent transition-colors">Book Studios</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Browse Beats</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Producers</a></li>
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
      {/* GLOBAL 3D RADAR BACKGROUND */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[120vw] md:h-[120vw] perspective-[2000px] opacity-25 mix-blend-screen">
          <div className="w-full h-full absolute inset-0" style={{ transform: 'rotateX(60deg) translateZ(-100px)' }}>
            <div className="absolute inset-0 m-auto w-[15%] h-[15%] rounded-full border-[2px] border-accent animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] shadow-[0_0_50px_rgba(138,43,226,0.8)]"></div>
            <div className="absolute inset-0 m-auto w-[30%] h-[30%] rounded-full border-[1.5px] border-accent/60 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_1.3s]"></div>
            <div className="absolute inset-0 m-auto w-[60%] h-[60%] rounded-full border border-accent/20 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite_2.6s]"></div>
            <div className="absolute inset-0 m-auto w-[100%] h-[100%] rounded-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(138,43,226,0)_0%,rgba(138,43,226,0.3)_100%)] animate-[spin_8s_linear_infinite] border-r-[3px] border-accent"></div>
            <div className="absolute inset-0 m-auto w-4 h-4 bg-accent rounded-full shadow-[0_0_60px_rgba(138,43,226,1)] animate-pulse"></div>
          </div>
        </div>
      </div>

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
