import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Layers, Clock, BookOpen, LogOut, ChevronDown, Building2, Pencil, PlusCircle, ArrowLeft, Music2, Trash2, Eye, EyeOff, UserCircle, ExternalLink, Upload, Loader, ShoppingBag, Wallet, Tag } from 'lucide-react'
import { supabase } from './lib/supabase'
import SpaceManager from './components/SpaceManager'
import AvailabilityManager from './components/AvailabilityManager'
import ProducerCalendar from './components/ProducerCalendar'
import StudioForm from './components/StudioForm'
import BeatForm from './components/BeatForm'

function ProfileEditor({ producer, onSaved, navigate }) {
  const [name, setName] = useState(producer.name ?? '')
  const [bio, setBio] = useState(producer.bio ?? '')
  const [avatarPreview, setAvatarPreview] = useState(producer.avatar_url ?? null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    let avatar_url = producer.avatar_url ?? null

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `${producer.id}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('beats-images')
        .upload(path, avatarFile, { upsert: true })
      if (!uploadErr) {
        const { data } = supabase.storage.from('beats-images').getPublicUrl(path)
        avatar_url = data.publicUrl
      }
    }

    const { data } = await supabase
      .from('producers')
      .update({ name: name.trim(), bio: bio.trim(), avatar_url })
      .eq('id', producer.id)
      .select()
      .single()

    if (data) {
      onSaved(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="w-full max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Mi Perfil Público</h3>
        <button
          type="button"
          onClick={() => navigate(`/producer/${producer.id}`)}
          className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-accent transition-colors shrink-0"
        >
          <ExternalLink size={12} /> <span className="hidden sm:inline">Ver perfil público</span>
        </button>
      </div>

      {/* Avatar */}
      <div>
        <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-3">Foto de perfil</label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 hover:border-accent/40 cursor-pointer transition-colors group shrink-0"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/5 flex items-center justify-center">
                <UserCircle size={32} className="text-text/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Upload size={14} className="text-white" />
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-xs font-mono text-accent hover:text-white transition-colors border border-accent/30 px-3 py-1.5 rounded-lg hover:border-accent"
            >
              Cambiar foto
            </button>
            <p className="text-text/30 text-[10px] font-mono mt-1.5">JPG, PNG · Máx. 2MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* Nombre */}
      <div>
        <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">Nombre artístico</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Tu nombre o alias"
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text/20"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2">Biografía / Introducción</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Cuéntale a los artistas quién eres, tu estilo, tus influencias…"
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text/20 resize-none"
        />
        <p className="text-text/20 text-[10px] font-mono mt-1 text-right">{bio.length}/300</p>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-6 py-3 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20 disabled:opacity-60"
      >
        {saving ? <><Loader size={13} className="animate-spin" /> Guardando…</> : saved ? '✓ Guardado' : 'Guardar perfil'}
      </button>
    </form>
  )
}

const getIgHandle = (ig) => {
  if (!ig) return null
  try {
    const url = new URL(ig)
    const handle = url.pathname.replace(/\//g, '')
    return handle || ig
  } catch {
    return ig.replace('@', '')
  }
}

const TABS = [
  { id: 'profile',      label: 'Mi Perfil',       Icon: UserCircle  },
  { id: 'studio',       label: 'Mis Estudios',    Icon: Building2   },
  { id: 'calendar',     label: 'Calendario',      Icon: CalendarDays },
  { id: 'spaces',       label: 'Espacios',        Icon: Layers      },
  { id: 'availability', label: 'Disponibilidad',  Icon: Clock       },
  { id: 'bookings',     label: 'Reservas',        Icon: BookOpen    },
  { id: 'beats',        label: 'Beats',           Icon: Music2      },
  { id: 'ventas',       label: 'Ventas',          Icon: ShoppingBag },
  { id: 'ofertas',      label: 'Ofertas',         Icon: Tag         },
  { id: 'cobros',       label: 'Cobros',          Icon: Wallet      },
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
  const [studios, setStudios]       = useState([])
  const [activeStudioId, setActiveStudioId] = useState(null)
  const [editingStudio, setEditingStudio]   = useState(null)
  const [spaces, setSpaces]         = useState([])
  const [selectedSpaceId, setSelectedSpaceId] = useState(null)
  const [bookings, setBookings]     = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsFilter, setBookingsFilter]   = useState('all')
  const [beats, setBeats]           = useState([])
  const [beatsLoading, setBeatsLoading] = useState(false)
  const [addingBeat, setAddingBeat] = useState(false)
  const [editingBeat, setEditingBeat] = useState(null)
  const [sales, setSales]           = useState([])
  const [salesLoading, setSalesLoading] = useState(false)
  const [cobrosData, setCobrosData]     = useState(null)
  const [cobrosLoading, setCobrosLoading] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [ofertas, setOfertas]           = useState([])
  const [ofertasLoading, setOfertasLoading] = useState(false)

  const activeStudio = studios.find(s => s.id === activeStudioId) ?? studios[0] ?? null

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

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

      const params = new URLSearchParams(window.location.search)
      if (params.get('connect') === 'success' || params.get('connect') === 'refresh') {
        setTab('cobros')
        window.history.replaceState({}, '', window.location.pathname)
        if (prod?.id) {
          const { data: { session: authSession } } = await supabase.auth.getSession()
          if (authSession) {
            const res = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-connect-link`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authSession.access_token}` },
                body: JSON.stringify({ producer_id: prod.id, action: 'check_status' }),
              }
            )
            const { status } = await res.json()
            if (status) setProducer(p => ({ ...p, stripe_connect_status: status }))
          }
        }
      }

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

  useEffect(() => {
    if (tab !== 'cobros' || !producer) return
    setCobrosLoading(true)
    const load = async () => {
      const { data: beatRows } = await supabase
        .from('beats').select('id').eq('producer_id', producer.id)
      const beatIds = (beatRows || []).map(b => b.id)

      let beatSales = []
      if (beatIds.length > 0) {
        const { data } = await supabase
          .from('sales')
          .select('id, beat_id, buyer_email, license_type, amount_paid, created_at, payout_transferred_at, beats(title, image_url)')
          .in('beat_id', beatIds)
          .order('created_at', { ascending: false })
        beatSales = data || []
      }

      const studioIds = studios.map(s => s.id)
      let studioBookings = []
      if (studioIds.length > 0) {
        const { data: spaceRows } = await supabase
          .from('spaces').select('id, studio_id').in('studio_id', studioIds)
        const spaceIds = (spaceRows || []).map(s => s.id)
        if (spaceIds.length > 0) {
          const { data } = await supabase
            .from('bookings')
            .select('id, client_name, start_datetime, end_datetime, amount_paid, status, payout_transferred_at, spaces(name, studio_id)')
            .in('space_id', spaceIds)
            .eq('status', 'confirmed')
            .order('start_datetime', { ascending: false })
          studioBookings = data || []
        }
      }

      const now = new Date()
      const beatsPending = beatSales
        .filter(s => !s.payout_transferred_at)
        .reduce((sum, s) => sum + ((s.amount_paid || 0) / 1.05) * 0.90, 0)
      const studiosPending = studioBookings
        .filter(b => !b.payout_transferred_at && new Date(b.end_datetime) < now)
        .reduce((sum, b) => sum + (b.amount_paid || 0) * 0.90, 0)

      setCobrosData({ beatSales, studioBookings, beatsPending, studiosPending })
      setCobrosLoading(false)
    }
    load()
  }, [tab, producer, studios])

  useEffect(() => {
    if (tab !== 'ofertas' || !producer) return
    setOfertasLoading(true)
    const load = async () => {
      const { data: beatRows } = await supabase
        .from('beats').select('id, title, image_url').eq('producer_id', producer.id)
      const beatIds = (beatRows || []).map(b => b.id)
      if (beatIds.length === 0) { setOfertas([]); setOfertasLoading(false); return }
      const { data } = await supabase
        .from('beat_offers')
        .select('id, beat_id, buyer_email, offer_amount, message, status, created_at')
        .in('beat_id', beatIds)
        .order('created_at', { ascending: false })
      const beatMap = Object.fromEntries((beatRows || []).map(b => [b.id, { title: b.title, image_url: b.image_url }]))
      setOfertas((data || []).map(o => ({ ...o, beat_title: beatMap[o.beat_id]?.title ?? '—', beat_image: beatMap[o.beat_id]?.image_url ?? null })))
      setOfertasLoading(false)
    }
    load()
  }, [tab, producer])

  useEffect(() => {
    if (tab !== 'ventas' || !producer) return
    setSalesLoading(true)
    const load = async () => {
      const { data: beatData } = await supabase
        .from('beats').select('id').eq('producer_id', producer.id)
      const beatIds = (beatData || []).map(b => b.id)
      if (beatIds.length === 0) { setSales([]); setSalesLoading(false); return }

      const { data: salesData } = await supabase
        .from('sales')
        .select('id, beat_id, buyer_email, license_type, amount_paid, created_at, beats(title, image_url)')
        .in('beat_id', beatIds)
        .order('created_at', { ascending: false })

      const emails = [...new Set((salesData || []).map(s => s.buyer_email))]
      let userMap = {}
      if (emails.length > 0) {
        const { data: userData } = await supabase
          .from('users').select('email, name, artist_name, instagram').in('email', emails)
        userMap = Object.fromEntries((userData || []).map(u => [u.email, u]))
      }
      setSales((salesData || []).map(s => ({ ...s, buyer: userMap[s.buyer_email] })))
      setSalesLoading(false)
    }
    load()
  }, [tab, producer])

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

  const filteredBookings = bookingsFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === bookingsFilter)

  const StudioSelector = () => {
    if (studios.length <= 1) return null
    return (
      <div className="flex items-center gap-3 mb-5">
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

  const handleAceptarOferta = async (oferta) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: beatData } = await supabase.from('beats').select('title, producer').eq('id', oferta.beat_id).single()
      const { data, error } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          type: 'beat',
          beatId: oferta.beat_id,
          beatTitle: beatData?.title ?? oferta.beat_title,
          licenseType: 'exclusive',
          price: oferta.offer_amount,
          producerName: producer?.name ?? '',
          customerEmail: oferta.buyer_email,
        },
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      if (error) throw error
      const checkoutUrl = data?.url
      await supabase.from('beat_offers').update({ status: 'accepted', checkout_url: checkoutUrl, updated_at: new Date().toISOString() }).eq('id', oferta.id)
      await supabase.functions.invoke('send-booking-emails', {
        body: { type: 'offer_accepted', buyer_email: oferta.buyer_email, checkout_url: checkoutUrl, beat_title: oferta.beat_title }
      })
      setOfertas(prev => prev.map(o => o.id === oferta.id ? { ...o, status: 'accepted', checkout_url: checkoutUrl } : o))
    } catch (err) {
      alert('Error al aceptar oferta: ' + err.message)
    }
  }

  const handleRechazarOferta = async (oferta) => {
    try {
      await supabase.from('beat_offers').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', oferta.id)
      setOfertas(prev => prev.map(o => o.id === oferta.id ? { ...o, status: 'rejected' } : o))
    } catch (err) {
      alert('Error al rechazar oferta: ' + err.message)
    }
  }

  const handleActivarCobros = async () => {
    setConnectLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-connect-link`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ producer_id: producer.id }),
        }
      )
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error('Stripe Connect error:', err)
      setConnectLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* ── Header ── */}
      <header className="border-b border-white/5 bg-[#050505]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <span
              onClick={() => navigate('/')}
              className="font-mono text-base sm:text-lg font-bold tracking-[0.2em] text-white cursor-pointer hover:text-accent transition-colors shrink-0"
            >
              HELICON
            </span>
            <span className="text-white/10 hidden sm:inline">|</span>
            <span className="text-[11px] font-mono text-text/50 uppercase tracking-widest hidden sm:inline">Producer</span>
            {studios.length > 0 && (
              <>
                <span className="text-white/10 hidden sm:inline">|</span>
                <span className="text-xs font-mono text-accent hidden sm:inline">
                  {studios.length} estudio{studios.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs font-mono text-accent sm:hidden">
                  {studios.length} est.
                </span>
              </>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white transition-colors shrink-0"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">

        {/* ── Tabs ── */}
        <div className="mb-5 sm:mb-7 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex gap-1 bg-white/[0.03] border border-white/5 rounded-xl p-1 w-max min-w-full sm:min-w-0 sm:w-fit">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setEditingStudio(null) }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                  tab === id
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'text-text/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Panel de contenido ── */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">

          {/* ── MI PERFIL ── */}
          {tab === 'profile' && producer && (
            <ProfileEditor producer={producer} onSaved={setProducer} navigate={navigate} />
          )}

          {/* ── MIS ESTUDIOS ── */}
          {tab === 'studio' && (
            <div>
              {editingStudio === null && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Mis Estudios</h3>
                    <button
                      onClick={() => setEditingStudio('new')}
                      className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-3 sm:px-4 py-2 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20 shrink-0"
                    >
                      <PlusCircle size={14} />
                      <span className="hidden xs:inline sm:inline">Nuevo estudio</span>
                      <span className="xs:hidden sm:hidden">Nuevo</span>
                    </button>
                  </div>

                  {studios.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                        <Building2 size={26} className="text-accent" />
                      </div>
                      <h3 className="text-white font-bold text-base sm:text-lg mb-2">Aún no tienes estudios</h3>
                      <p className="text-text/40 text-sm font-mono max-w-xs mb-6">
                        Crea tu primer estudio para que los artistas puedan encontrarte en el Radar y reservar sesiones.
                      </p>
                    </div>
                  )}

                  {studios.length > 0 && (
                    <div className="grid gap-3">
                      {studios.map(s => (
                        <div key={s.id} className="flex items-center gap-3 sm:gap-4 bg-white/[0.03] border border-white/5 rounded-xl p-3 sm:p-4 hover:border-white/10 transition-all">
                          {(s.photos?.[0] || s.image_url) ? (
                            <img
                              src={s.photos?.[0] ?? s.image_url}
                              alt={s.name}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                              <Building2 size={18} className="text-text/20" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-white font-bold text-sm">{s.name}</h4>
                              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.is_published ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-text/30 border-white/10'}`}>
                                {s.is_published ? 'Publicado' : 'Borrador'}
                              </span>
                            </div>
                            {s.city && <p className="text-text/40 text-xs font-mono mt-0.5">{s.city}</p>}
                            {s.price_per_hour && <p className="text-accent text-xs font-mono mt-0.5">{s.price_per_hour}€/h</p>}
                          </div>
                          <button
                            onClick={() => setEditingStudio(s)}
                            className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white border border-white/10 px-2.5 sm:px-3 py-1.5 rounded-lg hover:border-white/30 transition-all shrink-0"
                          >
                            <Pencil size={12} /> <span className="hidden sm:inline">Editar</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editingStudio !== null && (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest truncate">
                      {editingStudio === 'new' ? 'Nuevo Estudio' : `Editar: ${editingStudio.name}`}
                    </h3>
                    <button
                      onClick={() => setEditingStudio(null)}
                      className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white transition-colors shrink-0"
                    >
                      <ArrowLeft size={13} /> Volver
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
            <div className="space-y-5">
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
              {!addingBeat && !editingBeat ? (
                <>
                  {/* Toggle etiquetado */}
                  <div className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-white text-xs font-mono font-bold">Consentimiento de mención en plataformas</p>
                      <p className="text-text/40 text-[10px] font-mono mt-1 leading-relaxed">
                        Autorizo a los compradores a etiquetarme como colaborador en Spotify, YouTube Music y otras plataformas de streaming.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const newVal = !producer.allows_tagging
                        await supabase.from('producers').update({ allows_tagging: newVal }).eq('id', producer.id)
                        setProducer(p => ({ ...p, allows_tagging: newVal }))
                      }}
                      className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none mt-0.5 ${producer.allows_tagging ? 'bg-accent' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${producer.allows_tagging ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Mis Beats</h3>
                    <button
                      onClick={() => setAddingBeat(true)}
                      className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-3 sm:px-4 py-2 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20 shrink-0"
                    >
                      <PlusCircle size={14} /> Subir Beat
                    </button>
                  </div>

                  {beatsLoading && <p className="text-text/30 text-xs font-mono text-center py-12">Cargando…</p>}

                  {!beatsLoading && beats.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                        <Music2 size={26} className="text-accent" />
                      </div>
                      <h3 className="text-white font-bold text-base sm:text-lg mb-2">Aún no tienes beats</h3>
                      <p className="text-text/40 text-sm font-mono max-w-xs">Sube tu primer beat para que los artistas puedan descubrirlo en el Beat Market.</p>
                    </div>
                  )}

                  {!beatsLoading && beats.length > 0 && (
                    <div className="space-y-2">
                      {beats.map(beat => (
                        <div key={beat.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            {beat.image_url ? (
                              <img src={beat.image_url} alt={beat.title} className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                            ) : (
                              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                                <Music2 size={18} className="text-accent/50" />
                              </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              {/* Title row */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-white font-bold text-sm truncate">{beat.title}</h4>
                                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${beat.is_published ? 'bg-accent/15 text-accent border-accent/30' : 'bg-white/5 text-text/30 border-white/10'}`}>
                                      {beat.is_published ? 'Publicado' : 'Oculto'}
                                    </span>
                                  </div>
                                  <p className="text-text/40 text-[11px] font-mono mt-0.5">
                                    {[beat.genre, beat.mood, beat.bpm && `${beat.bpm} BPM`, beat.key].filter(Boolean).join(' · ')}
                                  </p>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => setEditingBeat(beat)}
                                    className="text-text/30 hover:text-white transition-colors p-1"
                                    title="Editar"
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      await supabase.from('beats').update({ is_published: !beat.is_published }).eq('id', beat.id)
                                      setBeats(prev => prev.map(b => b.id === beat.id ? { ...b, is_published: !b.is_published } : b))
                                    }}
                                    className="text-text/30 hover:text-white transition-colors p-1"
                                    title={beat.is_published ? 'Ocultar' : 'Publicar'}
                                  >
                                    {beat.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('¿Eliminar este beat?')) return
                                      await supabase.from('beats').delete().eq('id', beat.id)
                                      setBeats(prev => prev.filter(b => b.id !== beat.id))
                                    }}
                                    className="text-text/30 hover:text-red-400 transition-colors p-1"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Price badges */}
                              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                {[
                                  { label: 'Basic',     price: beat.price_basic,     color: 'text-accent border-accent/30 bg-accent/10' },
                                  { label: 'Premium',   price: beat.price_premium,   color: 'text-purple-300 border-purple-400/30 bg-purple-400/10' },
                                  { label: 'Exclusive', price: beat.price_exclusive, color: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10' },
                                  { label: 'Stems',     price: beat.price_stems,     color: 'text-green-400 border-green-500/30 bg-green-500/10' },
                                ].map(({ label, price, color }) => (
                                  <span key={label} className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${color}`}>
                                    {label} {price != null ? `${price}€` : '—'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest truncate">
                      {editingBeat ? `Editar: ${editingBeat.title}` : 'Subir Beat'}
                    </h3>
                    <button onClick={() => { setAddingBeat(false); setEditingBeat(null) }} className="flex items-center gap-1.5 text-text/40 text-xs font-mono hover:text-white transition-colors shrink-0">
                      <ArrowLeft size={13} /> Volver
                    </button>
                  </div>
                  <BeatForm
                    producerId={producer?.id}
                    beat={editingBeat}
                    onSaved={(savedBeat) => {
                      setBeats(prev => {
                        const exists = prev.find(b => b.id === savedBeat.id)
                        if (exists) return prev.map(b => b.id === savedBeat.id ? savedBeat : b)
                        return [savedBeat, ...prev]
                      })
                      setAddingBeat(false)
                      setEditingBeat(null)
                    }}
                    onCancel={() => { setAddingBeat(false); setEditingBeat(null) }}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── RESERVAS ── */}
          {tab === 'bookings' && (
            <div className="space-y-4">
              <StudioSelector />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Reservas</h3>
                <div className="flex gap-1 flex-wrap">
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

              {/* Mobile cards */}
              {!bookingsLoading && filteredBookings.length > 0 && (
                <>
                  <div className="space-y-2 sm:hidden">
                    {filteredBookings.map(b => {
                      const start = new Date(b.start_datetime)
                      const dateStr = start.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric' })
                      const timeStr = start.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
                      return (
                        <div key={b.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white text-sm font-mono font-bold truncate">{b.client_name}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider shrink-0 ${STATUS_BADGE[b.status] ?? STATUS_BADGE.cancelled}`}>
                              {STATUS_LABELS[b.status] ?? b.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-mono text-text/50">
                            <span>{dateStr} · {timeStr}</span>
                            {b.spaces?.name && <span className="truncate">{b.spaces.name}</span>}
                          </div>
                          {b.amount_paid && (
                            <span className="text-accent font-bold text-sm font-mono">{b.amount_paid}€</span>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto">
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
                            <tr key={b.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
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
                </>
              )}
            </div>
          )}

          {/* ── VENTAS ── */}
          {tab === 'ventas' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Ventas de Beats</h3>

              {salesLoading && <p className="text-text/30 text-xs font-mono text-center py-12">Cargando…</p>}

              {!salesLoading && sales.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                    <ShoppingBag size={26} className="text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-2">Aún no hay ventas</h3>
                  <p className="text-text/40 text-sm font-mono max-w-xs">Cuando un artista compre uno de tus beats aparecerá aquí.</p>
                </div>
              )}

              {!salesLoading && sales.length > 0 && (
                <div className="space-y-2">
                  {sales.map(sale => {
                    const licenseColors = {
                      basic:     'text-accent border-accent/30 bg-accent/10',
                      premium:   'text-purple-300 border-purple-400/30 bg-purple-400/10',
                      exclusive: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
                    }
                    const licenseLabel = { basic: 'Basic', premium: 'Premium', exclusive: 'Exclusive' }
                    const color = licenseColors[sale.license_type] ?? licenseColors.basic
                    const buyerName = sale.buyer?.artist_name || sale.buyer?.name || sale.buyer_email
                    const ig = sale.buyer?.instagram

                    return (
                      <div key={sale.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-all">
                        <div className="flex items-start gap-3">
                          {/* Thumbnail */}
                          {sale.beats?.image_url ? (
                            <img src={sale.beats.image_url} alt={sale.beats?.title} className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                              <Music2 size={18} className="text-accent/50" />
                            </div>
                          )}

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-bold text-sm truncate">{sale.beats?.title ?? '—'}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-text/50 text-[11px] font-mono truncate">{buyerName}</span>
                                  {ig && (
                                    <a
                                      href={ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace('@','')}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors shrink-0"
                                    >
                                      IG @{getIgHandle(ig)}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border ${color}`}>
                                  {licenseLabel[sale.license_type] ?? sale.license_type}
                                </span>
                                <span className="text-white font-bold text-sm font-mono">
                                  {sale.amount_paid != null ? `${sale.amount_paid}€` : '—'}
                                </span>
                              </div>
                            </div>
                            <p className="text-text/30 text-[10px] font-mono mt-1.5">
                              {new Date(sale.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── OFERTAS ── */}
          {tab === 'ofertas' && (
            <div className="space-y-4">
              <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Ofertas Exclusive</h3>

              {ofertasLoading && <p className="text-text/30 text-xs font-mono text-center py-12">Cargando…</p>}

              {!ofertasLoading && ofertas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-5">
                    <Tag size={26} className="text-accent" />
                  </div>
                  <h3 className="text-white font-bold text-base sm:text-lg mb-2">Sin ofertas aún</h3>
                  <p className="text-text/40 text-sm font-mono max-w-xs">Cuando un artista haga una oferta por una licencia Exclusive aparecerá aquí.</p>
                </div>
              )}

              {!ofertasLoading && ofertas.length > 0 && (
                <div className="space-y-2">
                  {ofertas.map(oferta => {
                    const statusStyle = {
                      pending:  'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
                      accepted: 'text-green-400 border-green-400/30 bg-green-400/10',
                      rejected: 'text-red-400 border-red-400/30 bg-red-400/10',
                    }[oferta.status] ?? ''
                    const statusLabel = { pending: 'Pendiente', accepted: 'Aceptada', rejected: 'Rechazada' }[oferta.status]
                    return (
                      <div key={oferta.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 sm:p-4 hover:border-white/10 transition-all space-y-3">
                        <div className="flex items-start gap-3">
                          {oferta.beat_image ? (
                            <img src={oferta.beat_image} alt={oferta.beat_title} className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                          ) : (
                            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                              <Music2 size={18} className="text-accent/50" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-bold text-sm truncate">{oferta.beat_title}</p>
                                <p className="text-text/50 text-[11px] font-mono mt-0.5 truncate">{oferta.buyer_email}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-white font-bold text-sm font-mono">{oferta.offer_amount}€</span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusStyle}`}>{statusLabel}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {oferta.message && (
                          <p className="text-white/50 text-xs font-mono bg-white/[0.03] rounded-lg px-3 py-2 border border-white/5">"{oferta.message}"</p>
                        )}

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-text/30 text-[10px] font-mono">
                            {new Date(oferta.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          {oferta.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRechazarOferta(oferta)}
                                className="font-mono text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                Rechazar
                              </button>
                              <button
                                onClick={() => handleAceptarOferta(oferta)}
                                className="font-mono text-xs px-3 py-1.5 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors"
                              >
                                Aceptar
                              </button>
                            </div>
                          )}
                          {oferta.status === 'accepted' && oferta.checkout_url && (
                            <a href={oferta.checkout_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-accent hover:underline">
                              Ver link de pago
                            </a>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── COBROS ── */}
          {tab === 'cobros' && producer && (
            <div className="space-y-5">
              {/* Cabecera + estado */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Cobros</h3>
                {producer.stripe_connect_status === 'active' && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border bg-green-500/10 text-green-400 border-green-500/30">Cuenta activa ✓</span>
                )}
                {producer.stripe_connect_status === 'pending' && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border bg-yellow-500/10 text-yellow-400 border-yellow-500/30">Verificación en curso…</span>
                )}
                {producer.stripe_connect_status === 'not_connected' && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border bg-white/5 text-text/40 border-white/10">Sin conectar</span>
                )}
              </div>

              {/* Bloque de acción si no está activo */}
              {producer.stripe_connect_status !== 'active' && (
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 sm:p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet size={18} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm mb-1">
                      {producer.stripe_connect_status === 'pending'
                        ? 'Completa la verificación para recibir pagos'
                        : 'Conecta tu cuenta bancaria para recibir pagos'}
                    </p>
                    <p className="text-text/40 text-xs font-mono mb-4 leading-relaxed">
                      {producer.stripe_connect_status === 'pending'
                        ? 'Stripe necesita más información para activar tu cuenta. Haz clic en el botón para continuar.'
                        : 'Conecta tu IBAN vía Stripe. El proceso tarda 3-5 minutos y solo se hace una vez. Tu saldo acumulado se transferirá automáticamente.'}
                    </p>
                    <button
                      onClick={handleActivarCobros}
                      disabled={connectLoading}
                      className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20 disabled:opacity-60"
                    >
                      {connectLoading
                        ? <><Loader size={13} className="animate-spin" /> Cargando…</>
                        : producer.stripe_connect_status === 'pending' ? 'Continuar verificación →' : 'Activar cobros →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Botones si está activo */}
              {producer.stripe_connect_status === 'active' && (
                <div className="flex items-center gap-3 flex-wrap">
                  {cobrosData && (cobrosData.beatsPending > 0 || cobrosData.studiosPending > 0) && (
                    <button
                      onClick={async () => {
                        setConnectLoading(true)
                        try {
                          const { data: { session: s } } = await supabase.auth.getSession()
                          await fetch(
                            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payouts`,
                            {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s.access_token}` },
                              body: JSON.stringify({ producer_id: producer.id }),
                            }
                          )
                          setCobrosData(null)
                          setTab('cobros')
                        } finally {
                          setConnectLoading(false)
                        }
                      }}
                      disabled={connectLoading}
                      className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20 disabled:opacity-60"
                    >
                      {connectLoading ? <><Loader size={13} className="animate-spin" /> Procesando…</> : <><Wallet size={13} /> Retirar fondos</>}
                    </button>
                  )}
                  <button
                    onClick={handleActivarCobros}
                    disabled={connectLoading}
                    className="flex items-center gap-2 text-text/50 font-mono text-xs px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 hover:text-white transition-all disabled:opacity-60"
                  >
                    {connectLoading ? <><Loader size={12} className="animate-spin" /> Cargando…</> : <><ExternalLink size={12} /> Gestionar cuenta Stripe</>}
                  </button>
                </div>
              )}

              {cobrosLoading && <p className="text-text/30 text-xs font-mono text-center py-8">Cargando…</p>}

              {!cobrosLoading && cobrosData && (
                <>
                  {/* ── Beats ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Music2 size={14} className="text-accent" />
                        <span className="text-white font-bold text-xs font-mono uppercase tracking-widest">Beats</span>
                      </div>
                      {cobrosData.beatsPending > 0 && (
                        <span className="text-accent font-bold text-sm font-mono">{cobrosData.beatsPending.toFixed(2)}€ pendiente</span>
                      )}
                    </div>

                    {cobrosData.beatSales.length === 0 && (
                      <p className="text-text/20 text-xs font-mono py-4 text-center">No hay ventas de beats aún</p>
                    )}

                    {cobrosData.beatSales.length > 0 && (
                      <div className="space-y-1.5">
                        {cobrosData.beatSales.map(sale => {
                          const licenseColors = {
                            basic:     'text-accent border-accent/30 bg-accent/10',
                            premium:   'text-purple-300 border-purple-400/30 bg-purple-400/10',
                            exclusive: 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
                            stems:     'text-green-400 border-green-500/30 bg-green-500/10',
                          }
                          const paid = !!sale.payout_transferred_at
                          return (
                            <div key={sale.id} className="flex items-center gap-2 sm:gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3 sm:px-4 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-mono truncate">{sale.beats?.title ?? '—'}</p>
                                <p className="text-text/30 text-[10px] font-mono mt-0.5">
                                  {new Date(sale.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border shrink-0 ${licenseColors[sale.license_type] ?? licenseColors.basic}`}>
                                {sale.license_type}
                              </span>
                              <span className="text-white text-xs font-mono font-bold shrink-0 text-right min-w-[52px]">
                                {sale.amount_paid != null ? `${((sale.amount_paid / 1.05) * 0.90).toFixed(2)}€` : '—'}
                              </span>
                              <span className={`text-[10px] font-mono shrink-0 text-right min-w-[64px] ${paid ? 'text-green-400' : 'text-yellow-400'}`}>
                                {paid ? 'transferido ✓' : 'pendiente'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Estudios ── */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-accent" />
                        <span className="text-white font-bold text-xs font-mono uppercase tracking-widest">Estudios</span>
                      </div>
                      {cobrosData.studiosPending > 0 && (
                        <span className="text-accent font-bold text-sm font-mono">{cobrosData.studiosPending.toFixed(2)}€ pendiente</span>
                      )}
                    </div>

                    {cobrosData.studioBookings.length === 0 && (
                      <p className="text-text/20 text-xs font-mono py-4 text-center">No hay reservas confirmadas aún</p>
                    )}

                    {cobrosData.studioBookings.length > 0 && (
                      <div className="space-y-1.5">
                        {cobrosData.studioBookings.map(booking => {
                          const now = new Date()
                          const ended = new Date(booking.end_datetime) < now
                          const paid = !!booking.payout_transferred_at
                          const statusLabel = paid ? 'transferido ✓' : ended ? 'pendiente' : 'por ocurrir'
                          const statusColor = paid ? 'text-green-400' : ended ? 'text-yellow-400' : 'text-text/40'
                          const dateStr = new Date(booking.start_datetime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                          return (
                            <div key={booking.id} className="flex items-center gap-2 sm:gap-3 bg-white/[0.02] border border-white/5 rounded-xl px-3 sm:px-4 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-mono truncate">{booking.client_name}</p>
                                <p className="text-text/30 text-[10px] font-mono mt-0.5">{dateStr} · {booking.spaces?.name ?? '—'}</p>
                              </div>
                              <span className="text-white text-xs font-mono font-bold shrink-0 text-right min-w-[52px]">
                                {booking.amount_paid != null ? `${(booking.amount_paid * 0.90).toFixed(2)}€` : '—'}
                              </span>
                              <span className={`text-[10px] font-mono shrink-0 text-right min-w-[64px] ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
