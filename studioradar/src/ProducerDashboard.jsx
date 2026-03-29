import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Layers, Clock, BookOpen, LogOut, ChevronDown, Building2, Pencil, PlusCircle, ArrowLeft, Music2, Trash2, Eye, EyeOff } from 'lucide-react'
import { supabase } from './lib/supabase'
import SpaceManager from './components/SpaceManager'
import AvailabilityManager from './components/AvailabilityManager'
import ProducerCalendar from './components/ProducerCalendar'
import StudioForm from './components/StudioForm'
import BeatForm from './components/BeatForm'

const TABS = [
  { id: 'studio',       label: 'Mis Estudios',   Icon: Building2   },
  { id: 'calendar',     label: 'Calendario',      Icon: CalendarDays },
  { id: 'spaces',       label: 'Espacios',        Icon: Layers      },
  { id: 'availability', label: 'Disponibilidad',  Icon: Clock       },
  { id: 'bookings',     label: 'Reservas',        Icon: BookOpen    },
  { id: 'beats',        label: 'Beats',           Icon: Music2      },
]

const STATUS_BADGE = {
  confirmed: 'bg-accent/20 text-accent border-accent/30',
  pending:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  cancelled: 'bg-white/5 text-text/30 border-white/10',
}
const STATUS_LABELS = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' }

