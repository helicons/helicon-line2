import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// Devuelve "YYYY-MM-DD" sin problemas de zona horaria
function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Genera array de días del mes (con nulls para alinear la semana)
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay() // 0=domingo
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  // Offset: mover domingo al final (semana empieza en lunes)
  const offset = firstDay === 0 ? 6 : firstDay - 1
  for (let i = 0; i < offset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

export default function SlotPicker({ spaceId, clientName, clientEmail, onSlotSelected }) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)   // "YYYY-MM-DD"
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingSlot, setBookingSlot] = useState(null)     // slot en proceso de reserva
  const [error, setError] = useState(null)

  const calendarDays = buildCalendarDays(currentYear, currentMonth)
  const todayStr = toDateString(today)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
    setSelectedDate(null)
    setSlots([])
    setError(null)
  }

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
    setSelectedDate(null)
    setSlots([])
    setError(null)
  }

  const fetchSlots = useCallback(async (dateStr) => {
    if (!spaceId) return
    setLoadingSlots(true)
    setSlots([])
    setError(null)
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
    if (dateStr < todayStr) return // día pasado
    setSelectedDate(dateStr)
    fetchSlots(dateStr)
  }

  const handleSlotClick = async (slot) => {
    if (!selectedDate || !spaceId) return
    const slotHour = parseInt(slot.split(':')[0])
    setBookingSlot(slot)
    setError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-pending-booking', {
        body: {
          space_id: spaceId,
          client_name: clientName,
          client_email: clientEmail,
          date: selectedDate,
          slot_hour: slotHour,
          duration_hours: 1,
        },
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` }
      })
      if (fnError) throw fnError
      if (data?.error === 'SLOT_TAKEN') {
        setError('Este horario acaba de ser reservado. Elige otro.')
        fetchSlots(selectedDate) // refrescar slots
        return
      }
      if (!data?.booking_id) throw new Error('No se recibió booking_id')
      onSlotSelected({ date: selectedDate, slot, bookingId: data.booking_id })
    } catch (err) {
      if (err?.message?.includes('SLOT_TAKEN')) {
        setError('Este horario acaba de ser reservado. Elige otro.')
        fetchSlots(selectedDate)
      } else {
        console.error('Error creando reserva:', err)
        setError('Error al reservar el slot. Inténtalo de nuevo.')
      }
    } finally {
      setBookingSlot(null)
    }
  }

  // No permitir navegar a meses anteriores al actual
  const canGoPrev = !(currentYear === today.getFullYear() && currentMonth === today.getMonth())

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Cabecera del calendario */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft size={18} className="text-text" />
        </button>
        <span className="font-mono text-sm font-bold text-white tracking-widest uppercase">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <ChevronRight size={18} className="text-text" />
        </button>
      </div>

      {/* Grid días de la semana */}
      <div className="grid grid-cols-7 gap-1">
        {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'].map(d => (
          <div key={d} className="text-center text-[10px] font-mono text-text/40 uppercase tracking-widest py-1">
            {d}
          </div>
        ))}

        {calendarDays.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast = dateStr < todayStr
          const isSelected = dateStr === selectedDate
          const isToday = dateStr === todayStr

          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              disabled={isPast}
              className={[
                'aspect-square flex items-center justify-center rounded-lg text-sm font-mono transition-all',
                isPast && 'opacity-25 pointer-events-none text-text/40',
                isSelected && 'bg-accent text-white font-bold shadow-lg shadow-accent/30',
                isToday && !isSelected && 'border border-accent/50 text-accent',
                !isPast && !isSelected && !isToday && 'hover:bg-white/10 text-text cursor-pointer',
              ].filter(Boolean).join(' ')}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Sección de slots */}
      {selectedDate && (
        <div className="border-t border-white/5 pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="text-accent" />
            <span className="text-xs font-mono text-text/60 uppercase tracking-widest">
              Horas disponibles
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
              {slots.map(slot => {
                const isBooking = bookingSlot === slot
                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    disabled={bookingSlot !== null}
                    className={[
                      'py-2.5 px-3 rounded-lg text-sm font-mono border transition-all',
                      'border-white/10 text-text hover:bg-accent/20 hover:border-accent/50 hover:text-white',
                      bookingSlot !== null && 'opacity-50 pointer-events-none',
                      isBooking && 'bg-accent/20 border-accent animate-pulse',
                    ].filter(Boolean).join(' ')}
                  >
                    {isBooking ? (
                      <span className="flex items-center justify-center gap-1">
                        <Loader2 size={12} className="animate-spin" />
                        {slot}
                      </span>
                    ) : slot}
                  </button>
                )
              })}
            </div>
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
