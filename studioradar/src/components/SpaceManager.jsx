import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = { name: '', price_per_hour: '', min_duration_hours: 1, max_duration_hours: 8, description: '' }

export default function SpaceManager({ studioId }) {
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)  // null = no editing, 'new' = crear nuevo
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const fetchSpaces = async () => {
    const { data } = await supabase
      .from('spaces')
      .select('*')
      .eq('studio_id', studioId)
      .order('created_at')
    setSpaces(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (studioId) fetchSpaces() }, [studioId])

  const startEdit = (space) => {
    setEditingId(space.id)
    setForm({ name: space.name, price_per_hour: space.price_per_hour, min_duration_hours: space.min_duration_hours, max_duration_hours: space.max_duration_hours, description: space.description ?? '' })
    setError(null)
  }

  const startNew = () => {
    setEditingId('new')
    setForm(EMPTY_FORM)
    setError(null)
  }

  const cancel = () => { setEditingId(null); setError(null) }

  const save = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio'); return }
    setSaving(true)
    setError(null)
    const payload = {
      name: form.name.trim(),
      price_per_hour: parseFloat(form.price_per_hour) || 0,
      min_duration_hours: parseInt(form.min_duration_hours) || 1,
      max_duration_hours: parseInt(form.max_duration_hours) || 8,
      description: form.description.trim() || null,
      studio_id: studioId,
    }
    let err
    if (editingId === 'new') {
      ;({ error: err } = await supabase.from('spaces').insert(payload))
    } else {
      ;({ error: err } = await supabase.from('spaces').update(payload).eq('id', editingId))
    }
    if (err) { setError(err.message); setSaving(false); return }
    await fetchSpaces()
    setEditingId(null)
    setSaving(false)
  }

  const toggleActive = async (space) => {
    await supabase.from('spaces').update({ active: !space.active }).eq('id', space.id)
    setSpaces(prev => prev.map(s => s.id === space.id ? { ...s, active: !s.active } : s))
  }

  const deleteSpace = async (id) => {
    if (!confirm('¿Eliminar este espacio? Se cancelarán las reservas pendientes asociadas.')) return
    await supabase.from('spaces').delete().eq('id', id)
    setSpaces(prev => prev.filter(s => s.id !== id))
  }

  if (loading) return <div className="text-text/40 text-xs font-mono py-8 text-center">Cargando espacios…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm font-mono uppercase tracking-widest">Espacios / Salas</h3>
        <button onClick={startNew} className="flex items-center gap-1.5 text-accent text-xs font-mono hover:text-white transition-colors">
          <Plus size={14} /> Añadir
        </button>
      </div>

      {/* Formulario nuevo / editar */}
      {editingId && (
        <div className="bg-white/5 border border-accent/30 rounded-xl p-5 space-y-3">
          <p className="text-[10px] font-mono text-accent uppercase tracking-widest">{editingId === 'new' ? 'Nuevo Espacio' : 'Editar Espacio'}</p>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre (ej: Sala A, Cabina 1)" className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm font-mono outline-none focus:border-accent" />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-mono text-text/40 uppercase tracking-widest">€/hora</label>
              <input type="number" min="0" value={form.price_per_hour} onChange={e => setForm(f => ({ ...f, price_per_hour: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm font-mono outline-none focus:border-accent mt-1" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-text/40 uppercase tracking-widest">Mín horas</label>
              <input type="number" min="1" max="12" value={form.min_duration_hours} onChange={e => setForm(f => ({ ...f, min_duration_hours: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm font-mono outline-none focus:border-accent mt-1" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-text/40 uppercase tracking-widest">Máx horas</label>
              <input type="number" min="1" max="24" value={form.max_duration_hours} onChange={e => setForm(f => ({ ...f, max_duration_hours: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-white text-sm font-mono outline-none focus:border-accent mt-1" />
            </div>
          </div>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción (opcional)" rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-3 text-white text-sm font-mono outline-none focus:border-accent resize-none" />
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={cancel} className="flex items-center gap-1 text-text/50 text-xs font-mono hover:text-white transition-colors px-3 py-1.5"><X size={12} /> Cancelar</button>
            <button onClick={save} disabled={saving} className="flex items-center gap-1 bg-accent text-white text-xs font-mono px-4 py-1.5 rounded-lg hover:bg-[#9d3df2] transition-all disabled:opacity-50"><Check size={12} /> {saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      )}

      {/* Lista de espacios */}
      {spaces.length === 0 && !editingId && (
        <p className="text-text/30 text-xs font-mono text-center py-8">No hay espacios configurados. Añade el primero.</p>
      )}
      {spaces.map(space => (
        <div key={space.id} className={`flex items-start justify-between p-4 rounded-xl border transition-all ${space.active ? 'bg-white/3 border-white/8' : 'bg-white/1 border-white/4 opacity-50'}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold font-mono">{space.name}</span>
              {!space.active && <span className="text-[9px] font-mono text-text/30 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full">Inactivo</span>}
            </div>
            <p className="text-accent text-xs font-mono mt-0.5">{space.price_per_hour}€/h · {space.min_duration_hours}h–{space.max_duration_hours}h</p>
            {space.description && <p className="text-text/40 text-[11px] mt-1 truncate">{space.description}</p>}
          </div>
          <div className="flex items-center gap-1 ml-3 shrink-0">
            <button onClick={() => startEdit(space)} className="p-1.5 text-text/40 hover:text-white transition-colors"><Pencil size={13} /></button>
            <button onClick={() => toggleActive(space)} className="p-1.5 text-text/40 hover:text-accent transition-colors text-[10px] font-mono">{space.active ? 'OFF' : 'ON'}</button>
            <button onClick={() => deleteSpace(space.id)} className="p-1.5 text-text/40 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
