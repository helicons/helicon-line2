import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  const offset = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function SlotPicker({
  spaceId,
  clientName,
  clientEmail,
  onSlotSelected,
  pricePerHour = 0,
  minDuration = 1,
  maxDuration = 4,
}) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [slots, setSlots] = useState([])               // ["10:00", "11:00", ...]
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null) // hora de inicio elegida
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState(null)

  const calendarDays = buildCalendarDays(currentYear, currentMonth)
  const todayStr = toDateString(today)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null); setSlots([]); setSelectedSlot(null); setError(null)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null); setSlots([]); setSelectedSlot(null); setError(null)
  }

  const fetchSlots = useCallback(async (dateStr) => {
    if (!spaceId) return
    setLoadingSlots(true); setSlots([]); setSelectedSlot(null); setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-available-slots', {
        body: { space_id: spaceId, date: dateStr },
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
      })
      if (fnError) throw fnError
      setSlots(data?.slots ?? [])
    } catch (err) {
      console.error('Error cargando slots:', err)
      setError('No se pudo cargar la disponibilidad. Inténtalo de nuevo.')
    } finally {
      setLoadingSlots(false)
    }
  }, [spaceId])

  const handleDayClick = (day) => {
    if (!day) return
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (dateStr < todayStr) return
    setSelectedDate(dateStr)
    fetchSlots(dateStr)
  }

  // Calcula cuántas horas consecutivas están disponibles a partir de un slot
  const maxConsecutive = (startSlot) => {
    const startHour = parseInt(startSlot.split(':')[0])
    let count = 0
    for (let h = startHour; h < startHour + maxDuration; h++) {
      if (slots.includes(formatHour(h))) count++
      else break
    }
    return count
  }

  const handleConfirm = async (durationHours) => {
    if (!selectedDate || !selectedSlot || !spaceId) return
    const slotHour = parseInt(selectedSlot.split(':')[0])
    setConfirming(true); setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-pending-booking', {
        body: {
          space_id: spaceId,
          client_name: clientName,
          client_email: clientEmail,
          date: selectedDate,
          slot_hour: slotHour,
          duration_hours: durationHours,
        },
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
      })
      if (fnError) throw fnError
      if (data?.error === 'SLOT_TAKEN') {
        setError('Este horario acaba de ser reservado. Elige otro.')
        fetchSlots(selectedDate)
        setSelectedSlot(null)
        return
      }
      if (!data?.booking_id) throw new Error('No se recibió booking_id')
      onSlotSelected({
        date: selectedDate,
        slot: selectedSlot,
        durationHours,
        bookingId: data.booking_id,
        totalAmount: pricePerHour * durationHours,
      })
    } catch (err) {
      if (err?.message?.includes('SLOT_TAKEN')) {
        setError('Este horario acaba de ser reservado. Elige otro.')
        fetchSlots(selectedDate)
        setSelectedSlot(null)
      } else {
        console.error('Error creando reserva:', err)
        setError('Error al reservar el slot. Inténtalo de nuevo.')
      }
    } finally {
      setConfirming(false)
    }
  }

  const canGoPrev = !(currentYear === today.getFullYear() && currentMonth === today.getMonth())

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cabecera del calendario */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors">
          <ChevronLeft size={18} className="text-text" />
        </button>
        <span className="font-mono text-sm font-bold text-white tracking-widest uppercase">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronRight size={18} className="text-text" />
        </button>
      </div>

      {/* Grid días */}
      <div className="grid grid-cols-7 gap-1">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
          <div key={d} className="text-center text-[10px] font-mono text-text/40 uppercase tracking-widest py-1">{d}</div>
        ))}
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast = dateStr < todayStr
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr
          return (
            <button key={dateStr} onClick={() => handleDayClick(day)} disabled={isPast}
              className={[
                'aspect-square flex items-center justify-center rounded-lg text-sm font-mono transition-all',
                isPast && 'opacity-25 pointer-events-none text-text/40',
                isSelected && 'bg-accent text-white font-bold shadow-lg shadow-accent/30',
                isToday && !isSelected && 'border border-accent/50 text-accent',
                !isPast && !isSelected && !isToday && 'hover:bg-white/10 text-text cursor-pointer',
              ].filter(Boolean).join(' ')}>
              {day}
            </button>
          )
        })}
      </div>

      {/* Sección de slots / duración */}
      {selectedDate && (
        <div className="border-t border-white/5 pt-5 space-y-4">

          {/* — PASO A: elegir hora de inicio — */}
          {!selectedSlot && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-accent" />
                <span className="text-xs font-mono text-text/60 uppercase tracking-widest">
                  Hora de inicio
                </span>
              </div>

              {loadingSlots && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="text-accent animate-spin" />
                </div>
              )}

              {!loadingSlots && slots.length === 0 && !error && (
                <p className="text-sm text-text/40 font-mono text-center py-6">
                  No hay horas disponibles para este día
                </p>
              )}

              {!loadingSlots && slots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button key={slot} onClick={() => setSelectedSlot(slot)}
                      className="py-2.5 px-3 rounded-lg text-sm font-mono border border-white/10 text-text hover:bg-accent/20 hover:border-accent/50 hover:text-white transition-all">
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* — PASO B: elegir duración — */}
          {selectedSlot && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-accent" />
                  <span className="text-xs font-mono text-text/60 uppercase tracking-widest">
                    Duración · inicio {selectedSlot}
                  </span>
                </div>
                <button onClick={() => setSelectedSlot(null)}
                  className="flex items-center gap-1 text-[10px] font-mono text-text/40 hover:text-white transition-colors">
                  <ArrowLeft size={11} /> cambiar hora
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: maxDuration - minDuration + 1 }, (_, i) => i + minDuration).map(hours => {
                  const startHour = parseInt(selectedSlot.split(':')[0])
                  const endHour = startHour + hours
                  const available = maxConsecutive(selectedSlot) >= hours
                  const total = pricePerHour * hours

                  return (
                    <button key={hours} onClick={() => available && handleConfirm(hours)}
                      disabled={!available || confirming}
                      className={[
                        'flex flex-col items-start gap-1 p-3 rounded-xl border font-mono transition-all text-left',
                        available && !confirming
                          ? 'border-white/10 hover:border-accent/50 hover:bg-accent/10 cursor-pointer'
                          : 'border-white/5 opacity-30 cursor-not-allowed',
                      ].join(' ')}>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-bold text-white">
                          {hours}h
                        </span>
                        {total > 0 && (
                          <span className="text-accent text-sm font-bold">{total}€</span>
                        )}
                      </div>
                      <span className="text-[10px] text-text/40">
                        {selectedSlot} → {formatHour(endHour)}
                      </span>
                      {!available && (
                        <span className="text-[9px] text-red-400/60">No disponible</span>
                      )}
                      {confirming && available && (
                        <Loader2 size={10} className="animate-spin text-accent" />
                      )}
                    </button>
                  )
                })}
              </div>

              {pricePerHour > 0 && (
                <p className="text-[10px] font-mono text-text/20 text-center">
                  {pricePerHour}€/hora · IVA no incluido
                </p>
              )}
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <p className="text-xs font-mono text-red-400">{error}</p>
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <p className="text-xs font-mono text-text/30 text-center">
          Selecciona un día para ver los huecos disponibles
        </p>
      )}
    </div>
  )
}
