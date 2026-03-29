import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Navbar from './components/Navbar'
import { Calendar, Clock, MapPin, Music2, CheckCircle2, XCircle, Hourglass, ArrowRight, LogOut } from 'lucide-react'

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
        avatar: session.user.user_metadata?.avatar_url ?? null,
      })

      // Reservas del usuario por email
      const { data: bookingData } = await supabase
        .from('bookings')
        .select(`
          id, client_name, start_datetime, end_datetime,
          status, amount_paid,
          spaces ( name, studios ( name, photos, image_url, city ) )
        `)
        .eq('client_email', userRow.email)
        .order('start_datetime', { ascending: false })

      setBookings(bookingData ?? [])
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
      </div>
    </div>
  )
}