export default function ProducerDashboard() {
  const navigate = useNavigate()
  const [tab, setTab]               = useState('studio')
  const [producer, setProducer]     = useState(null)
  const [studios, setStudios]       = useState([])           // todos los estudios del productor
  const [activeStudioId, setActiveStudioId] = useState(null) // para tabs de gestión
  const [editingStudio, setEditingStudio]   = useState(null) // null | 'new' | studio object
  const [spaces, setSpaces]         = useState([])
  const [selectedSpaceId, setSelectedSpaceId] = useState(null)
  const [bookings, setBookings]     = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsFilter, setBookingsFilter]   = useState('all')
  const [beats, setBeats]           = useState([])
  const [beatsLoading, setBeatsLoading] = useState(false)
  const [addingBeat, setAddingBeat] = useState(false)

  const activeStudio = studios.find(s => s.id === activeStudioId) ?? studios[0] ?? null

  // ── Carga inicial ──────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Obtener o crear productor
      let prod
      const { data: existing } = await supabase
        .from('producers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        prod = existing
      } else {
        const { data: newProd } = await supabase
          .from('producers')
          .insert({ user_id: user.id, name: user.user_metadata?.full_name ?? user.email })
          .select()
          .single()
        if (!newProd) return
        prod = newProd
      }
      setProducer(prod)

      // Cargar TODOS los estudios del productor
      const { data: studioData } = await supabase
        .from('studios')
        .select('*')
        .eq('producer_id', prod.id)
        .order('created_at')

      const list = studioData ?? []
      setStudios(list)
      if (list.length > 0) setActiveStudioId(list[0].id)
    }
    load()
  }, [])

  // Recargar spaces cuando cambia estudio activo o tab
  useEffect(() => {
    if (!activeStudio) return
    supabase.from('spaces').select('*').eq('studio_id', activeStudio.id).order('created_at')
      .then(({ data }) => {
        setSpaces(data ?? [])
        setSelectedSpaceId(prev => {
          const ids = (data ?? []).map(s => s.id)
          return ids.includes(prev) ? prev : (ids[0] ?? null)
        })
      })
  }, [activeStudioId, tab])

  // Cargar beats del productor
  useEffect(() => {
    if (tab !== 'beats' || !producer) return
    setBeatsLoading(true)
    supabase
      .from('beats')
      .select('*')
      .eq('producer_id', producer.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBeats(data ?? [])
        setBeatsLoading(false)
      })
  }, [tab, producer])

  // Cargar reservas
  useEffect(() => {
    if (tab !== 'bookings' || !activeStudio) return
    setBookingsLoading(true)
    supabase
      .from('bookings')
      .select('*, spaces(name, studio_id)')
      .order('start_datetime', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const filtered = (data ?? []).filter(b => b.spaces?.studio_id === activeStudio.id)
        setBookings(filtered)
        setBookingsLoading(false)
      })
  }, [tab, activeStudioId])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/producer/login')
  }

  const filteredBookings = bookingsFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === bookingsFilter)

  // Selector de estudio para tabs de gestión
  const StudioSelector = () => {
    if (studios.length <= 1) return null
    return (
      <div className="flex items-center gap-3 mb-6">
        <label className="text-[10px] font-mono text-text/40 uppercase tracking-widest shrink-0">Estudio:</label>
        <div className="relative">
          <select
            value={activeStudioId ?? ''}
            onChange={e => setActiveStudioId(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 rounded-lg py-2 pl-3 pr-8 text-white text-xs font-mono outline-none focus:border-accent cursor-pointer"
          >
            {studios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-text/40 pointer-events-none" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#050505]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-mono text-lg font-bold tracking-[0.2em] text-white">HELICON</span>
            <span className="text-white/10">|</span>
            <span className="text-[11px] font-mono text-text/50 uppercase tracking-widest">Producer</span>
            {studios.length > 0 && (
              <>
                <span className="text-white/10">|</span>
                <span className="text-xs font-mono text-accent">{studios.length} estudio{studios.length !== 1 ? 's' : ''}</span>
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
        <div className="flex gap-1 mb-8 bg-white/3 border border-white/5 rounded-xl p-1 w-fit overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); setEditingStudio(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${tab === id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text/50 hover:text-white'}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Panel de contenido */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-6 shadow-xl">

          {/* ── MIS ESTUDIOS ── */}
          {tab === 'studio' && (
            <div>
              {/* Vista: lista de estudios */}
              {editingStudio === null && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">
                      Mis Estudios
                    </h3>
                    <button
                      onClick={() => setEditingStudio('new')}
                      className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20"
                    >
                      <PlusCircle size={14} /> Nuevo estudio
                    </button>
                  </div>

                  {studios.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                        <Building2 size={28} className="text-accent" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">Aún no tienes estudios</h3>
                      <p className="text-text/40 text-sm font-mono max-w-xs mb-8">
                        Crea tu primer estudio para que los artistas puedan encontrarte en el Radar y reservar sesiones.
                      </p>
                    </div>
                  )}

                  {studios.length > 0 && (
                    <div className="grid gap-3">
                      {studios.map(s => (
                        <div key={s.id} className="flex items-center gap-4 bg-white/3 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                          {(s.photos?.[0] || s.image_url) && (
                            <img
                              src={s.photos?.[0] ?? s.image_url}
                              alt={s.name}
                              className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          )}
                          {!s.photos?.[0] && !s.image_url && (
                            <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <Building2 size={20} className="text-text/20" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-bold text-sm">{s.name}</h4>
                              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.is_published ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-text/30 border-white/10'}`}>
                                {s.is_published ? 'Publicado' : 'Borrador'}
                              </span>
                            </div>
                            {s.city && (
                              <p className="text-text/40 text-xs font-mono mt-0.5">{s.city}</p>
                            )}
                            {s.price_per_hour && (
                              <p className="text-accent text-xs font-mono mt-0.5">{s.price_per_hour}€/h</p>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingStudio(s)}
                            className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/30 transition-all shrink-0"
                          >
                            <Pencil size={12} /> Editar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Vista: formulario (nuevo o editar) */}
              {editingStudio !== null && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">
                      {editingStudio === 'new' ? 'Nuevo Estudio' : `Editar: ${editingStudio.name}`}
                    </h3>
                    <button
                      onClick={() => setEditingStudio(null)}
                      className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white transition-colors"
                    >
                      <ArrowLeft size={13} /> Volver a la lista
                    </button>
                  </div>
                  <StudioForm
                    studio={editingStudio === 'new' ? null : editingStudio}
                    producerId={producer?.id}
                    onSaved={(saved) => {
                      setStudios(prev => {
                        const exists = prev.find(s => s.id === saved.id)
                        return exists
                          ? prev.map(s => s.id === saved.id ? saved : s)
                          : [...prev, saved]
                      })
                      setActiveStudioId(saved.id)
                      setEditingStudio(null)
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── CALENDARIO ── */}
          {tab === 'calendar' && (
            <div>
              <StudioSelector />
              {!activeStudio
                ? <p className="text-text/30 text-xs font-mono text-center py-12">Crea un estudio primero para ver el calendario.</p>
                : <ProducerCalendar studioId={activeStudio.id} />
              }
            </div>
          )}

          {/* ── ESPACIOS ── */}
          {tab === 'spaces' && (
            <div>
              <StudioSelector />
              <SpaceManager studioId={activeStudio?.id} />
            </div>
          )}

          {/* ── DISPONIBILIDAD ── */}
          {tab === 'availability' && (
            <div className="space-y-6">
              <StudioSelector />
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

          {/* ── BEATS ── */}
          {tab === 'beats' && (
            <div className="space-y-4">
              {!addingBeat ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Mis Beats</h3>
                    <button
                      onClick={() => setAddingBeat(true)}
                      className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20"
                    >
                      <PlusCircle size={14} /> Subir Beat
                    </button>
                  </div>

                  {beatsLoading && <p className="text-text/30 text-xs font-mono text-center py-12">Cargando…</p>}

                  {!beatsLoading && beats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-6">
                        <Music2 size={28} className="text-accent" />
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">Aún no tienes beats</h3>
                      <p className="text-text/40 text-sm font-mono max-w-xs">Sube tu primer beat para que los artistas puedan descubrirlo en el Beat Market.</p>
                    </div>
                  )}

                  {!beatsLoading && beats.length > 0 && (
                    <div className="space-y-2">
                      {beats.map(beat => (
                        <div key={beat.id} className="flex items-center gap-4 bg-white/3 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
                          {beat.image_url ? (
                            <img src={beat.image_url} alt={beat.title} className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                              <Music2 size={18} className="text-accent/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-bold text-sm truncate">{beat.title}</h4>
                              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${beat.is_published ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-text/30 border-white/10'}`}>
                                {beat.is_published ? 'Publicado' : 'Oculto'}
                              </span>
                            </div>
                            <p className="text-text/40 text-xs font-mono mt-0.5">
                              {[beat.genre, beat.mood, beat.bpm && `${beat.bpm} BPM`, beat.key].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          {beat.price != null && (
                            <span className="text-accent text-sm font-mono font-bold shrink-0">{beat.price}€</span>
                          )}
                          <button
                            onClick={async () => {
                              await supabase.from('beats').update({ is_published: !beat.is_published }).eq('id', beat.id)
                              setBeats(prev => prev.map(b => b.id === beat.id ? { ...b, is_published: !b.is_published } : b))
                            }}
                            className="text-text/30 hover:text-white transition-colors shrink-0"
                            title={beat.is_published ? 'Ocultar' : 'Publicar'}
                          >
                            {beat.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('¿Eliminar este beat?')) return
                              await supabase.from('beats').delete().eq('id', beat.id)
                              setBeats(prev => prev.filter(b => b.id !== beat.id))
                            }}
                            className="text-text/30 hover:text-red-400 transition-colors shrink-0"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Subir Beat</h3>
                    <button onClick={() => setAddingBeat(false)} className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white transition-colors">
                      <ArrowLeft size={13} /> Volver
                    </button>
                  </div>
                  <BeatForm
                    producerId={producer?.id}
                    onSaved={(newBeat) => {
                      setBeats(prev => [newBeat, ...prev])
                      setAddingBeat(false)
                    }}
                    onCancel={() => setAddingBeat(false)}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── RESERVAS ── */}
          {tab === 'bookings' && (
            <div className="space-y-4">
              <StudioSelector />
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
                        const start   = new Date(b.start_datetime)
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
