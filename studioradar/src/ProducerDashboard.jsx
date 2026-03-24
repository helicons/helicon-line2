import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Layers, Clock, BookOpen, LogOut, ChevronDown, Building2, Pencil, PlusCircle } from 'lucide-react'
import { supabase } from './lib/supabase'
import SpaceManager from './components/SpaceManager'
import AvailabilityManager from './components/AvailabilityManager'
import ProducerCalendar from './components/ProducerCalendar'
import StudioForm from './components/StudioForm'

const TABS = [
  { id: 'studio', label: 'Mi Estudio', Icon: Building2 },
  { id: 'calendar', label: 'Calendario', Icon: CalendarDays },
  { id: 'spaces', label: 'Espacios', Icon: Layers },
  { id: 'availability', label: 'Disponibilidad', Icon: Clock },
  { id: 'bookings', label: 'Reservas', Icon: BookOpen },
]

const STATUS_BADGE = {
  confirmed: 'bg-accent/20 text-accent border-accent/30',
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-white/5 text-text/30 border-white/10',
}
const STATUS_LABELS = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' }

export default function ProducerDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('studio')
  const [editingStudio, setEditingStudio] = useState(false)
  const [producer, setProducer] = useState(null)
  const [studio, setStudio] = useState(null)
  const [spaces, setSpaces] = useState([])
  const [selectedSpaceId, setSelectedSpaceId] = useState(null)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsFilter, setBookingsFilter] = useState('all')

  // Cargar productor + studio + spaces
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prod } = await supabase
        .from('producers')
        .select('*, studios(*)')
        .eq('user_id', user.id)
        .maybeSingle()

      let resolvedProd = prod
      if (!resolvedProd) {
        // Primera vez: crear fila en producers automáticamente
        const { data: newProd } = await supabase
          .from('producers')
          .insert({ user_id: user.id, name: user.user_metadata?.full_name ?? user.email })
          .select()
          .single()
        if (!newProd) return
        resolvedProd = newProd
      }
      setProducer(resolvedProd)

      // studios puede llegar como array [] o como objeto según la relación
      const studioData = Array.isArray(resolvedProd.studios)
        ? (resolvedProd.studios[0] ?? null)
        : (resolvedProd.studios ?? null)
      if (!studioData) return
      setStudio(studioData)

      const { data: spacesData } = await supabase
        .from('spaces')
        .select('*')
        .eq('studio_id', studioData.id)
        .order('created_at')
      setSpaces(spacesData ?? [])
      if (spacesData && spacesData.length > 0) setSelectedSpaceId(spacesData[0].id)
    }
    load()
  }, [])

  // Recargar spaces cuando el tab cambia a 'availability'
  useEffect(() => {
    if (tab !== 'availability' || !studio) return
    supabase.from('spaces').select('*').eq('studio_id', studio.id).order('created_at')
      .then(({ data }) => {
        setSpaces(data ?? [])
        if (data && data.length > 0 && !selectedSpaceId) setSelectedSpaceId(data[0].id)
      })
  }, [tab])

  // Cargar reservas cuando el tab cambia a 'bookings'
  useEffect(() => {
    if (tab !== 'bookings' || !studio) return
    setBookingsLoading(true)
    supabase
      .from('bookings')
      .select('*, spaces(name, studio_id)')
      .order('start_datetime', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const filtered = (data ?? []).filter(b => b.spaces?.studio_id === studio.id)
        setBookings(filtered)
        setBookingsLoading(false)
      })
  }, [tab, studio])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/producer/login')
  }

  const filteredBookings = bookingsFilter === 'all' ? bookings : bookings.filter(b => b.status === bookingsFilter)

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#050505]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg font-bold tracking-[0.2em] text-white">HELICON</span>
            <span className="text-white/10">|</span>
            <span className="text-[11px] font-mono text-text/50 uppercase tracking-widest">Producer</span>
            {studio && (
              <>
                <span className="text-white/10">|</span>
                <span className="text-xs font-mono text-accent">{studio.name}</span>
              </>
            )}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white transition-colors">
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/3 border border-white/5 rounded-xl p-1 w-fit">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all ${tab === id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text/50 hover:text-white'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Panel de contenido */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 shadow-xl">

          {/* ── MI ESTUDIO ── */}
          {tab === 'studio' && (
            <div>
              {!studio && !editingStudio && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                    <Building2 size={28} className="text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Aún no tienes estudio</h3>
                  <p className="text-text/40 text-sm font-mono max-w-xs mb-8">
                    Crea tu estudio para que los artistas puedan encontrarte en el Radar y reservar sesiones.
                  </p>
                  <button
                    onClick={() => setEditingStudio(true)}
                    className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20"
                  >
                    <PlusCircle size={16} /> Añadir mi estudio
                  </button>
                </div>
              )}

              {(studio && !editingStudio) && (
                <div className="space-y-6">
                  {/* Resumen del estudio */}
                  <div className="flex items-start gap-5">
                    {(studio.photos?.[0] || studio.image_url) && (
                      <img
                        src={studio.photos?.[0] ?? studio.image_url}
                        alt={studio.name}
                        className="w-24 h-24 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-white font-bold text-xl">{studio.name}</h3>
                        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${studio.is_published ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-text/30 border-white/10'}`}>
                          {studio.is_published ? 'Publicado' : 'No publicado'}
                        </span>
                      </div>
                      {studio.city && (
                        <p className="text-text/50 text-sm font-mono mt-1">{studio.city}{studio.country ? `, ${studio.country}` : ''}</p>
                      )}
                      {studio.price_per_hour && (
                        <p className="text-accent text-sm font-mono mt-1">{studio.price_per_hour}€/h</p>
                      )}
                      {studio.photos?.length > 0 && (
                        <p className="text-text/30 text-xs font-mono mt-2">{studio.photos.length} foto{studio.photos.length !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingStudio(true)}
                      className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/30 transition-all shrink-0"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                  </div>

                  {/* Galería de fotos (preview) */}
                  {studio.photos?.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {studio.photos.slice(1, 7).map((url, i) => (
                        <img key={i} src={url} alt="" className="aspect-square rounded-lg object-cover border border-white/5" />
                      ))}
                    </div>
                  )}

                  {/* Aviso: publicado pero sin coordenadas */}
                  {studio.is_published && (!studio.lat || !studio.lng) && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs font-mono text-yellow-400">
                      Tu estudio está publicado pero no aparecerá en el mapa hasta que añadas las coordenadas (lat/lng) en el formulario de edición.
                    </div>
                  )}

                  {/* Tags de equipamiento */}
                  {studio.equipment_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {studio.equipment_tags.map(tag => (
                        <span key={tag} className="text-[10px] font-mono bg-white/5 border border-white/8 text-text/50 px-2.5 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editingStudio && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">
                      {studio ? 'Editar Estudio' : 'Nuevo Estudio'}
                    </h3>
                    {studio && (
                      <button
                        onClick={() => setEditingStudio(false)}
                        className="text-text/40 text-xs font-mono hover:text-white transition-colors"
                      >
                        ← Volver
                      </button>
                    )}
                  </div>
                  <StudioForm
                    studio={studio}
                    producerId={producer?.id}
                    onSaved={(saved) => {
                      setStudio(saved)
                      setEditingStudio(false)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── CALENDARIO ── */}
          {tab === 'calendar' && (
            <ProducerCalendar studioId={studio?.id} />
          )}

          {/* ── ESPACIOS ── */}
          {tab === 'spaces' && (
            <SpaceManager studioId={studio?.id} />
          )}

          {/* ── DISPONIBILIDAD ── */}
          {tab === 'availability' && (
            <div className="space-y-6">
              {spaces.length > 0 && (
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-mono text-text/40 uppercase tracking-widest shrink-0">Espacio:</label>
                  <div className="relative">
                    <select
                      value={selectedSpaceId ?? ''}
                      onChange={e => setSelectedSpaceId(e.target.value)}
                      className="appearance-none bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-white text-xs font-mono outline-none focus:border-accent cursor-pointer"
                    >
                      {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none" />
                  </div>
                </div>
              )}
              <AvailabilityManager spaceId={selectedSpaceId} />
            </div>
          )}

          {/* ── RESERVAS ── */}
          {tab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Reservas</h3>
                <div className="flex gap-1">
                  {['all', 'confirmed', 'pending', 'cancelled'].map(f => (
                    <button
                      key={f}
                      onClick={() => setBookingsFilter(f)}
                      className={`text-[10px] font-mono px-3 py-1 rounded-full border transition-all ${bookingsFilter === f ? 'bg-accent border-accent text-white' : 'border-white/10 text-text/40 hover:text-white'}`}
                    >
                      {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>

              {bookingsLoading && <p className="text-text/30 text-xs font-mono py-8 text-center">Cargando…</p>}

              {!bookingsLoading && filteredBookings.length === 0 && (
                <p className="text-text/20 text-xs font-mono text-center py-12">No hay reservas</p>
              )}

              {!bookingsLoading && filteredBookings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/5">
                        {['Fecha', 'Hora', 'Cliente', 'Sala', 'Importe', 'Estado'].map(h => (
                          <th key={h} className="text-left py-3 px-2 text-[10px] text-text/30 uppercase tracking-widest font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map(b => {
                        const start = new Date(b.start_datetime)
                        const dateStr = start.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' })
                        const timeStr = start.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
                        return (
                          <tr key={b.id} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                            <td className="py-3 px-2 text-text/60">{dateStr}</td>
                            <td className="py-3 px-2 text-text/60">{timeStr}</td>
                            <td className="py-3 px-2 text-white">{b.client_name}</td>
                            <td className="py-3 px-2 text-text/60">{b.spaces?.name ?? '—'}</td>
                            <td className="py-3 px-2 text-accent font-bold">{b.amount_paid ? `${b.amount_paid}€` : '—'}</td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${STATUS_BADGE[b.status] ?? STATUS_BADGE.cancelled}`}>
                                {STATUS_LABELS[b.status] ?? b.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
