import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, ArrowRight, Activity, CreditCard, ShieldCheck, Search, Navigation, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from './lib/supabase';
import SlotPicker from './components/SlotPicker';
const StudioMap = lazy(() => import('./components/StudioMap'));
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
  const [studioSpaceId, setStudioSpaceId] = useState(null);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [isPaying, setIsPaying] = useState(false);
  const [clientEmail, setClientEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  const [visibleStudios, setVisibleStudios] = useState([]);
  const [hoveredStudio, setHoveredStudio] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        const { data, error } = await supabase
          .from('studios')
          .select('id, name, city, address, photos, image_url, price_per_hour, lat, lng, location, description')
          .eq('is_published', true)
          .not('lat', 'is', null)
          .not('lng', 'is', null);
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
    const fetchSpaces = async () => {
      if (!selectedStudio) return;
      setLoadingServices(true);
      try {
        const { data, error } = await supabase
          .from('spaces')
          .select('id, name, description, price_per_hour, min_duration_hours, max_duration_hours')
          .eq('studio_id', selectedStudio.id)
          .eq('active', true)
          .order('created_at');

        if (error) throw error;
        setStudioServices(data && data.length > 0 ? data : []);
      } catch (err) {
        console.error('Error fetching spaces:', err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchSpaces();
  }, [selectedStudio]);


  const calculateTotal = () => {
    if (!selectedCategory) return 0;
    const space = studioServices.find(c => c.id === selectedCategory);
    if (!space) return 0;
    return (parseFloat(space.price_per_hour) || 0) * selectedDuration;
  };

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          studioId: selectedStudio.id,
          studioName: selectedStudio.name,
          bookingId: pendingBookingId,
          artistName: artistName,
          totalPrice: calculateTotal()
        },
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
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


  return (
    <div
      className="min-h-screen bg-[#050505] flex flex-col md:flex-row overflow-hidden relative"
    >
      {/* MAP AREA — Mapbox */}
      <div className="flex-1 relative h-[50vh] md:h-screen overflow-hidden">
        <Suspense fallback={<div className="w-full h-full bg-[#050505] flex items-center justify-center"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>}>
          <StudioMap
            studios={studios}
            selectedStudio={selectedStudio}
            hoveredStudio={hoveredStudio}
            onStudioSelect={(s) => { setSelectedStudio(s); setStep(2); setSelectedTime(null); }}
            onVisibleChange={setVisibleStudios}
          />
        </Suspense>

        {/* Botón volver */}
        <div className="absolute top-4 left-4 z-20">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-[#050505]/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full font-mono text-xs hover:bg-white/5 transition-colors shadow-lg">
            <ArrowLeft className="w-4 h-4 text-accent" /> Volver al Inicio
          </button>
        </div>

        {/* Badge Scanning */}
        <div className="absolute bottom-10 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full font-mono text-[10px] text-accent uppercase tracking-widest flex items-center gap-2 z-10">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          Radar: Madrid
        </div>
      </div>

      {/* SIDEBAR INTERFACE */}
      <div className="w-full md:w-[450px] bg-surface h-[50vh] md:h-screen flex flex-col border-l border-white/5 shadow-2xl relative z-20 overflow-y-auto">

        <div className="p-6 md:p-8 flex flex-col min-h-full">
          {!selectedStudio ? (
            <div className="flex-1 flex flex-col animate-[fade-in_0.5s_ease-out]">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full border border-accent/30 flex items-center justify-center bg-accent/5">
                  <Activity className="w-4 h-4 text-accent animate-pulse" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-white leading-tight">Estudios cerca</h2>
                  <p className="font-mono text-[10px] text-text/40 uppercase tracking-widest">Selecciona para reservar</p>
                </div>
              </div>

              {visibleStudios.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                  <p className="font-mono text-sm text-text/40">Mueve el mapa para explorar estudios disponibles.</p>
                  <div className="mt-6 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {visibleStudios.map(studio => (
                    <button
                      key={studio.id}
                      onClick={() => { setSelectedStudio(studio); setStep(2); setSelectedTime(null); }}
                      onMouseEnter={() => setHoveredStudio(studio)}
                      onMouseLeave={() => setHoveredStudio(null)}
                      className="w-full flex items-center gap-3 bg-white/3 border border-white/5 hover:border-accent/40 hover:bg-accent/5 rounded-xl p-3 text-left transition-all"
                    >
                      {(studio.photos?.[0] || studio.image_url) && (
                        <img
                          src={studio.photos?.[0] ?? studio.image_url}
                          alt={studio.name}
                          className="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm font-bold text-white truncate">{studio.name}</p>
                        {studio.city && <p className="font-mono text-[10px] text-text/40 truncate">{studio.city}</p>}
                      </div>
                      {studio.price_per_hour && (
                        <span className="font-mono text-xs text-accent shrink-0">{studio.price_per_hour}€/h</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 flex-1 animate-[fade-in_0.3s_ease-out]">

              {/* Studio Header Image Section */}
              <div className="rounded-2xl overflow-hidden h-48 relative border border-white/5 shadow-xl">
                <img
                  src={selectedStudio.photos?.[0] ?? selectedStudio.image_url ?? 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=500'}
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
                    Selecciona el Espacio
                  </div>
                  {studioServices.length === 0 ? (
                    <p className="font-mono text-sm text-text/40 text-center py-8">Este estudio aún no tiene espacios configurados.</p>
                  ) : (
                    <div className="space-y-3 mb-8">
                      {studioServices.map((space) => (
                        <button
                          key={space.id}
                          onClick={() => { setSelectedCategory(space.id); setStudioSpaceId(space.id); setSelectedSpace(space); }}
                          className={`w-full p-4 rounded-xl border text-left transition-all ${selectedCategory === space.id ? 'bg-accent/10 border-accent shadow-[0_0_15px_rgba(138,43,226,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-heading font-bold text-white">{space.name}</span>
                            <span className="font-mono text-xs text-accent font-bold">{space.price_per_hour}€/h</span>
                          </div>
                          {space.description && <p className="font-ui text-[11px] text-text/50">{space.description}</p>}
                          {(space.min_duration_hours || space.max_duration_hours) && (
                            <p className="font-mono text-[10px] text-text/30 mt-1">
                              {space.min_duration_hours ? `Mín. ${space.min_duration_hours}h` : ''}
                              {space.min_duration_hours && space.max_duration_hours ? ' · ' : ''}
                              {space.max_duration_hours ? `Máx. ${space.max_duration_hours}h` : ''}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
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
                      <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">Email de Contacto *</label>
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="tu@email.com"
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
                      disabled={!artistName.trim() || !clientEmail.includes('@')}
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
                  <div className="relative w-full max-w-lg h-[90vh] bg-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col">
                    <div className="flex items-center gap-4 p-6 border-b border-white/5">
                      <button onClick={() => setStep(3)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-accent transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="font-heading font-bold text-xl text-white">Elige tu Horario</h3>
                    </div>
                    <div className="flex-grow overflow-y-auto p-6">
                      <SlotPicker
                        spaceId={studioSpaceId}
                        clientName={artistName}
                        clientEmail={clientEmail}
                        pricePerHour={parseFloat(selectedSpace?.price_per_hour) || 0}
                        minDuration={selectedSpace?.min_duration_hours || 1}
                        maxDuration={selectedSpace?.max_duration_hours || 4}
                        onSlotSelected={({ date, slot, bookingId, durationHours }) => {
                          setSelectedDate(date);
                          setSelectedSlot(slot);
                          setSelectedDuration(durationHours);
                          setPendingBookingId(bookingId);
                          setStep(5);
                        }}
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
                    {selectedDate && selectedSlot && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-[10px] text-text/40 font-mono uppercase tracking-widest mb-1">Fecha y Hora</p>
                        <p className="text-sm text-white font-mono">{selectedDate} · {selectedSlot} → {selectedSlot && (() => { const h = parseInt(selectedSlot) + selectedDuration; return `${String(h).padStart(2,'0')}:00` })()}</p>
                        <p className="text-[10px] text-text/40 font-mono mt-0.5">{selectedDuration}h · {parseFloat(selectedSpace?.price_per_hour) || 0}€/h</p>
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
