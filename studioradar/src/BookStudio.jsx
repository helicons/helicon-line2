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
  const [selectedCategory, setSelectedCategory] = useState(null); // 'rental', 'engineer', 'full'
  const [hoursCount, setHoursCount] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [artistName, setArtistName] = useState('');
  const [companions, setCompanions] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
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
  const DRAG_THRESHOLD = 8; // px before considering it a drag vs tap

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

  // Touch: 1 finger = pan, 2 fingers = pinch zoom
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
        setError('Error al cargar estudios. Usando datos de respaldo.');
        setStudios([
          { 
            id: '1', name: "Neon Room", location: "Vallecas, Madrid", price_per_hour: 20, specs: "15m² • Monitores Yamaha HS8 • Interfaz Apollo Twin",
            image_url: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=600",
            cal_link: "your-username/neon-room"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudios();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      if (!selectedStudio) {
        setStudioServices([]);
        return;
      }
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('studio_services')
          .select('*')
          .eq('studio_id', selectedStudio.id);
        
        if (error) throw error;
        
        // Si no hay servicios en la DB para este estudio, usamos los estándar por defecto
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
        setStudioServices([
          { id: 'rental', name: 'Studio Rental (Booth Only)', description: 'Espacio privado sin asistencia técnica.', additional_price: 0 },
          { id: 'engineer', name: 'Recording with Engineer', description: 'Incluye ingeniero de sonido profesional.', additional_price: 15 },
          { id: 'full', name: 'Full Artist Session', description: 'Grabación, Mezcla y Masterización profesional.', is_package: true, package_price: 350 },
        ]);
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

      if (error) {
        console.error('Error de Supabase Function:', error);
        throw error;
      }

      // Nueva forma: Redirigir directamente a la URL que nos da Stripe
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de pago desde la función.');
      }

    } catch (err) {
      console.error('Error detallado en el pago:', err);
      
      // Si el error es de red o de función no encontrada (típico en desarrollo local sin desplegar)
      // permitimos la simulación para que el usuario pueda ver el flujo visual.
      const isDevError = err.name === 'FunctionsFetchError' || err.message?.includes('Failed to fetch');
      const isPlaceholder = !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.includes('tu_llave');

      if (isDevError || isPlaceholder) {
        console.warn('⚠️ Simulación de pago activada. Para real, despliega la Edge Function y configura las llaves.');
        alert('Simulando redirección a Stripe Checkout...\n(Esto aparece porque la Edge Function aún no está desplegada en Supabase)');
        setTimeout(() => setStep(6), 1500);
      } else {
        alert('Error al conectar con la pasarela: ' + (err.message || 'Error desconocido'));
      }
    } finally {
      setIsPaying(false);
    }
  };

  const handleScanLocation = () => {
    setIsScanning(true);
    setTimeout(() => {
      setUserLocation("Madrid");
      setIsScanning(false);
    }, 1500);
  };

  useEffect(() => {
    handleScanLocation();
  }, []);

  return (
    <div 
      className="min-h-screen relative flex items-stretch lg:items-center justify-center overflow-hidden bg-[#050505]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
    >
      
      {/* PANNABLE + ZOOMABLE RADAR LAYER */}
      <div 
        className="absolute inset-0 z-0 origin-center transition-transform duration-75"
        style={{ transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapScale})` }}
      >
        {/* Background image */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1510006950785-50e50f38fa61?auto=format&fit=crop&q=80&w=2000&sat=-100&bri=-30')", 
            backgroundSize: 'cover', 
            backgroundPosition: 'center'
          }}
        ></div>
        <div className="absolute inset-0 bg-[#050505]/70 mix-blend-multiply"></div>
        
        {/* Sweeping Conic Gradient */}
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] opacity-60 pointer-events-none">
          <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(138,43,226,0)_0%,rgba(138,43,226,0.3)_100%)] animate-[spin_4s_linear_infinite] rounded-full border-r-[3px] border-accent/80"></div>
        </div>

        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-[80vmax] h-[80vmax] rounded-full border border-accent/10 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-[50vmax] h-[50vmax] rounded-full border border-accent/20 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-[20vmax] h-[20vmax] rounded-full border border-accent/30 pointer-events-none"></div>

        {/* Center Pin */}
        <div className="absolute top-1/2 left-1/2 lg:left-[30%] -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_20px_#ffffff]">
          <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-60"></div>
        </div>

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>
     
        {/* STUDIO PINS */}
        {studios.map((studio, idx) => {
          const positions = [
            { top: '30%', left: '25%', labelPos: 'left-8 top-1/2 -translate-y-1/2' },
            { top: '25%', left: '50%', labelPos: 'right-8 top-1/2 -translate-y-1/2 text-right', justify: 'items-end' },
            { top: '65%', left: '20%', labelPos: 'left-8 top-1/2 -translate-y-1/2' },
          ];
          const isSelected = selectedStudio?.id === studio.id;
          const pos = positions[idx];
          
          return (
            <div 
              key={studio.id}
              className={`absolute cursor-pointer flex flex-col ${pos.justify || 'items-start'} justify-center pointer-events-auto`}
              style={{ top: pos.top, left: pos.left }}
              onClick={() => { if (!hasMoved) { setSelectedStudio(studio); setStep(2); } }}
              onTouchEnd={(e) => { if (!hasMoved) { e.stopPropagation(); setSelectedStudio(studio); setStep(2); } }}
            >
              {/* Studio Dot */}
              <div className="relative group">
                 <div className={`absolute top-1/2 -translate-y-1/2 h-[1px] bg-accent/40 w-4 lg:w-6 ${pos.labelPos.includes('left') ? 'left-full' : 'right-full'}`}></div>
                 <div className={`relative w-5 h-5 lg:w-6 lg:h-6 rounded-full transition-all duration-300 z-10 flex items-center justify-center border border-white/20 ${isSelected ? 'bg-accent shadow-[0_0_40px_rgba(138,43,226,1)] scale-150 animate-pulse' : 'bg-[#0A0A0A] group-hover:bg-[#1A1A1A] group-hover:scale-125 group-hover:shadow-[0_0_20px_#8A2BE2]'}`}>
                    <div className={`w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'} z-20`}></div>
                    <div className="absolute inset-0 bg-accent rounded-full animate-ping opacity-30"></div>
                 </div>
              </div>
              
              {/* Mobile label */}
              <div 
                onClick={(e) => { e.stopPropagation(); if (!hasMoved) { setSelectedStudio(studio); setStep(2); } }}
                onTouchEnd={(e) => { if (!hasMoved) { e.stopPropagation(); setSelectedStudio(studio); setStep(2); } }}
                className={`lg:hidden absolute ${pos.labelPos} w-28 bg-[#050505]/90 backdrop-blur-xl rounded-lg border p-2 pointer-events-auto cursor-pointer transition-all duration-300 ${isSelected ? 'border-accent shadow-[0_0_20px_rgba(138,43,226,0.5)] scale-110 z-30' : 'border-white/10 z-20 active:border-white/30'}`}
              >
                <h3 className="font-heading font-bold text-[11px] text-white leading-tight">{studio.name}</h3>
                <span className="font-ui font-bold text-accent text-[11px]">{studio.price_per_hour}€<span className="text-[9px] text-white/50 font-normal">/h</span></span>
              </div>
              {/* Desktop label */}
              <div 
                onClick={(e) => { e.stopPropagation(); if (!hasMoved) { setSelectedStudio(studio); setStep(2); } }}
                className={`hidden lg:block absolute ${pos.labelPos} w-52 bg-[#050505]/90 backdrop-blur-xl rounded-xl border p-3 pointer-events-auto cursor-pointer transition-all duration-300 ${isSelected ? 'border-accent shadow-[0_0_30px_rgba(138,43,226,0.6)] scale-110 z-30' : 'border-white/10 z-20 hover:border-white/30'}`}
              >
                <div className="w-full h-20 mb-3 rounded-lg overflow-hidden border border-white/5 relative">
                  <div className={`absolute inset-0 bg-accent/30 mix-blend-color z-10 transition-opacity duration-300 ${isSelected ? 'opacity-0' : 'opacity-100'}`}></div>
                  <img src={studio.image_url} alt={studio.name} className={`w-full h-full object-cover transition-all duration-500 ${isSelected ? 'grayscale-0 scale-110 opacity-100' : 'grayscale-[80%] opacity-70'}`} />
                </div>
                <h3 className="font-heading font-bold text-base text-white leading-tight mb-1">{studio.name}</h3>
                <div className="flex justify-between items-end">
                  <span className="flex items-center gap-1 font-ui text-[10px] text-text/50 truncate max-w-[60%]">
                     <MapPin className="w-3 h-3 text-accent" /> {studio.location.split(',')[0]}
                  </span>
                  <span className="font-ui font-bold text-accent text-sm glow-purple">{studio.price_per_hour}€<span className="text-[10px] text-white/50 font-normal">/h</span></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom Indicator */}
      <div className="fixed bottom-8 left-8 z-30 flex items-center gap-2 bg-[#050505]/70 backdrop-blur-md rounded-full border border-white/10 px-3 py-1.5 pointer-events-auto">
        <button onClick={() => setMapScale(s => Math.max(0.5, s - 0.2))} className="text-white/50 hover:text-white text-lg font-bold leading-none transition-colors">−</button>
        <span className="font-ui text-[10px] text-white/60 w-10 text-center">{Math.round(mapScale * 100)}%</span>
        <button onClick={() => setMapScale(s => Math.min(3, s + 0.2))} className="text-white/50 hover:text-white text-lg font-bold leading-none transition-colors">+</button>
      </div>

      {/* FOREGROUND INTERFACE */}
      <div className="relative z-20 w-full min-h-screen flex flex-col pt-6 lg:pt-10 pb-8 px-4 lg:px-6 max-w-7xl mx-auto pointer-events-none">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-4 lg:mb-8 pointer-events-auto">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-text/60 hover:text-white transition-colors cursor-pointer font-ui text-xs lg:text-sm bg-[#050505]/50 backdrop-blur-md py-2 px-3 lg:px-4 rounded-full border border-white/10">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Salir del Radar</span>
          </button>
          
          <div className="flex items-center gap-2 lg:gap-3 bg-[#050505]/50 backdrop-blur-md py-2 px-3 lg:px-5 rounded-full border border-white/10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span className="font-ui text-[10px] lg:text-xs tracking-widest text-white/80 uppercase">
              {isScanning ? 'Rastreando...' : 'Radar Activo'}
            </span>
          </div>
        </div>

        {/* Booking Panel — slides up from bottom on mobile */}
        <div className="flex flex-grow items-end lg:items-start justify-center lg:justify-end pointer-events-none">
          <div className="booking-panel w-full lg:w-[450px] flex flex-col gap-3 lg:gap-4 max-h-[75vh] lg:max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto pr-0 lg:pr-2 custom-scrollbar" style={{ touchAction: 'auto' }}>
            
            {!selectedStudio ? (
              <>
                <div className="hidden lg:flex glass-panel p-8 rounded-3xl border border-white/10 flex-col items-center justify-center text-center h-full animate-[fade-in_0.5s_ease-out]">
                  <Activity className="w-12 h-12 text-accent mb-4 animate-pulse" />
                  <h2 className="font-heading font-bold text-2xl text-white mb-2">Esperando Selección</h2>
                  <p className="font-ui text-sm text-text/50">Toca un punto en el radar para cargar los detalles del estudio y configurar la reserva de la sesión.</p>
                </div>
                <div className="lg:hidden glass-panel py-3 px-5 rounded-2xl border border-white/10 text-center animate-[fade-in_0.5s_ease-out]">
                  <p className="font-ui text-xs text-text/50">Toca un estudio en el radar ↑</p>
                </div>
              </>
            ) : step === 2 ? (
              /* PASO 2: SELECCIÓN DE SERVICIO */
              <div className="glass-panel p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                  <button onClick={() => { setSelectedStudio(null); setStep(1); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-text/50">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="font-heading font-bold text-lg text-white">Tipo de Sesión</h3>
                </div>
                <div className="space-y-3 mb-6">
                  {loadingServices ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-text/50 text-xs italic">Sincronizando servicios...</p>
                    </div>
                  ) : studioServices.map((cat) => (
                    <button 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all ${
                        selectedCategory === cat.id ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(138,43,226,0.2)]' : 'bg-[#050505]/50 border-white/10 hover:border-white/30'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-heading font-bold ${selectedCategory === cat.id ? 'text-white' : 'text-text/80'}`}>{cat.name}</span>
                        <span className="font-ui text-xs text-accent font-bold">
                          {cat.is_package ? `${cat.package_price}€` : `+${cat.additional_price}€/h`}
                        </span>
                      </div>
                      <p className="font-ui text-[11px] text-text/50 leading-tight">{cat.description}</p>
                    </button>
                  ))}
                </div>
                <Button onClick={() => setStep(3)} disabled={!selectedCategory} className={!selectedCategory ? 'opacity-50' : ''}>
                  Siguiente <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ) : step === 3 ? (
              /* PASO 3: DATOS DEL ARTISTA (Ahora antes del calendario) */
              <div className="glass-panel p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep(2)} className="text-text/50 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
                  <h3 className="font-heading font-bold text-lg text-white">Identificación</h3>
                </div>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="font-ui text-[10px] text-text/50 uppercase tracking-widest mb-2 block">Nombre Artístico *</label>
                    <input 
                      type="text" value={artistName} 
                      onChange={e => setArtistName(e.target.value)} 
                      placeholder="Ej: Travis Scott"
                      className="w-full bg-[#050505]/80 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="font-ui text-[10px] text-text/50 uppercase tracking-widest block">Acompañantes (Máx 3)</label>
                       {companions.length < 3 && (
                         <button onClick={() => setCompanions([...companions, ''])} className="text-accent text-xs font-bold">+ Añadir</button>
                       )}
                    </div>
                    {companions.map((comp, i) => (
                      <div key={i} className="flex gap-2 mb-2">
                        <input 
                          type="text" value={comp} 
                          onChange={e => {
                            const newC = [...companions];
                            newC[i] = e.target.value;
                            setCompanions(newC);
                          }} 
                          placeholder={`Invitado ${i + 1}`} 
                          className="w-full bg-[#050505]/80 border border-white/10 rounded-xl py-2 px-3 text-white text-xs outline-none focus:border-accent"
                        />
                        <button onClick={() => setCompanions(companions.filter((_, idx) => idx !== i))} className="text-red-500 px-2">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
                <Button onClick={() => setStep(4)} disabled={!artistName.trim()} className={!artistName.trim() ? 'opacity-50' : ''}>
                  Elegir Horario <Calendar className="ml-2 w-4 h-4" />
                </Button>
              </div>
            ) : step === 4 ? (
              /* PASO 4: CALENDARIO FULL SCREEN MODAL */
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-10 animate-[fade-in_0.3s_ease-out]">
                <div 
                  className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl"
                  onClick={() => setStep(3)}
                ></div>
                
                <div className="relative w-full max-w-5xl h-[85vh] lg:h-[80vh] bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(138,43,226,0.2)] overflow-hidden flex flex-col">
                  
                  <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setStep(3)} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="font-heading font-bold text-xl text-white">Reserva tu Sesión</h3>
                        <p className="font-ui text-xs text-text/50">{selectedStudio?.name} • {studioServices.find(s => s.id === selectedCategory)?.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setStep(5)}
                      className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-full text-white font-ui text-xs tracking-widest uppercase transition-all"
                    >
                      Saltar Pago
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="flex-grow bg-[#0A0A0A] relative">
                    <Cal 
                      onAnyEvent={(event) => {
                        console.log("Cal.com Event:", event);
                        if (event.data.type === "bookingSuccessful") {
                          setBookingInfo(event.data.data);
                          // Pequeño delay para que el usuario vea la confirmación de Cal antes de saltar al pago
                          setTimeout(() => setStep(5), 1500);
                        }
                      }}
                      calLink={(() => {
                        const link = selectedStudio?.cal_link || "";
                        if (link.includes('cal.com/')) return link.split('cal.com/')[1];
                        return link || "your-username/default";
                      })()}
                      style={{width:"100%", height:"100%"}}
                      config={{
                        name: artistName || "Artista",
                        email: "test@example.com",
                        theme: "dark",
                        themeColor: "#8A2BE2",
                        metadata: {
                          studioId: selectedStudio?.id,
                          serviceId: selectedCategory,
                          totalPrice: calculateTotal()
                        }
                      }}
                    />
                  </div>

                  <div className="p-4 border-t border-white/5 flex justify-center bg-white/[0.01]">
                    <p className="text-[10px] text-text/40 italic flex items-center gap-2">
                       <Clock className="w-3 h-3" /> Al terminar la selección de hora, pasarás automáticamente al pago.
                    </p>
                  </div>
                </div>
              </div>
            ) : step === 5 ? (
              /* PASO 5: RESUMEN Y PAGO */
              <div className="glass-panel p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-accent/20 flex flex-col animate-[fade-in_0.3s_ease-out]">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep(4)} className="text-text/50 hover:text-white"><ArrowLeft className="w-5 h-5"/></button>
                  <h3 className="font-heading font-bold text-lg text-white">Resumen de Reserva</h3>
                </div>
                <div className="bg-[#050505]/60 rounded-2xl border border-white/5 p-4 mb-6">
                  <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                    <div>
                      <span className="font-ui text-[10px] text-accent uppercase tracking-widest">{selectedStudio.name}</span>
                      <h4 className="font-heading font-bold text-lg text-white">{studioServices.find(c => c.id === selectedCategory)?.name || 'Servicio'}</h4>
                    </div>
                    <div className="text-right">
                       <span className="block font-ui text-xs text-white">{selectedTime}</span>
                       <span className="font-ui text-[10px] text-text/50 uppercase">{hoursCount} {hoursCount === 1 ? 'Hora' : 'Horas'}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                     <div className="flex justify-between text-xs">
                        <span className="text-text/50">Artista</span>
                        <span className="text-white">{artistName}</span>
                     </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-text/50">Invitados</span>
                        <span className="text-white">{companions.length}</span>
                     </div>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <span className="font-heading font-bold text-lg text-white">Total</span>
                    <span className="font-heading font-bold text-3xl text-accent glow-purple">{calculateTotal()}€</span>
                  </div>
                  {bookingInfo && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-text/40 uppercase tracking-widest mb-1">Cita Agendada en Cal.com</p>
                      <p className="text-xs text-white/60 font-mono">ID: {bookingInfo.bookingId || 'Pendiente'}</p>
                    </div>
                  )}
                </div>
                <Button 
                  onClick={handlePayment} 
                  disabled={isPaying}
                  className="shadow-[0_0_30_rgba(138,43,226,0.4)] relative overflow-hidden"
                >
                  {isPaying ? (
                    <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       Procesando...
                    </div>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" /> Confirmar y Pagar
                    </>
                  )}
                </Button>
              </div>
            ) : step === 6 ? (
              /* PASO 6: ÉXITO / CONFIRMACIÓN */
              <div className="glass-panel p-8 rounded-3xl border border-green-500/30 flex flex-col items-center text-center animate-[fade-in_0.5s_ease-out]">
                <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <ShieldCheck className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="font-heading font-bold text-2xl text-white mb-2">¡Reserva Confirmada!</h2>
                <p className="font-ui text-sm text-text/60 mb-8">Hemos enviado los detalles de tu sesión a tu correo y al panel de control del estudio.</p>
                <div className="w-full space-y-3">
                  <Button onClick={() => navigate('/')} variant="secondary" className="w-full">
                    Volver al Inicio
                  </Button>
                  <button 
                    onClick={() => { setSelectedStudio(null); setStep(1); }}
                    className="font-ui text-xs text-text/40 hover:text-accent transition-colors py-2"
                  >
                    Nueva Reserva
                  </button>
                </div>
              </div>
            ) : null}
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
