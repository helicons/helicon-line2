import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowLeft, ArrowRight, Activity, CreditCard, ShieldCheck, Search, Navigation, ChevronLeft, ChevronRight, ExternalLink, Star, LayoutGrid, Map as MapIcon, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
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
  const [clientPhone, setClientPhone] = useState('');
  const [sessionUser, setSessionUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);

  const [viewMode, setViewMode] = useState('map');
  const [filterCity, setFilterCity] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState(0);
  const [filterEquipment, setFilterEquipment] = useState([]);
  const [visibleStudios, setVisibleStudios] = useState([]);
  const [hoveredStudio, setHoveredStudio] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Pre-rellenar email si el usuario está logueado
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setSessionUser(session.user)
      setClientEmail(session.user.email ?? '')
    })
  }, []);

  useEffect(() => {
    const fetchStudios = async () => {
      try {
        const { data, error } = await supabase
          .from('studios')
          .select('id, name, city, address, photos, image_url, price_per_hour, lat, lng, location, description, equipment_tags')
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

  const loadReviews = async (studioId) => {
    const { data: reviewData } = await supabase
      .from('studio_reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('studio_id', studioId)
      .order('created_at', { ascending: false });

    let enriched = reviewData || [];
    if (enriched.length > 0) {
      const userIds = [...new Set(enriched.map(r => r.user_id))];
      const { data: userData } = await supabase
        .from('users')
        .select('user_id, name, artist_name')
        .in('user_id', userIds);
      const userMap = Object.fromEntries((userData || []).map(u => [u.user_id, u]));
      enriched = enriched.map(r => ({ ...r, user: userMap[r.user_id] }));
    }
    setReviews(enriched);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setCanReview(false); setUserReview(null); return; }

    const existing = enriched.find(r => r.user_id === session.user.id);
    setUserReview(existing || null);

    const { data: spaceData } = await supabase
      .from('spaces').select('id').eq('studio_id', studioId);
    const spaceIds = (spaceData || []).map(s => s.id);
    if (spaceIds.length === 0) { setCanReview(false); return; }

    const { data: bookingData } = await supabase
      .from('bookings')
      .select('id')
      .eq('client_email', session.user.email)
      .eq('status', 'confirmed')
      .lt('end_datetime', new Date().toISOString())
      .in('space_id', spaceIds)
      .limit(1);
    setCanReview((bookingData?.length ?? 0) > 0);
  };

  useEffect(() => {
    if (!selectedStudio) return;
    loadReviews(selectedStudio.id);
  }, [selectedStudio]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitReview = async () => {
    setReviewLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('studio_reviews').insert({
      studio_id: selectedStudio.id,
      user_id: session.user.id,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim() || null,
    });
    if (!error) {
      setReviewForm({ rating: 5, comment: '' });
      await loadReviews(selectedStudio.id);
    }
    setReviewLoading(false);
  };

  const deleteReview = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('studio_reviews').delete()
      .eq('id', userReview.id).eq('user_id', session.user.id);
    await loadReviews(selectedStudio.id);
  };

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
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          studioId: selectedStudio.id,
          studioName: selectedStudio.name,
          bookingId: pendingBookingId,
          artistName: artistName,
          totalPrice: calculateTotal(),
          customerEmail: clientEmail
        },
        headers: {
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
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


  const allCities = [...new Set(studios.map(s => s.city || s.location).filter(Boolean))];
  const allEquipmentTags = [...new Set(studios.flatMap(s => s.equipment_tags || []))];
  const filteredStudios = studios.filter(s => {
    if (filterCity && (s.city || s.location) !== filterCity) return false;
    if (filterMaxPrice > 0 && parseFloat(s.price_per_hour || 0) > filterMaxPrice) return false;
    if (filterEquipment.length > 0 && !filterEquipment.every(tag => s.equipment_tags?.includes(tag))) return false;
    return true;
  });

  const ViewToggle = ({ current, iconsOnly = false }) => (
    <div className="flex items-center bg-[#0f0f0f]/90 backdrop-blur-md border border-white/10 rounded-full p-1 gap-0.5">
      <button
        onClick={() => setViewMode('grid')}
        title="Vista lista"
        className={`flex items-center gap-1.5 rounded-full font-mono text-xs transition-all ${iconsOnly ? 'p-2' : 'px-3 py-1.5'} ${current === 'grid' ? 'bg-accent text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        {!iconsOnly && <span>Lista</span>}
      </button>
      <button
        onClick={() => setViewMode('map')}
        title="Vista mapa"
        className={`flex items-center gap-1.5 rounded-full font-mono text-xs transition-all ${iconsOnly ? 'p-2' : 'px-3 py-1.5'} ${current === 'map' ? 'bg-accent text-white shadow-sm' : 'text-white/40 hover:text-white'}`}
      >
        <MapIcon className="w-3.5 h-3.5" />
        {!iconsOnly && <span>Mapa</span>}
      </button>
    </div>
  );

  return (
    <>
      {viewMode === 'grid' ? (
        /* ── GRID VIEW ─────────────────────────────────────────── */
        <div className="min-h-screen bg-[#050505] flex flex-col">

          {/* Header sticky */}
          <div className="sticky top-0 z-20 bg-[#050505]/96 backdrop-blur-md border-b border-white/5">
            <div className="max-w-5xl mx-auto px-6 pt-4 pb-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/40 hover:text-white font-mono text-xs transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Volver
                </button>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-baseline gap-2">
                  <span className="font-heading font-bold text-white text-lg">Estudios</span>
                  {!loading && <span className="font-mono text-xs text-white/25">{filteredStudios.length} {filteredStudios.length === 1 ? 'resultado' : 'resultados'}</span>}
                </div>
              </div>
              <ViewToggle current="grid" />
            </div>

            {/* Filter bar — desktop inline / mobile collapsed */}
            <div className="max-w-5xl mx-auto px-6 pb-3">

              {/* ── Botón filtros (solo móvil) ── */}
              <div className="flex items-center gap-2 md:hidden mb-2">
                <button
                  onClick={() => setFiltersOpen(o => !o)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-xs transition-all ${filtersOpen ? 'bg-accent text-white border-accent' : 'border-white/15 text-white/50 hover:border-accent/40 hover:text-white'}`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filtros
                  {(filterCity || filterMaxPrice > 0 || filterEquipment.length > 0) && (
                    <span className="w-4 h-4 rounded-full bg-accent text-white text-[9px] flex items-center justify-center font-bold">
                      {[filterCity, filterMaxPrice > 0, ...filterEquipment].filter(Boolean).length}
                    </span>
                  )}
                  <ChevronDown className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                </button>
                {(filterCity || filterMaxPrice > 0 || filterEquipment.length > 0) && (
                  <button
                    onClick={() => { setFilterCity(''); setFilterMaxPrice(0); setFilterEquipment([]); }}
                    className="flex items-center gap-1 px-3 py-2 rounded-full border border-red-500/20 text-red-400/50 hover:text-red-400 font-mono text-xs transition-all"
                  >
                    <X className="w-3 h-3" /> Limpiar
                  </button>
                )}
              </div>

              {/* ── Panel filtros: siempre visible en desktop, colapsable en móvil ── */}
              <div className={`flex-col gap-2.5 ${filtersOpen ? 'flex' : 'hidden'} md:flex`}>

                {/* Row 1: ciudad + precio */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-white/25 uppercase tracking-widest shrink-0 hidden md:block">Ciudad</span>
                  <button
                    onClick={() => setFilterCity('')}
                    className={`px-3 py-1.5 rounded-full font-mono text-[11px] border transition-all ${!filterCity ? 'bg-accent text-white border-accent shadow-[0_0_10px_rgba(138,43,226,0.3)]' : 'border-white/10 text-white/40 hover:border-accent/40 hover:text-white/70'}`}
                  >
                    Todas
                  </button>
                  {allCities.map(city => (
                    <button
                      key={city}
                      onClick={() => setFilterCity(city === filterCity ? '' : city)}
                      className={`px-3 py-1.5 rounded-full font-mono text-[11px] border transition-all ${filterCity === city ? 'bg-accent text-white border-accent shadow-[0_0_10px_rgba(138,43,226,0.3)]' : 'border-white/10 text-white/40 hover:border-accent/40 hover:text-white/70'}`}
                    >
                      {city}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[10px] text-white/25 uppercase tracking-widest hidden md:block">Precio máx.</span>
                    <select
                      value={filterMaxPrice}
                      onChange={e => setFilterMaxPrice(Number(e.target.value))}
                      className="bg-[#111] border border-white/10 rounded-full px-4 py-1.5 font-mono text-xs text-white/60 focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
                    >
                      <option value={0}>Precio: Todos</option>
                      <option value={30}>≤ 30 €/h</option>
                      <option value={50}>≤ 50 €/h</option>
                      <option value={80}>≤ 80 €/h</option>
                      <option value={120}>≤ 120 €/h</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: equipment chips */}
                {allEquipmentTags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] text-white/25 uppercase tracking-widest shrink-0 hidden md:block">Equipo</span>
                    {allEquipmentTags.slice(0, 14).map(tag => (
                      <button
                        key={tag}
                        onClick={() => setFilterEquipment(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
                        className={`px-3 py-1.5 rounded-full font-mono text-[11px] border transition-all ${filterEquipment.includes(tag) ? 'bg-accent/15 text-accent border-accent/40' : 'border-white/8 text-white/30 hover:border-white/20 hover:text-white/60'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card list */}
          <div className="flex-1 py-8 max-w-5xl mx-auto w-full px-6">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredStudios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <p className="font-heading text-white/20 text-2xl">Sin resultados</p>
                <p className="font-mono text-xs text-white/20">Prueba otros filtros</p>
                <button
                  onClick={() => { setFilterCity(''); setFilterMaxPrice(0); setFilterEquipment([]); }}
                  className="mt-2 px-5 py-2 rounded-full border border-white/10 font-mono text-xs text-white/40 hover:text-white hover:border-accent/40 transition-all"
                >
                  Resetear filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {filteredStudios.map(studio => (
                  <button
                    key={studio.id}
                    onClick={() => { setSelectedStudio(studio); setStep(2); }}
                    className="group w-full text-left flex flex-col lg:flex-row bg-[#0c0c0c] border border-transparent hover:border-[#8A2BE2] rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_4px_40px_rgba(138,43,226,0.25)] hover:bg-[#0f0f0f]"
                  >
                    {/* Foto — arriba en móvil/tablet, izquierda en desktop */}
                    <div className="relative w-full h-48 lg:w-56 lg:h-auto shrink-0 overflow-hidden">
                      <img
                        src={studio.photos?.[0] ?? studio.image_url ?? 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=400'}
                        alt={studio.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0c0c0c]/60 via-transparent to-transparent pointer-events-none" />
                      {/* Precio encima de la foto en móvil */}
                      {studio.price_per_hour && (
                        <div className="absolute top-3 right-3 lg:hidden bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                          <span className="font-heading font-bold text-white text-sm">{studio.price_per_hour}€</span>
                          <span className="font-mono text-[9px] text-white/40">/h</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 lg:px-6 lg:py-5 flex flex-col justify-between min-w-0 lg:border-r border-white/5">
                      <div>
                        <h3 className="font-heading font-bold text-white text-lg lg:text-xl leading-tight mb-1 group-hover:text-accent/90 transition-colors">{studio.name}</h3>
                        <div className="flex items-center gap-1.5 mb-2">
                          <MapPin className="w-3 h-3 text-accent/70 shrink-0" />
                          <span className="font-mono text-xs text-white/40">{studio.address || studio.city || studio.location || 'Madrid'}</span>
                        </div>
                        {studio.description && (
                          <p className="font-mono text-[11px] text-white/30 line-clamp-2 leading-relaxed">{studio.description}</p>
                        )}
                      </div>
                      {/* Tags + CTA en móvil */}
                      <div className="mt-3 flex items-center justify-between gap-2 lg:block">
                        <div className="flex flex-wrap gap-1.5">
                          {studio.equipment_tags?.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 font-mono text-[10px] text-accent/70 leading-tight">
                              {tag}
                            </span>
                          ))}
                          {(studio.equipment_tags?.length ?? 0) > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 font-mono text-[10px] text-white/25 leading-tight">
                              +{studio.equipment_tags.length - 3}
                            </span>
                          )}
                        </div>
                        {/* CTA solo visible en móvil/tablet */}
                        <div className="lg:hidden shrink-0 px-4 py-1.5 rounded-xl bg-accent/10 border border-accent/20 font-mono text-[11px] text-accent uppercase tracking-widest group-hover:bg-accent group-hover:text-white transition-all duration-200 whitespace-nowrap">
                          Reservar →
                        </div>
                      </div>
                    </div>

                    {/* Panel derecho — solo desktop */}
                    <div className="hidden lg:flex w-52 shrink-0 px-5 py-5 flex-col justify-between">
                      <div className="text-right">
                        {studio.price_per_hour ? (
                          <>
                            <div className="font-heading font-bold text-3xl text-white leading-none">{studio.price_per_hour}€</div>
                            <div className="font-mono text-[10px] text-white/25 uppercase tracking-widest mt-0.5">por hora</div>
                          </>
                        ) : (
                          <div className="font-mono text-xs text-white/20">Consultar</div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end mt-3">
                        {studio.equipment_tags?.slice(0, 4).map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 font-mono text-[10px] text-accent/70 leading-tight">
                            {tag}
                          </span>
                        ))}
                        {(studio.equipment_tags?.length ?? 0) > 4 && (
                          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/8 font-mono text-[10px] text-white/25 leading-tight">
                            +{studio.equipment_tags.length - 4} más
                          </span>
                        )}
                      </div>
                      <div className="mt-4 w-full py-2 rounded-xl bg-accent/10 border border-accent/20 font-mono text-[11px] text-accent text-center uppercase tracking-widest group-hover:bg-accent group-hover:text-white group-hover:border-accent transition-all duration-200">
                        Ver y reservar →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Drawer de reserva (sólo en vista lista) ── */}
          {selectedStudio && (
            <>
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-40"
                onClick={() => { setSelectedStudio(null); setStep(1); setSelectedCategory(null); setSelectedSpace(null); }}
              />
              <div className="fixed top-0 right-0 h-screen w-full md:w-[680px] bg-[#0f0f0f] z-50 overflow-y-auto shadow-2xl animate-[slide-in-right_0.3s_ease-out]">
                <div className="p-6 flex flex-col min-h-full">
                  <div className="flex flex-col gap-6 flex-1 animate-[fade-in_0.3s_ease-out]">

                    {/* Cabecera del estudio */}
                    <div className="rounded-2xl overflow-hidden h-48 relative border border-white/5 shadow-xl">
                      <img
                        src={selectedStudio.photos?.[0] ?? selectedStudio.image_url ?? 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=500'}
                        alt={selectedStudio.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
                      <button
                        onClick={() => { setSelectedStudio(null); setStep(1); setSelectedCategory(null); setSelectedSpace(null); }}
                        className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-accent transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-4 left-4">
                        <h3 className="font-heading text-2xl font-bold text-white">{selectedStudio.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="font-mono text-[10px] text-accent flex items-center gap-1 uppercase tracking-widest">
                            <MapPin className="w-3 h-3" /> {selectedStudio.address || selectedStudio.location || selectedStudio.city || 'Madrid'}
                          </div>
                          {reviews.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Star size={10} className="text-yellow-400 fill-yellow-400" />
                              <span className="font-mono text-[10px] text-yellow-400 font-bold">
                                {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                              </span>
                              <span className="font-mono text-[10px] text-white/30">({reviews.length})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Equipamiento */}
                    {selectedStudio.equipment_tags?.length > 0 && (
                      <div>
                        <div className="font-mono text-[10px] text-text/50 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Equipamiento</div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedStudio.equipment_tags.map(tag => (
                            <span key={tag} className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 font-mono text-[10px] text-accent/80">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="flex flex-col flex-1">
                        <div className="font-mono text-[10px] text-text/50 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Selecciona el Espacio</div>
                        {loadingServices ? (
                          <div className="flex items-center justify-center py-8"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
                        ) : studioServices.length === 0 ? (
                          <p className="font-mono text-sm text-text/40 text-center py-8">Este estudio aún no tiene espacios configurados.</p>
                        ) : (
                          <div className="space-y-3 mb-6">
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
                            <input type="text" value={artistName} onChange={e => setArtistName(e.target.value)} placeholder="EJ. KAEL" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-accent transition-colors font-mono" />
                          </div>
                          <div>
                            <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">
                              Email de Contacto *{sessionUser && <span className="ml-2 text-accent/60 normal-case tracking-normal">· de tu cuenta</span>}
                            </label>
                            <input type="email" value={clientEmail} onChange={e => !sessionUser && setClientEmail(e.target.value)} placeholder="tu@email.com" readOnly={!!sessionUser} className={`w-full border rounded-xl py-4 px-4 outline-none transition-colors font-mono ${sessionUser ? 'bg-transparent border-white/8 text-white/40 cursor-default' : 'bg-white/5 border-white/10 text-white focus:border-accent'}`} />
                          </div>
                          <div>
                            <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">Teléfono *</label>
                            <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="600 000 000" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white outline-none focus:border-accent transition-colors font-mono" />
                          </div>
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest">Invitados (Máx 3)</label>
                              <button onClick={() => setCompanions([...companions, ''])} disabled={companions.length >= 3} className="text-accent text-[10px] font-bold uppercase tracking-wider">+ Añadir</button>
                            </div>
                            <div className="space-y-3">
                              {companions.map((comp, i) => (
                                <div key={i} className="flex gap-2">
                                  <input type="text" value={comp} onChange={e => { const n = [...companions]; n[i] = e.target.value; setCompanions(n); }} placeholder={`Invitado ${i + 1}`} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-accent font-mono" />
                                  <button onClick={() => setCompanions(companions.filter((_, idx) => idx !== i))} className="text-red-500/50 hover:text-red-500 px-2 transition-colors">✕</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="mt-auto pt-8">
                          <button onClick={() => setStep(4)} disabled={!artistName.trim() || !clientEmail.includes('@') || !clientPhone.trim()} className="w-full py-4 rounded-xl bg-accent text-white font-mono font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50 shadow-lg">
                            Elegir Horario <Calendar className="inline ml-2 w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-[fade-in_0.3s_ease-out]">
                        <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl" onClick={() => setStep(3)} />
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
                                setSelectedDate(date); setSelectedSlot(slot); setSelectedDuration(durationHours); setPendingBookingId(bookingId); setStep(5);
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
                              <p className="text-sm text-white font-mono">{selectedDate} · {selectedSlot} → {(() => { const h = parseInt(selectedSlot) + selectedDuration; return `${String(h).padStart(2, '0')}:00`; })()}</p>
                              <p className="text-[10px] text-text/40 font-mono mt-0.5">{selectedDuration}h · {parseFloat(selectedSpace?.price_per_hour) || 0}€/h</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-auto">
                          <button onClick={handlePayment} disabled={isPaying} className="w-full py-5 rounded-xl bg-accent text-white font-mono font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(138,43,226,0.2)]">
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
                        <button onClick={() => { navigate('/'); setSelectedStudio(null); setStep(1); }} className="w-full py-4 rounded-xl border border-white/10 text-white font-mono text-xs font-bold uppercase tracking-widest hover:border-accent transition-colors">
                          Volver al Inicio
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* ── MAP VIEW ──────────────────────────────────────────── */
        <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row overflow-hidden relative">
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

            {/* Botón volver + toggle vista — juntos a la izquierda */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-[#050505]/80 backdrop-blur border border-white/10 px-4 py-2 rounded-full font-mono text-xs hover:bg-white/5 transition-colors shadow-lg">
                <ArrowLeft className="w-4 h-4 text-accent" /> Volver
              </button>
              <ViewToggle current="map" iconsOnly />
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
                            {(studio.address || studio.city) && <p className="font-mono text-[10px] text-text/40 truncate">{studio.address || studio.city}</p>}
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
                      <div className="flex items-center gap-3 mt-1">
                        <div className="font-mono text-[10px] text-accent flex items-center gap-1 uppercase tracking-widest">
                          <MapPin className="w-3 h-3" /> {selectedStudio.address || selectedStudio.location || selectedStudio.city || 'Madrid'}
                        </div>
                        {reviews.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-mono text-[10px] text-yellow-400 font-bold">
                              {(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)}
                            </span>
                            <span className="font-mono text-[10px] text-white/30">({reviews.length})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Equipamiento */}
                  {selectedStudio.equipment_tags?.length > 0 && (
                    <div>
                      <div className="font-mono text-[10px] text-text/50 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                        Equipamiento
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedStudio.equipment_tags.map(tag => (
                          <span key={tag} className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 font-mono text-[10px] text-accent/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

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
                      {/* Reseñas */}
                      <div className="mb-6">
                        <div className="font-mono text-[10px] text-text/50 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                          Reseñas
                        </div>

                        {/* Lista de reseñas */}
                        {reviews.length === 0 ? (
                          <p className="font-mono text-xs text-text/30 text-center py-4">Sin reseñas todavía.</p>
                        ) : (
                          <div className="space-y-3 mb-4">
                            {reviews.map(r => (
                              <div key={r.id} className="bg-white/3 border border-white/5 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent font-mono">
                                      {(r.user?.artist_name || r.user?.name || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="font-mono text-xs text-white/70">
                                      {r.user?.artist_name || r.user?.name || 'Artista'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <Star key={n} size={10} className={n <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'} />
                                    ))}
                                  </div>
                                </div>
                                {r.comment && (
                                  <p className="font-mono text-[11px] text-text/50 mt-1 leading-relaxed">{r.comment}</p>
                                )}
                                <p className="font-mono text-[9px] text-text/20 mt-1">
                                  {new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Formulario / estado del usuario */}
                        {canReview && !userReview && (
                          <div className="bg-white/3 border border-accent/20 rounded-xl p-4">
                            <p className="font-mono text-[10px] text-accent uppercase tracking-widest mb-3">Tu reseña</p>
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map(n => (
                                <button key={n} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: n }))}>
                                  <Star size={18} className={n <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={reviewForm.comment}
                              onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                              placeholder="Cuéntanos tu experiencia (opcional)..."
                              rows={3}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-white/20 focus:outline-none focus:border-accent/50 resize-none transition-colors mb-3"
                            />
                            <button
                              onClick={submitReview}
                              disabled={reviewLoading}
                              className="w-full py-2 rounded-lg bg-accent text-white font-mono text-xs font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50"
                            >
                              {reviewLoading ? 'Publicando…' : 'Publicar reseña'}
                            </button>
                          </div>
                        )}

                        {canReview && userReview && (
                          <div className="bg-white/3 border border-white/8 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <div className="flex gap-0.5 mb-0.5">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <Star key={n} size={11} className={n <= userReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/15'} />
                                ))}
                              </div>
                              <p className="font-mono text-[10px] text-text/40">Tu reseña publicada</p>
                            </div>
                            <button
                              onClick={deleteReview}
                              className="font-mono text-[10px] text-red-400/60 hover:text-red-400 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        )}

                        {!canReview && !sessionUser && (
                          <p className="font-mono text-[10px] text-text/30 text-center">
                            <span className="text-accent/60 cursor-pointer hover:text-accent" onClick={() => navigate('/login')}>Inicia sesión</span> para ver si puedes dejar reseña.
                          </p>
                        )}

                        {!canReview && sessionUser && (
                          <p className="font-mono text-[10px] text-text/30 text-center">
                            Solo huéspedes verificados pueden opinar.
                          </p>
                        )}
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
                          <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">
                            Email de Contacto *
                            {sessionUser && <span className="ml-2 text-accent/60 normal-case tracking-normal">· de tu cuenta</span>}
                          </label>
                          <input
                            type="email"
                            value={clientEmail}
                            onChange={e => !sessionUser && setClientEmail(e.target.value)}
                            placeholder="tu@email.com"
                            readOnly={!!sessionUser}
                            className={`w-full border rounded-xl py-4 px-4 outline-none transition-colors font-mono ${sessionUser ? 'bg-transparent border-white/8 text-white/40 cursor-default' : 'bg-white/5 border-white/10 text-white focus:border-accent'}`}
                          />
                        </div>
                        <div>
                          <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">Teléfono *</label>
                          <input
                            type="tel"
                            value={clientPhone}
                            onChange={e => setClientPhone(e.target.value)}
                            placeholder="600 000 000"
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
                          disabled={!artistName.trim() || !clientEmail.includes('@') || !clientPhone.trim()}
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
                            <p className="text-sm text-white font-mono">{selectedDate} · {selectedSlot} → {selectedSlot && (() => { const h = parseInt(selectedSlot) + selectedDuration; return `${String(h).padStart(2, '0')}:00` })()}</p>
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
        @keyframes slide-in-right { 0% { transform: translateX(100%); opacity: 0; } 100% { transform: translateX(0); opacity: 1; } }
        input:-webkit-autofill, input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 1000px #0a0a0a inset !important; -webkit-text-fill-color: rgba(255,255,255,0.4) !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(138, 43, 226, 0.2); border-radius: 10px; }
      `}</style>
        </div>
      )}
    </>
  );
}
