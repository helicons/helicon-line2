import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, ArrowRight, Activity, CreditCard, ShieldCheck, Search, Navigation, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from './lib/supabase';
import Cal, { getCalApi } from "@calcom/embed-react";
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

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
  const [step, setStep] = useState(1); // 1: Radar, 2: Service, 3: Artist, 4: Schedule, 5: Pay, 6: Success
  const [userLocation, setUserLocation] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null); 
  const [hoursCount, setHoursCount] = useState(1);
  const [artistName, setArtistName] = useState('');
  const [companions, setCompanions] = useState([]);
  const [studios, setStudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState(null);
  const [studioServices, setStudioServices] = useState([]);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  // Pan & Zoom state
  const [mapScale, setMapScale] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const pointerDown = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const lastTouchDist = useRef(null);
  const DRAG_THRESHOLD = 8;

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setMapScale(prev => Math.min(3, Math.max(0.5, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('.booking-panel')) return;
    pointerDown.current = true;
    setHasMoved(false);
    startPos.current = { x: e.clientX, y: e.clientY };
    dragStart.current = { x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y };
  }, [mapOffset]);

  const handlePointerMove = useCallback((e) => {
    if (!pointerDown.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > DRAG_THRESHOLD) {
      setHasMoved(true);
      setIsDragging(true);
      setMapOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    pointerDown.current = false;
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.booking-panel')) return;
    if (e.touches.length === 1) {
      pointerDown.current = true;
      setHasMoved(false);
      const t = e.touches[0];
      startPos.current = { x: t.clientX, y: t.clientY };
      dragStart.current = { x: t.clientX - mapOffset.x, y: t.clientY - mapOffset.y };
    }
  }, [mapOffset]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (lastTouchDist.current !== null) {
        const delta = (dist - lastTouchDist.current) * 0.005;
        setMapScale(prev => Math.min(3, Math.max(0.5, prev + delta)));
      }
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && pointerDown.current) {
      const t = e.touches[0];
      const dx = t.clientX - startPos.current.x;
      const dy = t.clientY - startPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > DRAG_THRESHOLD) {
        setHasMoved(true);
        setIsDragging(true);
        setMapOffset({ x: t.clientX - dragStart.current.x, y: t.clientY - dragStart.current.y });
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pointerDown.current = false;
    setIsDragging(false);
    lastTouchDist.current = null;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        const { data, error } = await supabase.from('studios').select('*');
        if (error) throw error;
        setStudios(data || []);
      } catch (err) {
        console.error('Error fetching studios:', err);
        setError('Error al cargar estudios.');
      } finally {
        setLoading(false);
      }
    };
    fetchStudios();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedStudio) return;
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('studio_services')
          .select('*')
          .eq('studio_id', selectedStudio.id);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setStudioServices([
            { id: 'rental', name: 'Studio Rental (Booth Only)', description: 'Espacio privado sin asistencia técnica.', additional_price: 0 },
            { id: 'engineer', name: 'Recording with Engineer', description: 'Incluye ingeniero de sonido profesional.', additional_price: 15 },
            { id: 'full', name: 'Full Artist Session', description: 'Grabación, Mezcla y Masterización profesional.', is_package: true, package_price: 350 },
          ]);
        } else {
          setStudioServices(data);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [selectedStudio]);

  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "dark",
        styles: { branding: { brandColor: "#8A2BE2" } },
        hideEventTypeDetails: false,
        layout: "month_view"
      });
    })();
  }, []);

  const calculateTotal = () => {
    if (!selectedStudio || !selectedCategory) return 0;
    const category = studioServices.find(c => c.id === selectedCategory);
    if (!category) return 0;
    if (category.is_package) return category.package_price;
    const hourlyRate = (selectedStudio.price_per_hour || 0) + (category.additional_price || 0);
    return hourlyRate * hoursCount;
  };

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('quick-task', {
        body: {
          studioId: selectedStudio.id,
          studioName: selectedStudio.name,
          serviceId: selectedCategory,
          serviceName: studioServices.find(s => s.id === selectedCategory)?.name,
          amount: calculateTotal(),
          bookingId: bookingInfo?.bookingId,
          artistName: artistName
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de pago.');
      }
    } catch (err) {
      console.error('Error detallado en el pago:', err);
      const isDevError = err.name === 'FunctionsFetchError' || err.message?.includes('Failed to fetch');
      const isPlaceholder = !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('tu_llave');

      if (isDevError || isPlaceholder) {
        alert('Simulando redirección a Stripe Checkout...\n(Configura tus llaves para producción)');
        setTimeout(() => setStep(6), 1500);
      } else {
        alert('Error al conectar con la pasarela: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setIsPaying(false);
    }
  };

  useEffect(() => {
    setIsScanning(true);
    setTimeout(() => {
      setUserLocation("Madrid");
      setIsScanning(false);
    }, 1500);
  }, []);

  return (
    <div 
      className="min-h-screen relative flex items-stretch lg:items-center justify-center overflow-hidden bg-[#050505]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      
      {/* MAP LAYER */}
      <div 
        className="absolute inset-0 z-0 origin-center transition-transform duration-75"
        style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})` }}
      >
        <div className="absolute inset-0 bg-[#050505]/70 mix-blend-multiply"></div>
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] opacity-60 pointer-events-none">
          <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(138,43,226,0)_0%,rgba(138,43,226,0.3)_100%)] animate-[spin_4s_linear_infinite] rounded-full border-r-[3px] border-accent/80"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#ffffff]">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-60"></div>
        </div>

        {studios.map((studio, idx) => {
          const positions = [
            { top: '30%', left: '25%', labelPos: 'left-8 top-1/2 -translate-y-1/2' },
            { top: '25%', left: '50%', labelPos: 'right-8 top-1/2 -translate-y-1/2 text-right', justify: 'items-end' },
            { top: '65%', left: '20%', labelPos: 'left-8 top-1/2 -translate-y-1/2' },
          ];
          const isSelected = selectedStudio?.id === studio.id;
          const pos = positions[idx % positions.length];
          return (
            <div 
              key={studio.id}
              className={`absolute cursor-pointer flex flex-col ${pos.justify || 'items-start'} justify-center pointer-events-auto`}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => { if (!hasMoved) { setSelectedStudio(studio); setStep(2); } }}
            >
              <div className="relative group">
                 <div className={`relative w-6 h-6 rounded-full transition-all duration-300 z-10 flex items-center justify-center border border-white/20 ${isSelected ? 'bg-accent shadow-[0_0_40px_rgba(138,43,226,1)] scale-150' : 'bg-[#0A0A0A]'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`}></div>
                 </div>
              </div>
              <div className={`lg:block absolute ${pos.labelPos} w-52 bg-[#050505]/90 backdrop-blur-xl rounded-xl border p-3 transition-all duration-300 ${isSelected ? 'border-accent shadow-[0_0_30px_rgba(138,43,226,0.6)]' : 'border-white/10 opacity-60'}`}>
                <h3 className="font-heading font-bold text-base text-white mb-1">{studio.name}</h3>
                <span className="font-ui font-bold text-accent text-sm">{studio.price_per_hour}€<span className="text-[10px] text-white/50 font-normal">/h</span></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* INTERFACE */}
      <div className="relative z-20 w-full min-h-screen flex flex-col pt-10 pb-8 px-6 max-w-7xl mx-auto pointer-events-none">
        
        <div className="flex items-center justify-between mb-8 pointer-events-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text/60 hover:text-white font-ui text-sm bg-[#050505]/50 backdrop-blur-md py-2 px-4 rounded-full border border-white/10">
            <ArrowLeft className="w-4 h-4" /> Salir del Radar
          </button>
          <div className="bg-[#050505]/50 backdrop-blur-md py-2 px-5 rounded-full border border-white/10 flex items-center gap-2">
            <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span></span>
            <span className="font-ui text-xs tracking-widest text-white/80 uppercase">Radar Activo</span>
          </div>
        </div>

        <div className="flex flex-grow items-start justify-end pointer-events-none">
          <div className="booking-panel w-[450px] flex flex-col gap-4 pointer-events-auto">
            
            {!selectedStudio ? (
              <div className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center animate-[fade-in_0.5s_ease-out]">
                <Activity className="w-12 h-12 text-accent mb-4 animate-pulse" />
                <h2 className="font-heading font-bold text-2xl text-white mb-2">Selecciona un Estudio</h2>
                <p className="font-ui text-sm text-text/50">Toca un punto en el radar para comenzar tu reserva.</p>
              </div>
            ) : step === 2 ? (
              <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <button onClick={() => setSelectedStudio(null)} className="text-text/50 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
                  <h3 className="font-heading font-bold text-lg text-white">Tipo de Sesión</h3>
                </div>
                <div className="space-y-3 mb-6">
                  {studioServices.map((cat) => (
                    <button 
                      key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${selectedCategory === cat.id ? 'bg-accent/10 border-accent' : 'bg-[#050505]/50 border-white/10'}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-heading font-bold text-white">{cat.name}</span>
                        <span className="font-ui text-xs text-accent font-bold">{cat.is_package ? `${cat.package_price}€` : `+${cat.additional_price}€/h`}</span>
                      </div>
                      <p className="font-ui text-[11px] text-text/50">{cat.description}</p>
                    </button>
                  ))}
                </div>
                <Button onClick={() => setStep(3)} disabled={!selectedCategory}>Siguiente <ArrowRight className="ml-2 w-4 h-4" /></Button>
              </div>
            ) : step === 3 ? (
              <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep(2)} className="text-text/50 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
                  <h3 className="font-heading font-bold text-lg text-white">Identificación</h3>
                </div>
                <div className="space-y-4 mb-6">
                  <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="Nombre Artístico *" className="w-full bg-[#050505]/80 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-accent" />
                  <div className="flex justify-between items-center"><span className="text-xs text-text/50">Invitados (Máx 3)</span><button onClick={() => setCompanions([...companions, ''])} disabled={companions.length >= 3} className="text-accent text-xs font-bold">+ Añadir</button></div>
                  {companions.map((comp, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={comp} onChange={e => { const n = [...companions]; n[i] = e.target.value; setCompanions(n); }} placeholder={`Invitado ${i+1}`} className="w-full bg-[#050505]/80 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-accent" />
                      <button onClick={() => setCompanions(companions.filter((_, idx) => idx !== i))} className="text-red-500 px-2">✕</button>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setStep(4)} disabled={!artistName.trim()}>Elegir Horario <Calendar className="ml-2 w-4 h-4" /></Button>
              </div>
            ) : step === 4 ? (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 animate-[fade-in_0.3s_ease-out]">
                <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" onClick={() => setStep(3)}></div>
                <div className="relative w-full max-w-5xl h-[80vh] bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(138,43,226,0.2)] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setStep(3)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white"><ArrowLeft className="w-5 h-5" /></button>
                      <h3 className="font-heading font-bold text-xl text-white">Reserva tu Sesión</h3>
                    </div>
                    <button onClick={() => setStep(5)} className="bg-white/10 px-5 py-2.5 rounded-full text-white font-ui text-xs">Saltar Pago</button>
                  </div>
                  <div className="flex-grow">
                    <Cal 
                      onAnyEvent={(e) => { if (e.data.type === "bookingSuccessful") { setBookingInfo(e.data.data); setTimeout(() => setStep(5), 1500); } }}
                      calLink={selectedStudio?.cal_link?.includes('cal.com/') ? selectedStudio.cal_link.split('cal.com/')[1] : (selectedStudio?.cal_link || "your-username/default")}
                      style={{width:"100%", height:"100%"}}
                      config={{ name: artistName, theme: "dark", themeColor: "#8A2BE2" }}
                    />
                  </div>
                </div>
              </div>
            ) : step === 5 ? (
              <div className="glass-panel p-6 rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <h3 className="font-heading font-bold text-lg text-white mb-6">Resumen de Reserva</h3>
                <div className="bg-[#050505]/60 rounded-2xl border border-white/5 p-4 mb-6 space-y-4">
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <div><span className="text-accent text-[10px] uppercase">{selectedStudio.name}</span><h4 className="text-white font-bold">{studioServices.find(c => c.id === selectedCategory)?.name}</h4></div>
                    <span className="text-white font-bold text-2xl font-heading">{calculateTotal()}€</span>
                  </div>
                  {bookingInfo && <p className="text-[10px] text-text/40 font-mono">ID Cal.com: {bookingInfo.bookingId}</p>}
                </div>
                <Button onClick={handlePayment} disabled={isPaying}>{isPaying ? 'Procesando...' : 'Confirmar y Pagar'}</Button>
              </div>
            ) : step === 6 ? (
              <div className="glass-panel p-8 rounded-3xl border border-green-500/30 flex flex-col items-center text-center animate-[fade-in_0.5s_ease-out]">
                <ShieldCheck className="w-16 h-16 text-green-500 mb-6" />
                <h2 className="text-white font-bold text-2xl mb-2">¡Reserva Confirmada!</h2>
                <Button onClick={() => navigate('/')} variant="secondary" className="w-full mt-4">Ir al Inicio</Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(138, 43, 226, 0.2); border-radius: 10px; }
      `}</style>
    </div>
  );
}
