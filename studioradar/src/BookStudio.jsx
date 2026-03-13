import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, ArrowRight, Activity, CreditCard, ShieldCheck, Search, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function BookStudio() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Radar, 2: Studios, 3: Realtime Hours, 4: Checkout
  const [userLocation, setUserLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [artistName, setArtistName] = useState('');
  const [companions, setCompanions] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  const studios = [
    { 
      id: 1, name: "Neon Room", location: "Vallecas, Madrid", price: 20, specs: "15m² • Monitores Yamaha HS8 • Interfaz Apollo Twin",
      image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400", 
      images: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1621619892598-6e5405e3ecde?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?auto=format&fit=crop&q=80&w=600"
      ]
    },
    { 
      id: 2, name: "The Vault", location: "Torrejón, Madrid", price: 25, specs: "22m² • Monitores Focal Shape • Micro C414 XLII • Previo Neve",
      image: "https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=400", 
      images: [
        "https://images.unsplash.com/photo-1599696848652-f0ff23bc911f?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1605371924599-2d0365da26f5?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1516280440502-861036cb53cc?auto=format&fit=crop&q=80&w=600"
      ]
    },
    { 
      id: 3, name: "808 Suite", location: "Centro, Madrid", price: 35, specs: "35m² • Monitores Genelec • Consola SSL • Micros U87/Sony C800",
      image: "https://plus.unsplash.com/premium_photo-1681335029094-846c770c06ae?auto=format&fit=crop&q=80&w=400", 
      images: [
        "https://plus.unsplash.com/premium_photo-1681335029094-846c770c06ae?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1563720223185-11003d5169a6?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1534011831822-263a8a3a91ac?auto=format&fit=crop&q=80&w=600"
      ]
    },
  ];

  const timeSlots = [
    { time: "18:00", available: true },
    { time: "19:00", available: false },
    { time: "20:00", available: true },
    { time: "21:00", available: true },
    { time: "22:00", available: true },
    { time: "23:00", available: false },
    { time: "00:00", available: true },
    { time: "01:00", available: true },
    { time: "02:00", available: true },
  ];

  const services = [
    { id: 'rental', name: 'Studio Rental (Booth Only)', price: 0, required: true },
    { id: 'engineer', name: 'Recording with Engineer', price: 15 },
    { id: 'mix', name: 'Mix & Master (1 Song)', price: 150 },
  ];

  const toggleService = (id) => {
    if (id === 'rental') return;
    setSelectedServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const calculateTotal = () => {
    let total = selectedStudio ? selectedStudio.price : 0;
    selectedServices.forEach(id => {
      const service = services.find(s => s.id === id);
      if (service) total += service.price;
    });
    return total;
  };

  const handleScanLocation = () => {
    setIsScanning(true);
    setTimeout(() => {
      setUserLocation("Madrid");
      setIsScanning(false);
    }, 1500);
  };

  useEffect(() => {
    // Auto start scan on mount
    handleScanLocation();
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#050505]">
      
      {/* FULLSCREEN RADAR BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 opacity-40 transition-transform duration-[20s] hover:scale-105 ease-out"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1510006950785-50e50f38fa61?auto=format&fit=crop&q=80&w=2000&sat=-100&bri=-30')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="absolute inset-0 bg-[#050505]/70 mix-blend-multiply"></div>
        
        {/* Sweeping Conic Gradient */}
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] opacity-60 pointer-events-none">
          <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(138,43,226,0)_0%,rgba(138,43,226,0.3)_100%)] animate-[spin_4s_linear_infinite] rounded-full border-r-[3px] border-accent/80"></div>
        </div>

        {/* Rings */}
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[80vmax] h-[80vmax] rounded-full border border-accent/10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[50vmax] h-[50vmax] rounded-full border border-accent/20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-[20vmax] h-[20vmax] rounded-full border border-accent/30 pointer-events-none"></div>

        {/* Center Pin */}
        <div className="absolute top-1/2 left-[30%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#ffffff]">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-60"></div>
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
      </div>

      {/* STUDIO PINS ON THE MAP (Left Side focus) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {studios.map((studio, idx) => {
          // Adjust positions to be anchored to the left side 30% center mark
          const positions = [
            { top: '35%', left: '35%', labelPos: 'left-8 top-1/2 -translate-y-1/2' }, // Neon Room
            { top: '25%', left: '50%', labelPos: 'right-8 top-1/2 -translate-y-1/2 text-right', justify: 'items-end' }, // The Vault
            { top: '65%', left: '20%', labelPos: 'left-8 top-1/2 -translate-y-1/2' }, // 808 Suite
          ];
          const isSelected = selectedStudio?.id === studio.id;
          const pos = positions[idx];
          
          return (
            <div 
              key={studio.id}
              className={`absolute cursor-pointer flex flex-col ${pos.justify || 'items-start'} justify-center pointer-events-auto`}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => setSelectedStudio(studio)}
            >
              {/* Studio Dot */}
              <div className="relative group">
                 <div className={`absolute top-1/2 -translate-y-1/2 h-[1px] bg-accent/40 w-6 ${pos.labelPos.includes('left') ? 'left-full' : 'right-full'}`}></div>
                 
                 <div className={`relative w-6 h-6 rounded-full transition-all duration-300 z-10 flex items-center justify-center border border-white/20 ${isSelected ? 'bg-accent shadow-[0_0_40px_rgba(138,43,226,1)] scale-150 animate-pulse' : 'bg-[#0A0A0A] group-hover:bg-[#1A1A1A] group-hover:scale-125 group-hover:shadow-[0_0_20px_#8A2BE2]'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'} z-20`}></div>
                    <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-30"></div>
                 </div>
              </div>
              
              {/* Permanent Label Box */}
              <div className={`absolute ${pos.labelPos} w-52 bg-[#050505]/90 backdrop-blur-xl rounded-xl border p-3 pointer-events-none transition-all duration-300 ${isSelected ? 'border-accent shadow-[0_0_30px_rgba(138,43,226,0.6)] scale-110 z-30' : 'border-white/10 z-20'}`}>
                <div className="w-full h-20 mb-3 rounded-lg overflow-hidden border border-white/5 relative">
                  <div className={`absolute inset-0 bg-accent/30 mix-blend-color z-10 transition-opacity duration-300 ${isSelected ? 'opacity-0' : 'opacity-100'}`}></div>
                  <img src={studio.image} alt={studio.name} className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'grayscale-0 scale-110 opacity-100' : 'grayscale-[80%] opacity-70'}`} />
                </div>
                <h3 className="font-heading font-bold text-base text-white leading-tight mb-1">{studio.name}</h3>
                <div className="flex justify-between items-end">
                  <span className="flex items-center gap-1 font-ui text-[10px] text-text/50 truncate max-w-[60%]">
                     <MapPin className="w-3 h-3 text-accent" /> {studio.location.split(',')[0]}
                  </span>
                  <span className="font-ui font-bold text-accent text-sm glow-purple">{studio.price}€<span className="text-[10px] text-white/50 font-normal">/h</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOREGROUND INTERFACE */}
      <div className="relative z-20 w-full h-full min-h-screen flex flex-col pt-10 pb-8 px-6 max-w-7xl mx-auto pointer-events-none">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pointer-events-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text/60 hover:text-white transition-colors cursor-pointer font-ui text-sm bg-[#050505]/50 backdrop-blur-md py-2 px-4 rounded-full border border-white/10">
            <ArrowLeft className="w-4 h-4" />
            Salir del Radar
          </button>
          
          <div className="flex items-center gap-3 bg-[#050505]/50 backdrop-blur-md py-2 px-5 rounded-full border border-white/10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span className="font-ui text-xs tracking-widest text-white/80 uppercase">
              {isScanning ? 'Rastreando Zona...' : 'Radar Activo'}
            </span>
          </div>
        </div>

        {/* Right Side Booking Panel */}
        <div className="flex flex-grow justify-end pointer-events-none">
          <div className="w-full lg:w-[450px] flex flex-col gap-4 max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto pr-2 custom-scrollbar">
            
            {!selectedStudio ? (
              <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center h-full animate-[fade-in_0.5s_ease-out]">
                <Activity className="w-12 h-12 text-accent mb-4 animate-pulse" />
                <h2 className="font-heading font-bold text-2xl text-white mb-2">Esperando Selección</h2>
                <p className="font-ui text-sm text-text/50">Toca un punto en el radar para cargar los detalles del estudio y configurar la reserva de la sesión.</p>
              </div>
            ) : step === 3 ? (
              <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.5s_ease-out]">
                
                {/* Selected Studio Mini Header */}
                <div className="flex gap-4 items-center mb-6 pb-6 border-b border-white/5">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
                    <img src={selectedStudio.image} alt={selectedStudio.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-xl text-white leading-tight">{selectedStudio.name}</h3>
                    <div className="font-ui text-xs text-text/50 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3 text-accent" /> {selectedStudio.location}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h1 className="font-heading font-bold text-xl text-white">Disponibilidad (Hoy)</h1>
                  <span className="font-ui text-[10px] text-accent border border-accent/20 bg-accent/10 px-2 py-1 rounded">M A D R I D</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-white/5">
                  {timeSlots.map((slot, i) => (
                    <button 
                      key={i}
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-3 rounded-lg font-ui text-xs border transition-all duration-200 ${
                        !slot.available ? 'bg-[#050505]/80 border-white/5 text-text/20 cursor-not-allowed' :
                        selectedTime === slot.time ? 'bg-accent/20 border-accent text-white shadow-[0_0_15px_rgba(138,43,226,0.3)]' :
                        'bg-[#050505]/50 border-white/10 text-text/80 hover:border-white/30'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>

                <Button 
                  onClick={() => setStep(4)} 
                  disabled={!selectedTime}
                  className={`w-full py-4 ${(!selectedTime) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Continuar al Boleto
                </Button>
              </div>
            ) : (
              /* CHECKOUT PANEL (Step 4) */
              <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.5s_ease-out]">
                 <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setStep(3)} className="text-text/50 hover:text-white transition-colors">
                      <ArrowLeft className="w-5 h-5"/>
                    </button>
                    <h1 className="font-heading font-bold text-2xl text-white">Boleto de Sesión</h1>
                 </div>

                 <div className="bg-[#050505]/60 rounded-2xl border border-white/5 p-5 mb-5">
                    {/* STUDIO CAROUSEL */}
                    <div className="w-full relative h-[180px] rounded-xl overflow-hidden mb-4 border border-white/5 group">
                      <img 
                        src={selectedStudio.images[currentImageIndex]} 
                        alt={`${selectedStudio.name} view ${currentImageIndex + 1}`} 
                        className="w-full h-full object-cover transition-opacity duration-300" 
                      />
                      
                      {/* Nav Buttons */}
                      <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? selectedStudio.images.length - 1 : prev - 1)); }}
                          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition shadow-lg border border-white/10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === selectedStudio.images.length - 1 ? 0 : prev + 1)); }}
                          className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/80 transition shadow-lg border border-white/10"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dots */}
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                        {selectedStudio.images.map((_, i) => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-accent w-3' : 'bg-white/40'}`}></div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-end mb-3 border-b border-white/5 pb-3">
                      <div>
                        <span className="block font-ui text-[10px] text-accent mb-1 uppercase tracking-widest">Estudio</span>
                        <span className="font-heading font-bold text-xl text-white">{selectedStudio.name}</span>
                      </div>
                      <span className="font-ui text-sm text-text/50">{selectedTime}</span>
                    </div>

                    <div className="space-y-1 font-ui text-xs text-text/60 leading-relaxed mb-4">
                      {selectedStudio.specs.split('•').map((spec, i) => (
                        <div key={i} className="flex items-center gap-2">
                           <div className="w-1 h-1 bg-accent/50 rounded-full"></div>
                           {spec.trim()}
                        </div>
                      ))}
                    </div>

                    {/* Artist & Companions Input inside Ticket */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <h4 className="font-ui text-[10px] text-text/50 uppercase tracking-widest mb-3">Datos del Artista</h4>
                      <input 
                        type="text" 
                        value={artistName} 
                        onChange={e => setArtistName(e.target.value)} 
                        placeholder="Tu nombre o alias artístico *" 
                        className="w-full bg-[#050505]/80 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent font-ui text-xs transition-colors mb-4"
                      />
                      
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-ui text-[10px] text-text/50 uppercase tracking-widest">Acompañantes (Máx 3)</span>
                        {companions.length < 3 && (
                          <button onClick={() => setCompanions([...companions, ''])} className="text-accent text-xs font-bold hover:underline">
                            + Añadir
                          </button>
                        )}
                      </div>
                      {companions.map((comp, i) => (
                        <div key={i} className="flex gap-2 mb-2 animate-[fade-in_0.2s_ease-out]">
                          <input 
                            type="text" 
                            value={comp} 
                            onChange={e => {
                              const newC = [...companions];
                              newC[i] = e.target.value;
                              setCompanions(newC);
                            }} 
                            placeholder={`Invitado ${i + 1}`} 
                            className="w-full bg-[#050505]/80 border border-white/10 rounded-xl py-2 px-3 text-white placeholder:text-white/30 focus:outline-none focus:border-accent font-ui text-xs transition-colors"
                          />
                          <button 
                            onClick={() => setCompanions(companions.filter((_, index) => index !== i))} 
                            className="text-red-500 hover:text-white px-3 border border-transparent hover:border-red-500/20 rounded-xl transition-all font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                 </div>

                 <div className="space-y-3 font-ui text-sm mb-6 flex-grow">
                    <div className="flex justify-between">
                      <span className="text-text/60">Alquiler de Cabina (1h)</span>
                      <span className="text-white font-bold">{selectedStudio.price}€</span>
                    </div>
                 </div>

                 <div className="border-t border-white/10 pt-4 mb-6">
                    <div className="flex justify-between items-end">
                      <span className="font-heading font-semibold text-lg text-text/80">Total Efectivo</span>
                      <span className="font-heading font-bold text-4xl text-accent glow-purple">{calculateTotal()}€</span>
                    </div>
                 </div>

                 <Button 
                   className={`w-full py-5 flex justify-center gap-2 text-lg ${(!artistName.trim()) ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(138,43,226,0.5)]'}`} 
                   onClick={() => alert(`¡Integración de Pago Finalizada!\nEstudio: ${selectedStudio.name}\nArtista: ${artistName}\nInvitados: ${companions.length}`)}
                   disabled={!artistName.trim()}
                 >
                   <CreditCard className="w-5 h-5" /> 
                   {artistName.trim() ? 'Confirmar Reserva' : 'Falta Nombre Artista'}
                 </Button>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// simple Check icon component if lucide check is imported but unused or to replace it.
function Check({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
