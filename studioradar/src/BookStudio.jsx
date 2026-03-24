import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, ArrowRight, Activity, CreditCard, ShieldCheck } from 'lucide-react';
import { supabase } from './lib/supabase';
import SlotPicker from './components/SlotPicker';
const StudioMap = lazy(() => import('./components/StudioMap'));
import { loadStripe } from '@stripe/stripe-js';

loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

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


  const studioHours = {
    "Neon Room": "18:00 - 06:00",
    "The Vault": "10:00 - 22:00",
    "808 Suite": "24 / 7"
  };

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
                  <div className="flex flex-col">
                    <h3 className="font-heading font-bold text-lg text-white">Tipo de Sesión</h3>
                    <span className="font-ui text-[10px] text-text/40">Disponible: {studioHours[selectedStudio.name] || "Consultar"}</span>
                  </div>
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
              </div>
            ) : step === 5 ? (
              <div className="glass-panel rounded-3xl border border-accent/20 overflow-hidden animate-[fade-in_0.3s_ease-out]">
                {/* Header */}
                <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-center gap-3">
                  <button onClick={() => setStep(4)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-heading font-bold text-white leading-tight">Confirmar Reserva</h3>
                    <p className="font-ui text-[9px] text-text/30 uppercase tracking-[0.2em]">Revisión de pago</p>
                  </div>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                    <ShieldCheck className="w-3 h-3 text-green-400" />
                    <span className="font-ui text-[8px] text-green-400 uppercase tracking-widest">Seguro</span>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {/* Studio + service card */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-[#0a0a0a]/80">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
                    <div className="relative p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                            <Activity className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <p className="font-heading font-bold text-white text-sm leading-tight">{selectedStudio.name}</p>
                            <p className="font-ui text-[10px] text-accent/60 mt-0.5">{studioServices.find(c => c.id === selectedCategory)?.name}</p>
                          </div>
                        </div>
                        <span className="font-ui text-[8px] px-2 py-0.5 rounded-full border border-white/10 text-white/30 uppercase tracking-wider whitespace-nowrap">
                          {studioHours[selectedStudio.name] || "Consultar"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/8 border border-accent/15">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <span className="font-ui text-[9px] text-accent/80 font-bold">{artistName}</span>
                        </div>
                        {companions.filter(c => c.trim()).map((c, i) => (
                          <span key={i} className="font-ui text-[9px] px-2.5 py-1 rounded-full bg-white/5 border border-white/8 text-white/40">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="bg-[#050505]/60 rounded-2xl border border-white/5 p-4">
                    {(() => {
                      const category = studioServices.find(c => c.id === selectedCategory);
                      const base = category?.is_package
                        ? (category.package_price || 0)
                        : ((selectedStudio.price_per_hour || 0) + (category?.additional_price || 0)) * hoursCount;
                      const fee = Math.round(base * 0.15 * 100) / 100;
                      return (
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center">
                            <span className="font-ui text-xs text-white/35">
                              {category?.is_package ? 'Paquete' : `${hoursCount}h × ${selectedStudio.price_per_hour || 0}€/h`}
                            </span>
                            <span className="font-ui text-xs text-white/55">{base}€</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-ui text-xs text-white/35 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-accent/30" /> Tarifa Helicon (15%)
                            </span>
                            <span className="font-ui text-xs text-white/35">{fee}€</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-white/8 pt-2.5">
                            <span className="font-heading font-bold text-white text-sm">Total</span>
                            <span className="font-heading font-bold text-3xl leading-none"
                              style={{ background: 'linear-gradient(135deg,#fff 40%,rgba(138,43,226,0.9))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                              {calculateTotal()}€
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Cal.com booking ID */}
                  {bookingInfo && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/5 border border-green-500/15 rounded-xl">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      <span className="font-ui text-[9px] text-green-400/60 font-mono truncate">Cal ID: {bookingInfo.bookingId}</span>
                    </div>
                  )}

                  {/* Pay CTA */}
                  <button
                    onClick={handlePayment}
                    disabled={isPaying}
                    className="w-full relative overflow-hidden group py-4 rounded-2xl font-ui font-bold text-sm uppercase tracking-widest transition-all duration-300 disabled:opacity-60"
                    style={{
                      background: 'linear-gradient(135deg, #8A2BE2 0%, #6A1BE2 100%)',
                      boxShadow: '0 0 32px rgba(138,43,226,0.4), inset 0 1px 0 rgba(255,255,255,0.12)',
                    }}
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/8 transition-all duration-300 rounded-2xl" />
                    <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                      {isPaying ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Confirmar y Pagar
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Footer trust */}
                  <div className="flex items-center justify-center gap-2.5 pb-1">
                    <span className="font-ui text-[8px] text-white/15 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> SSL
                    </span>
                    <span className="text-white/10">·</span>
                    <span className="font-ui text-[8px] text-white/15">Powered by Stripe</span>
                    <span className="text-white/10">·</span>
                    <span className="font-ui text-[8px] text-white/15">Helicon © 2025</span>
                  </div>
                </div>
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
