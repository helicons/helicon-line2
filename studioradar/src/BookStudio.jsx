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
      className="min-h-screen bg-[#050505] flex flex-col md:flex-row overflow-hidden relative"
    >
      {/* MAP AREA / RADAR AREA */}
      <div
        className="flex-1 relative h-[50vh] md:h-screen overflow-hidden bg-[#050505]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      >
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
              { top: '30%', left: '40%' },
              { top: '25%', left: '70%' },
              { top: '65%', left: '30%' },
            ];
            const isSelected = selectedStudio?.id === studio.id;
            const pos = positions[idx % positions.length];
            return (
              <button
                key={studio.id}
                onClick={() => { if (!hasMoved) { setSelectedStudio(studio); setStep(2); setSelectedTime(null); } }}
                className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'}`}
                style={{ top: pos.top, left: pos.left }}
              >
                <div className="relative flex items-center justify-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-[0_0_20px_rgba(0,0,0,0.5)] hardware-shadow ${isSelected ? 'bg-accent border-white' : 'bg-[#0A0A0A] border-accent'}`}>
                    <MapPin className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-accent'}`} />
                  </div>
                  {isSelected && (
                    <div className="absolute -inset-2 bg-accent/30 rounded-full animate-ping -z-10"></div>
                  )}

                  <div className={`absolute top-12 whitespace-nowrap bg-[#050505]/90 backdrop-blur px-3 py-1 rounded-md border font-mono text-xs shadow-xl pointer-events-none transition-all ${isSelected ? 'border-accent text-white scale-110' : 'border-white/10 text-white/70'}`}>
                    {studio.name} <span className="text-accent ml-1">{studio.price_per_hour}€/h</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Radar Overlay Info */}
        <div className="absolute top-8 left-8 hidden md:block z-20">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-[#050505]/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full font-ui text-sm hover:bg-white/5 transition-colors shadow-lg">
            <ArrowLeft className="w-4 h-4 text-accent" /> Volver al Inicio
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-8 md:translate-x-0 md:left-8 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full font-mono text-[10px] text-accent uppercase tracking-widest flex items-center gap-2 z-10">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          Scanning Area: {userLocation || 'Madrid'}
        </div>
      </div>

      {/* SIDEBAR INTERFACE */}
      <div className="w-full md:w-[450px] bg-surface h-[50vh] md:h-screen flex flex-col border-l border-white/5 shadow-2xl relative z-20 overflow-y-auto">

        <div className="p-6 md:p-8 flex flex-col min-h-full">
          {!selectedStudio ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-[fade-in_0.5s_ease-out]">
              <div className="w-20 h-20 rounded-full border border-accent/20 flex items-center justify-center mb-6 bg-accent/5">
                <Activity className="w-10 h-10 text-accent animate-pulse" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white mb-2">Reserva de Estudio</h2>
              <p className="font-mono text-sm text-text/50 max-w-[250px]">Toca un punto en el radar para comenzar tu sesión.</p>
              <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 flex-1 animate-[fade-in_0.3s_ease-out]">

              {/* Studio Header Image Section */}
              <div className="rounded-2xl overflow-hidden h-48 relative border border-white/5 shadow-xl">
                <img
                  src={selectedStudio.image_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=500'}
                  alt={selectedStudio.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent"></div>
                <button
                  onClick={() => setSelectedStudio(null)}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-accent transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <h3 className="font-heading text-2xl font-bold text-white">{selectedStudio.name}</h3>
                  <div className="font-mono text-[10px] text-accent flex items-center gap-1 uppercase tracking-widest mt-1">
                    <MapPin className="w-3 h-3" /> {selectedStudio.location || 'Madrid'}
                  </div>
                </div>
              </div>

              {step === 2 && (
                <div className="flex flex-col flex-1">
                  <div className="font-mono text-[10px] text-text/50 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">
                    Selecciona el Tipo de Sesión
                  </div>
                  <div className="space-y-3 mb-8">
                    {studioServices.map((cat) => (
                      <button
                        key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${selectedCategory === cat.id ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(138,43,226,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-heading font-bold text-white">{cat.name}</span>
                          <span className="font-mono text-xs text-accent font-bold">{cat.is_package ? `${cat.package_price}€` : `+${cat.additional_price}€/h`}</span>
                        </div>
                        <p className="font-ui text-[11px] text-text/50">{cat.description}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={() => setStep(3)}
                      disabled={!selectedCategory}
                      className="w-full py-4 rounded-xl bg-accent text-white font-mono font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50"
                    >
                      Continuar <ArrowRight className="inline ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col flex-1">
                  <button onClick={() => setStep(2)} className="flex items-center gap-2 text-text/50 hover:text-white font-mono text-xs mb-6 transition-colors">
                    <ArrowLeft className="w-3 h-3" /> Volver a sesiones
                  </button>
                  <h3 className="font-heading text-xl font-bold text-white mb-6">Datos de la Sesión</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">Nombre Artístico *</label>
                      <input
                        type="text"
                        value={artistName}
                        onChange={e => setArtistName(e.target.value)}
                        placeholder="EJ. KAEL"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-accent transition-colors font-mono"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest">Invitados (Máx 3)</label>
                        <button onClick={() => setCompanions([...companions, ''])} disabled={companions.length >= 3} className="text-accent text-[10px] font-bold uppercase tracking-wider">+ Añadir</button>
                      </div>
                      <div className="space-y-3">
                        {companions.map((comp, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              type="text"
                              value={comp}
                              onChange={e => { const n = [...companions]; n[i] = e.target.value; setCompanions(n); }}
                              placeholder={`Invitado ${i + 1}`}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-accent font-mono"
                            />
                            <button onClick={() => setCompanions(companions.filter((_, idx) => idx !== i))} className="text-red-500/50 hover:text-red-500 px-2 transition-colors">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-8">
                    <button
                      onClick={() => setStep(4)}
                      disabled={!artistName.trim()}
                      className="w-full py-4 rounded-xl bg-accent text-white font-mono font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50 shadow-lg"
                    >
                      Elegir Horario <Calendar className="inline ml-2 w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-[fade-in_0.3s_ease-out]">
                  <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" onClick={() => setStep(3)}></div>
                  <div className="relative w-full max-w-5xl h-[90vh] bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setStep(3)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-accent"><ArrowLeft className="w-5 h-5" /></button>
                        <h3 className="font-heading font-bold text-xl text-white">Reserva tu Sesión</h3>
                      </div>
                      <button onClick={() => setStep(5)} className="bg-white/10 px-5 py-2.5 rounded-full text-white font-ui text-xs hover:bg-white/20">Saltar al Resumen</button>
                    </div>
                    <div className="flex-grow">
                      <Cal
                        onAnyEvent={(e) => { if (e.data.type === "bookingSuccessful") { setBookingInfo(e.data.data); setTimeout(() => setStep(5), 1500); } }}
                        calLink={selectedStudio?.cal_link?.includes('cal.com/') ? selectedStudio.cal_link.split('cal.com/')[1] : (selectedStudio?.cal_link || "your-username/default")}
                        style={{ width: "100%", height: "100%" }}
                        config={{ name: artistName, theme: "dark", themeColor: "#8A2BE2" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="flex flex-col flex-1">
                  <h3 className="font-heading text-xl font-bold text-white mb-6">Resumen de Reserva</h3>
                  <div className="bg-white/5 rounded-2xl border border-white/5 p-6 mb-8 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <div>
                        <span className="text-accent text-[10px] font-mono uppercase tracking-widest block mb-1">{selectedStudio.name}</span>
                        <h4 className="text-white font-bold text-lg">{studioServices.find(c => c.id === selectedCategory)?.name}</h4>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-text/50 font-mono text-xs uppercase tracking-widest">Inversión Total</span>
                      <span className="text-white font-bold text-3xl font-heading">{calculateTotal()}€</span>
                    </div>
                    {bookingInfo && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] text-text/40 font-mono uppercase tracking-widest mb-1">Referencia Cal.com</p>
                        <p className="text-xs text-accent font-mono">{bookingInfo.bookingId}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={handlePayment}
                      disabled={isPaying}
                      className="w-full py-5 rounded-xl bg-accent text-white font-mono font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(138,43,226,0.2)]"
                    >
                      {isPaying ? 'Iniciando Pasarela...' : `Pagar ${calculateTotal()}€`}
                    </button>
                    <p className="text-center text-[10px] text-text/40 mt-4 uppercase tracking-[0.2em]">Pago seguro vía Stripe</p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-green-500/10 rounded-full border border-green-500/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                    <ShieldCheck className="w-12 h-12 text-green-500" />
                  </div>
                  <h2 className="text-white font-heading font-bold text-3xl mb-4">¡Sesión Bloqueada!</h2>
                  <p className="font-mono text-sm text-text/60 mb-10 max-w-[280px]">Hemos recibido tu reserva. Recibirás un correo con los detalles en unos minutos.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-4 rounded-xl border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-widest hover:border-accent transition-colors"
                  >
                    Volver al Inicio
                  </button>
                </div>
              )}
            </div>
          )}
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
