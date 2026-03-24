import { useState, useEffect } from 'react'
import { Save, X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAYS = [
  { num: 1, label: 'Lunes' }, { num: 2, label: 'Martes' }, { num: 3, label: 'Miércoles' },
  { num: 4, label: 'Jueves' }, { num: 5, label: 'Viernes' }, { num: 6, label: 'Sábado' },
  { num: 0, label: 'Domingo' },
]

export default function AvailabilityManager({ spaceId }) {
  const [schedule, setSchedule] = useState({})        // { dayOfWeek: { id?, start_time, end_time, active } }
  const [blockedDates, setBlockedDates] = useState([]) // [{ id, date, reason }]
  const [newBlock, setNewBlock] = useState({ date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [addingBlock, setAddingBlock] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!spaceId) return
    const load = async () => {
      const [{ data: avail }, { data: blocked }] = await Promise.all([
        supabase.from('availability').select('*').eq('space_id', spaceId),
        supabase.from('blocked_dates').select('*').eq('space_id', spaceId).order('date'),
      ])
      const sched = {}
      DAYS.forEach(d => { sched[d.num] = { active: false, start_time: '10:00', end_time: '22:00', id: null } })
      ;(avail ?? []).forEach(a => {
        sched[a.day_of_week] = { active: true, start_time: a.start_time.slice(0, 5), end_time: a.end_time.slice(0, 5), id: a.id }
      })
      setSchedule(sched)
      setBlockedDates(blocked ?? [])
      setLoading(false)
    }
    load()
  }, [spaceId])

  const toggleDay = (num) => setSchedule(s => ({ ...s, [num]: { ...s[num], active: !s[num].active } }))
  const setTime = (num, field, val) => setSchedule(s => ({ ...s, [num]: { ...s[num], [field]: val } }))

  const saveSchedule = async () => {
    setSaving(true)
    for (const d of DAYS) {
      const entry = schedule[d.num]
      if (entry.active) {
        const payload = { space_id: spaceId, day_of_week: d.num, start_time: entry.start_time, end_time: entry.end_time }
        if (entry.id) {
          await supabase.from('availability').update(payload).eq('id', entry.id)
        } else {
          const { data } = await supabase.from('availability').insert(payload).select().single()
          if (data) setSchedule(s => ({ ...s, [d.num]: { ...s[d.num], id: data.id } }))
        }
      } else if (entry.id) {
        await supabase.from('availability').delete().eq('id', entry.id)
        setSchedule(s => ({ ...s, [d.num]: { ...s[d.num], id: null } }))
      }
    }
    setSaving(false)
  }

  const addBlockedDate = async () => {
    if (!newBlock.date) return
    setAddingBlock(true)
    const { data, error } = await supabase
      .from('blocked_dates')
      .insert({ space_id: spaceId, date: newBlock.date, reason: newBlock.reason || null })
      .select().single()
    if (!error && data) {
      setBlockedDates(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date)))
      setNewBlock({ date: '', reason: '' })
    }
    setAddingBlock(false)
  }

  const removeBlockedDate = async (id) => {
    await supabase.from('blocked_dates').delete().eq('id', id)
    setBlockedDates(prev => prev.filter(b => b.id !== id))
  }

  if (loading || !spaceId) return (
    <p className="text-text/30 text-xs font-mono text-center py-8">
      {!spaceId ? 'Selecciona un espacio para configurar su disponibilidad.' : 'Cargando…'}
    </p>
  )

  return (
    <div className="space-y-8">
      {/* Horario semanal */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Horario Semanal</h3>
          <button onClick={saveSchedule} disabled={saving} className="flex items-center gap-1.5 bg-accent text-white text-xs font-mono px-4 py-1.5 rounded-lg hover:bg-[#9d3df2] transition-all disabled:opacity-50">
            <Save size={12} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
        <div className="space-y-2">
          {DAYS.map(({ num, label }) => {
            const entry = schedule[num] ?? { active: false, start_time: '10:00', end_time: '22:00' }
            return (
              <div key={num} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${entry.active ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5 opacity-50'}`}>
                <button
                  onClick={() => toggleDay(num)}
                  className={`w-8 h-4 rounded-full transition-colors relative shrink-0 ${entry.active ? 'bg-accent' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${entry.active ? 'left-4' : 'left-0.5'}`} />
                </button>
                <span className="text-xs font-mono text-text/70 w-20 shrink-0">{label}</span>
                {entry.active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input type="time" value={entry.start_time} onChange={e => setTime(num, 'start_time', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none focus:border-accent" />
                    <span className="text-text/30 text-xs">–</span>
                    <input type="time" value={entry.end_time} onChange={e => setTime(num, 'end_time', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs font-mono outline-none focus:border-accent" />
                  </div>
                ) : (
                  <span className="text-text/20 text-xs font-mono">No disponible</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Fechas bloqueadas */}
      <div>
        <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest mb-4">Fechas Bloqueadas</h3>
        <div className="flex gap-2 mb-4">
          <input type="date" value={newBlock.date} onChange={e => setNewBlock(b => ({ ...b, date: e.target.value }))} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-accent" />
          <input type="text" value={newBlock.reason} onChange={e => setNewBlock(b => ({ ...b, reason: e.target.value }))} placeholder="Motivo (opcional)" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-accent" />
          <button onClick={addBlockedDate} disabled={addingBlock || !newBlock.date} className="flex items-center gap-1 bg-white/10 text-white text-xs font-mono px-3 py-2 rounded-lg hover:bg-accent transition-all disabled:opacity-40">
            <Plus size={12} />
          </button>
        </div>
        {blockedDates.length === 0 && <p className="text-text/20 text-xs font-mono">Sin fechas bloqueadas</p>}
        <div className="space-y-2">
          {blockedDates.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-lg px-3 py-2">
              <span className="text-white text-xs font-mono">{b.date}</span>
              {b.reason && <span className="text-text/40 text-[11px] font-mono flex-1 mx-3 truncate">{b.reason}</span>}
              <button onClick={() => removeBlockedDate(b.id)} className="text-text/30 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
