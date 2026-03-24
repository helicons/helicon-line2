import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const TIMEZONE = 'Europe/Madrid'

function toLocalDateStr(isoString) {
  return new Date(isoString).toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
}

function toLocalTimeStr(isoString) {
  return new Date(isoString).toLocaleTimeString('es-ES', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
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

const STATUS_COLORS = { confirmed: 'bg-accent/80', pending: 'bg-yellow-500/60', cancelled: 'bg-white/10' }
const STATUS_LABELS = { confirmed: 'Confirmada', pending: 'Pendiente', cancelled: 'Cancelada' }

export default function ProducerCalendar({ studioId }) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [bookings, setBookings] = useState([])
  const [selected, setSelected] = useState(null)  // booking seleccionado para modal

  useEffect(() => {
    if (!studioId) return
    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endOfMonth = new Date(year, month + 1, 0).toISOString().split('T')[0]

    supabase
      .from('bookings')
      .select(`id, client_name, client_email, start_datetime, end_datetime, status, amount_paid, spaces(name, studio_id)`)
      .gte('start_datetime', startOfMonth)
      .lte('start_datetime', endOfMonth + 'T23:59:59Z')
      .neq('status', 'cancelled')
      .then(({ data }) => {
        // Filtrar por studio_id
        const filtered = (data ?? []).filter(b => b.spaces?.studio_id === studioId)
        setBookings(filtered)
      })
  }, [year, month, studioId])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const calendarDays = buildCalendarDays(year, month)

  const bookingsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return bookings.filter(b => toLocalDateStr(b.start_datetime) === dateStr)
  }

  return (
    <div>
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft size={18} className="text-text" /></button>
        <span className="font-mono text-sm font-bold text-white tracking-widest uppercase">{MONTH_NAMES[month]} {year}</span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ChevronRight size={18} className="text-text" /></button>
      </div>

      {/* Grid días de semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Lu','Ma','Mi','Ju','Vi','Sá','Do'].map(d => (
          <div key={d} className="text-center text-[10px] font-mono text-text/30 uppercase tracking-widest py-1">{d}</div>
        ))}
      </div>

      {/* Grid días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const todayStr = today.toLocaleDateString('sv-SE', { timeZone: TIMEZONE })
          const isToday = dateStr === todayStr
          const dayBookings = bookingsForDay(day)

          return (
            <div key={dateStr} className={`min-h-[64px] p-1 rounded-lg border transition-colors ${isToday ? 'border-accent/40 bg-accent/5' : 'border-white/5 hover:border-white/10'}`}>
              <div className={`text-[11px] font-mono mb-1 text-right ${isToday ? 'text-accent font-bold' : 'text-text/40'}`}>{day}</div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelected(b)}
                    className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-mono text-white truncate ${STATUS_COLORS[b.status] ?? 'bg-white/10'} hover:opacity-80 transition-opacity`}
                  >
                    {toLocalTimeStr(b.start_datetime)} {b.client_name}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[9px] font-mono text-text/30 text-right">+{dayBookings.length - 3}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="flex gap-4 mt-4">
        {Object.entries(STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${STATUS_COLORS[status]}`} />
            <span className="text-[10px] font-mono text-text/40">{label}</span>
          </div>
        ))}
      </div>

      {/* Modal detalle de reserva */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Detalle de Reserva</h3>
              <button onClick={() => setSelected(null)} className="text-text/40 hover:text-white transition-colors"><X size={16} /></button>
            </div>
            <div className="space-y-3">
              {[
                ['Cliente', selected.client_name],
                ['Email', selected.client_email],
                ['Sala', selected.spaces?.name ?? '—'],
                ['Inicio', `${toLocalDateStr(selected.start_datetime)} · ${toLocalTimeStr(selected.start_datetime)}`],
                ['Fin', toLocalTimeStr(selected.end_datetime)],
                ['Importe', selected.amount_paid ? `${selected.amount_paid}€` : '—'],
                ['Estado', STATUS_LABELS[selected.status] ?? selected.status],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span className="text-text/40 text-[10px] font-mono uppercase tracking-widest shrink-0">{label}</span>
                  <span className="text-white text-xs font-mono text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
