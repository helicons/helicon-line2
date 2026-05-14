import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { ShieldCheck, Clock, MapPin, Banknote, CreditCard, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from './lib/supabase'

export default function BookingPage() {
  const { id: bookingId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState(null)

  const paid = params.get('paid') === 'true'
  const cancelled = params.get('cancelled') === 'true'

  useEffect(() => {
    const fetch = async () => {
      const { data, error: err } = await supabase
        .from('bookings')
        .select(`
          id, status, payment_method, client_name, client_email, amount_paid,
          start_datetime, end_datetime, stripe_session_id,
          spaces ( name, price_per_hour,
            studios ( name, address, city,
              producers ( name )
            )
          )
        `)
        .eq('id', bookingId)
        .single()
      if (err || !data) setError('Reserva no encontrada.')
      else setBooking(data)
      setLoading(false)
    }
    fetch()
  }, [bookingId])

  const handlePay = async () => {
    if (!booking) return
    setPaying(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data, error: fnErr } = await supabase.functions.invoke('create-stripe-checkout', {
        body: {
          type: 'studio',
          studioName: booking.spaces?.studios?.name,
          bookingId: booking.id,
          totalPrice: totalPrice,
          customerEmail: booking.client_email,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      })
      if (fnErr) throw fnErr
      if (data?.url) window.location.href = data.url
    } catch (err) {
      console.error(err)
      setError('Error al iniciar el pago. Inténtalo de nuevo.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-white/40 font-mono text-sm">{error ?? 'Reserva no encontrada.'}</p>
        <button onClick={() => navigate('/')} className="text-accent font-mono text-xs hover:underline">
          Volver al inicio
        </button>
      </div>
    )
  }

  const space = booking.spaces
  const studio = space?.studios
  const startDate = new Date(booking.start_datetime)
  const endDate = new Date(booking.end_datetime)
  const hours = Math.round((endDate - startDate) / 3600000)
  const pricePerHour = Number(space?.price_per_hour ?? 0)
  const totalPrice = booking.amount_paid ?? (pricePerHour * hours)

  const dateStr = startDate.toLocaleDateString('es-ES', {
    timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
  const timeStr = startDate.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })
  const endTimeStr = endDate.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' })

  const isCash = booking.payment_method === 'cash'
  const isConfirmed = booking.status === 'confirmed'
  const isPendingReview = booking.status === 'pending_review'
  const isPendingPayment = booking.status === 'pending'
  const isRejected = booking.status === 'rejected'
  const isCancelled = booking.status === 'cancelled'

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-white/30 hover:text-white font-mono text-xs mb-8 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
        </button>

        <div className="text-center mb-2">
          <span className="font-heading text-3xl font-bold text-white tracking-wide">HELICON</span>
        </div>
        <p className="text-center font-mono text-[10px] text-white/20 uppercase tracking-widest mb-8">Resumen de reserva</p>

        {/* Status banner */}
        {(paid || isConfirmed) && !isCash && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
            <p className="font-mono text-xs text-green-400">Reserva confirmada y pagada. ¡Nos vemos!</p>
          </div>
        )}
        {isConfirmed && isCash && (
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-6">
            <Banknote className="w-5 h-5 text-green-400 shrink-0" />
            <p className="font-mono text-xs text-green-400">Reserva confirmada. Lleva el efectivo el día de la sesión.</p>
          </div>
        )}
        {isPendingReview && (
          <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 mb-6">
            <Clock className="w-5 h-5 text-orange-400 shrink-0" />
            <p className="font-mono text-xs text-orange-400">Solicitud enviada. El estudio la está revisando.</p>
          </div>
        )}
        {isPendingPayment && !paid && !cancelled && (
          <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 mb-6">
            <CreditCard className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="font-mono text-xs text-yellow-400">Reserva aceptada. Completa el pago para confirmarla.</p>
          </div>
        )}
        {cancelled && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
            <p className="font-mono text-xs text-red-400">El pago fue cancelado. Puedes intentarlo de nuevo.</p>
          </div>
        )}
        {isRejected && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6">
            <p className="font-mono text-xs text-red-400">El estudio no puede aceptar esta reserva. Prueba otro horario.</p>
          </div>
        )}
        {isCancelled && !cancelled && (
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
            <p className="font-mono text-xs text-white/40">Esta reserva ha expirado o fue cancelada.</p>
          </div>
        )}

        {/* Booking details card */}
        <div className="bg-[#0c0c0c] border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-white/5">
            <p className="font-mono text-[10px] text-accent/70 uppercase tracking-widest mb-1">{studio?.name}</p>
            <h2 className="font-heading text-xl font-bold text-white">{space?.name ?? 'Sesión de grabación'}</h2>
            {(studio?.address || studio?.city) && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin className="w-3 h-3 text-white/20" />
                <span className="font-mono text-[11px] text-white/30">{studio.address || studio.city}</span>
              </div>
            )}
          </div>

          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px] text-white/40">Fecha</span>
              <span className="font-mono text-[11px] text-white capitalize">{dateStr}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px] text-white/40">Hora</span>
              <span className="font-mono text-[11px] text-white">{timeStr} – {endTimeStr} ({hours}h)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px] text-white/40">Artista</span>
              <span className="font-mono text-[11px] text-white">{booking.client_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[11px] text-white/40">Pago</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-white">
                {isCash
                  ? <><Banknote className="w-3 h-3 text-accent" /> Efectivo</>
                  : <><CreditCard className="w-3 h-3 text-accent" /> Tarjeta</>
                }
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-white/5">
              <span className="font-mono text-[11px] text-white/40 uppercase tracking-widest">Total</span>
              <span className="font-heading font-bold text-2xl text-white">{totalPrice.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        {isPendingPayment && !paid && (
          <button
            onClick={handlePay}
            disabled={paying}
            className="w-full py-5 rounded-xl bg-accent text-white font-mono font-bold uppercase tracking-widest hover:bg-[#9d3df2] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(138,43,226,0.3)] mb-3"
          >
            {paying ? <Loader2 className="inline w-4 h-4 animate-spin mr-2" /> : null}
            {paying ? 'Redirigiendo...' : `Pagar ${totalPrice.toFixed(2)}€`}
          </button>
        )}

        {(isRejected || isCancelled) && (
          <button
            onClick={() => navigate('/book-studio')}
            className="w-full py-4 rounded-xl border border-accent/30 text-accent font-mono font-bold uppercase tracking-widest hover:bg-accent/10 transition-all"
          >
            Ver disponibilidad
          </button>
        )}

        {isPendingReview && (
          <p className="text-center font-mono text-[10px] text-white/20 mt-4">
            Te notificaremos por email cuando el estudio responda.
          </p>
        )}

        {(isConfirmed || paid) && (
          <button
            onClick={() => navigate('/')}
            className="w-full py-4 rounded-xl border border-white/10 text-white/50 font-mono text-xs font-bold uppercase tracking-widest hover:border-accent/30 hover:text-white transition-all"
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  )
}
