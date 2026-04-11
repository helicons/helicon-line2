import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import { Calendar, Clock, MapPin, Music2, CheckCircle2, XCircle, Hourglass, ArrowRight, LogOut, Play, Pause, Heart, ShoppingCart } from 'lucide-react'

const GENRE_COLORS = {
  'Trap':       [255,0,60],   'R&B':       [0,200,255],
  'Drill':      [138,43,226], 'Synthwave': [138,43,226],
  'Techno':     [255,215,0],  'Industrial':[255,140,0],
  'Hard':       [255,60,0],   'Bouncy':    [0,255,150],
  'Chill':      [0,240,255],
}
const DEFAULT_COLOR = [138,43,226]

const STATUS = {
  confirmed: { label: 'Confirmada', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  pending:   { label: 'Pendiente',  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  cancelled: { label: 'Cancelada',  color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

const StatusIcon = ({ status }) => {
  if (status === 'confirmed') return <CheckCircle2 className="w-3.5 h-3.5" />
  if (status === 'cancelled') return <XCircle className="w-3.5 h-3.5" />
  return <Hourglass className="w-3.5 h-3.5" />
}

export default function UserProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('bookings')
  const [likedBeats, setLikedBeats] = useState([])
  const [playingId, setPlayingId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const togglePlay = (beat) => {
    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    if (playingId === beat.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false) }
      else { audio.play().catch(() => {}); setIsPlaying(true) }
    } else {
      audio.pause()
      audio.src = beat.audio_url ?? ''
      audio.play().catch(() => {})
      setPlayingId(beat.id)
      setIsPlaying(true)
    }
  }

  const unlikeBeat = async (beatId) => {
    if (!user) return
    await supabase.from('user_likes').delete().eq('user_id', user.id).eq('beat_id', beatId)
    setLikedBeats(prev => prev.filter(b => b.id !== beatId))
    if (playingId === beatId) { audioRef.current?.pause(); setPlayingId(null); setIsPlaying(false) }
  }

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login', { replace: true }); return }

      // Datos del usuario
      const { data: userRow } = await supabase
        .from('users')
        .select('name, email')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (!userRow) { navigate('/login', { replace: true }); return }

      setUser({
        ...userRow,
        id: session.user.id,
        avatar: session.user.user_metadata?.avatar_url ?? null,
      })

      // Reservas del usuario — buscar por email de sesión (más fiable que tabla users)
      const sessionEmail = session.user.email
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id, client_name, start_datetime, end_datetime,
          status, amount_paid,
          spaces ( name, studios ( name, photos, image_url, city ) )
        `)
        .ilike('client_email', sessionEmail)
        .order('start_datetime', { ascending: false })

      if (bookingError) console.error('Error cargando reservas:', bookingError)

      let savedBeats = []
      try {
        const { data: likesData } = await supabase
          .from('user_likes')
          .select('beat_id, beats(*, producers(id, name))')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
        savedBeats = likesData?.map(r => r.beats).filter(Boolean) ?? []
      } catch (err) {
        console.error('Error cargando likes:', err)
      }

      setBookings(bookingData ?? [])
      setLikedBeats(savedBeats)
      setLoading(false)
    }
    load()
  }, [navigate])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const initials = user?.name
    ? user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pt-32 pb-20">

        {/* Header perfil */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-accent/30 flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-accent/20 flex items-center justify-center text-lg font-mono font-bold text-accent">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-heading text-white truncate">{user?.name}</h1>
            <p className="text-sm font-mono text-text/40 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-mono text-text/40 hover:text-white border border-white/8 hover:border-white/20 px-4 py-2 rounded-xl transition-all"
          >
            <LogOut size={13} /> Salir
          </button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Reservas', value: bookings.length },
            { label: 'Confirmadas', value: bookings.filter(b => b.status === 'confirmed').length },
            { label: 'Gastado', value: `${bookings.filter(b => b.status === 'confirmed').reduce((acc, b) => acc + (parseFloat(b.amount_paid) || 0), 0)}€` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/3 border border-white/8 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold font-heading text-white">{value}</p>
              <p className="text-[10px] font-mono text-text/40 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pestañas (Tabs) */}
        <div className="flex items-center gap-6 border-b border-white/10 mb-8 pb-3 relative">
          <button 
             onClick={() => setActiveTab('bookings')} 
             className={`font-heading font-bold text-lg transition-colors ${activeTab === 'bookings' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
             Mis Reservas
          </button>
          <button 
             onClick={() => setActiveTab('likes')} 
             className={`font-heading font-bold text-lg transition-colors flex items-center gap-2 ${activeTab === 'likes' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
          >
             Mis Likes <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full">{likedBeats.length}</span>
          </button>
          <div className="absolute -bottom-[1px] h-[2px] bg-accent transition-all duration-300" 
               style={{ 
                  width: activeTab === 'bookings' ? '120px' : '90px', 
                  left: activeTab === 'bookings' ? '0px' : '143px' 
               }} 
          ></div>
        </div>

        {activeTab === 'bookings' ? (
        <>
          {/* Filtros */}
          <div className="flex items-center gap-2 mb-6">
            <p className="text-xs font-mono text-text/40 uppercase tracking-widest mr-2">Filtrar:</p>
            {['all', 'confirmed', 'pending', 'cancelled'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-[10px] font-mono px-3 py-1.5 rounded-full border transition-all ${filter === f ? 'bg-accent border-accent text-white' : 'border-white/10 text-text/40 hover:text-white hover:border-white/20'}`}
              >
                {f === 'all' ? 'Todas' : STATUS[f]?.label ?? f}
              </button>
            ))}
          </div>

          {/* Lista de reservas */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-white/3 border border-white/8 flex items-center justify-center mx-auto mb-4">
              <Music2 className="w-7 h-7 text-text/20" />
            </div>
            <p className="font-mono text-sm text-text/30">
              {filter === 'all' ? 'Aún no tienes reservas' : 'No hay reservas con este filtro'}
            </p>
            <Link to="/book-studio" className="inline-flex items-center gap-1.5 mt-6 text-xs font-mono text-accent hover:text-white transition-colors">
              Explorar estudios <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(b => {
              const studio = b.spaces?.studios
              const start = new Date(b.start_datetime)
              const end = b.end_datetime ? new Date(b.end_datetime) : null
              const dateStr = start.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
              const timeStr = start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
              const endTimeStr = end?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' })
              const st = STATUS[b.status] ?? STATUS.pending
              const photo = studio?.photos?.[0] ?? studio?.image_url

              return (
                <div key={b.id} className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all">
                  <div className="flex gap-0">
                    {/* Imagen estudio */}
                    {photo ? (
                      <div className="w-28 flex-shrink-0 relative">
                        <img src={photo} alt={studio?.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]" />
                      </div>
                    ) : (
                      <div className="w-28 flex-shrink-0 bg-accent/5 flex items-center justify-center border-r border-white/5">
                        <Music2 className="w-8 h-8 text-accent/20" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 p-5 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-mono text-accent uppercase tracking-widest mb-0.5">
                            {b.spaces?.name ?? 'Sala'}
                          </p>
                          <h3 className="font-heading font-bold text-white text-base truncate">
                            {studio?.name ?? 'Estudio'}
                          </h3>
                          {studio?.city && (
                            <p className="text-[11px] font-mono text-text/40 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} /> {studio.city}
                            </p>
                          )}
                        </div>
                        <span className={`flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border flex-shrink-0 ${st.color}`}>
                          <StatusIcon status={b.status} />
                          {st.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-3 border-t border-white/5">
                        <span className="flex items-center gap-1.5 text-xs font-mono text-text/50">
                          <Calendar size={11} className="text-accent/60" />
                          {dateStr}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-mono text-text/50">
                          <Clock size={11} className="text-accent/60" />
                          {timeStr}{endTimeStr ? ` → ${endTimeStr}` : ''}
                        </span>
                        {b.amount_paid && (
                          <span className="ml-auto text-sm font-bold font-heading text-accent">
                            {parseFloat(b.amount_paid)}€
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </>
        ) : (
          /* Lista de Beats — estilo New Releases */
          <div>
            {likedBeats.length === 0 ? (
              <div className="text-center py-20">
                <Music2 className="w-10 h-10 text-white/20 mx-auto mb-4" />
                <p className="font-mono text-sm text-white/30">Aún no tienes beats guardados.</p>
              </div>
            ) : (
              <>
                <div className="hidden md:grid grid-cols-[40px_40px_1fr_80px_60px_60px_28px_70px_36px] gap-4 px-3 pb-2 border-b border-white/5 font-mono text-[10px] text-white/25 uppercase tracking-widest">
                  <span/><span/><span>Título</span><span>Género</span><span>BPM</span><span>Key</span><span/><span className="text-right">Precio</span><span/>
                </div>
                {likedBeats.map((beat) => {
                  const color = GENRE_COLORS[beat.genre] ?? DEFAULT_COLOR
                  const [r,g,b] = color
                  const isActive = playingId === beat.id
                  const playing = isActive && isPlaying
                  const imageUrl = beat.image_url ?? 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=200'
                  const price = parseFloat(beat.price_basic) || parseFloat(beat.price) || 0
                  return (
                    <div
                      key={beat.id}
                      className="grid grid-cols-[40px_40px_1fr_auto] md:grid-cols-[40px_40px_1fr_80px_60px_60px_28px_70px_36px] gap-4 px-3 py-3 items-center rounded-xl cursor-pointer transition-all duration-200"
                      style={{ background: isActive ? `rgba(${r},${g},${b},0.08)` : 'transparent' }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? `rgba(${r},${g},${b},0.08)` : 'transparent' }}
                      onClick={() => togglePlay(beat)}
                    >
                      {/* Play/pause */}
                      <button
                        onClick={e => { e.stopPropagation(); togglePlay(beat) }}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                      >
                        {playing
                          ? <Pause className="w-3.5 h-3.5" style={{ color: `rgb(${r},${g},${b})` }}/>
                          : <Play className="w-3.5 h-3.5 ml-0.5 text-white/60" />}
                      </button>
                      {/* Thumb */}
                      <img src={imageUrl} alt={beat.title} className="w-10 h-10 rounded-lg object-cover border border-white/10"/>
                      {/* Title + producer */}
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate leading-tight" style={{ color: isActive ? `rgb(${r},${g},${b})` : '#fff' }}>{beat.title}</p>
                        <p className="font-mono text-[10px] text-white/40 truncate"
                           onClick={e => { e.stopPropagation(); if (beat.producers?.id) navigate(`/producer/${beat.producers.id}`) }}>
                          {beat.producers?.name || 'Productor'}
                        </p>
                      </div>
                      {/* Genre */}
                      <span className="hidden md:inline font-mono text-[10px] px-2 py-1 rounded-full border border-white/10 text-white/40 bg-white/3 truncate">{beat.genre || '—'}</span>
                      {/* BPM */}
                      <span className="hidden md:inline font-mono text-xs text-white/30">{beat.bpm || '—'}</span>
                      {/* Key */}
                      <span className="hidden md:inline font-mono text-xs text-white/30">{beat.key || '—'}</span>
                      {/* Unlike */}
                      <button
                        onClick={e => { e.stopPropagation(); unlikeBeat(beat.id) }}
                        className="hidden md:flex items-center justify-center transition-colors"
                        title="Quitar de favoritos"
                      >
                        <Heart className="w-3.5 h-3.5" style={{ color: `rgb(${r},${g},${b})`, fill: `rgb(${r},${g},${b})` }}/>
                      </button>
                      {/* Price */}
                      <span className="font-heading font-bold text-sm text-right" style={{ color: `rgb(${r},${g},${b})` }}>{price}€</span>
                      {/* Cart */}
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/beats?beat=${beat.id}`) }}
                        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                        title="Comprar"
                      >
                        <ShoppingCart className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
