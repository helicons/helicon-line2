import { useState } from 'react'
import { Save, Eye, EyeOff, X, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PhotoUploader from './PhotoUploader'

const EQUIPMENT_SUGGESTIONS = [
  'Mesa de mezclas', 'Cabina vocal', 'Piano', 'Batería', 'Bajo DI',
  'Monitores Yamaha', 'Monitores Adam', 'Pro Tools', 'Logic Pro',
  'Ableton Live', 'Micrófonos Neumann', 'Micrófonos Shure', 'Compresor hardware'
]

export default function StudioForm({ studio, producerId, onSaved }) {
  const isNew = !studio

  const [form, setForm] = useState({
    name:            studio?.name            ?? '',
    description:     studio?.description     ?? '',
    address:         studio?.address         ?? '',
    city:            studio?.city            ?? '',
    country:         studio?.country         ?? 'España',
    postal_code:     studio?.postal_code     ?? '',
    lat:             studio?.lat             ?? '',
    lng:             studio?.lng             ?? '',
    price_per_hour:  studio?.price_per_hour  ?? '',
    photos:          studio?.photos          ?? [],
    equipment_tags:  studio?.equipment_tags  ?? [],
    is_published:    studio?.is_published    ?? false,
  })

  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)  // { type: 'success' | 'error', msg }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const showToast = (type, msg) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // Tags de equipamiento
  const addTag = (tag) => {
    const clean = tag.trim()
    if (!clean || form.equipment_tags.includes(clean)) { setTagInput(''); return }
    set('equipment_tags', [...form.equipment_tags, clean])
    setTagInput('')
  }
  const removeTag = (tag) => set('equipment_tags', form.equipment_tags.filter(t => t !== tag))

  // Toggle publicar — UPDATE inmediato sin esperar al guardado completo
  const handlePublishToggle = async () => {
    const newVal = !form.is_published
    set('is_published', newVal)
    if (!isNew && studio?.id) {
      await supabase.from('studios').update({ is_published: newVal }).eq('id', studio.id)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'El nombre del estudio es obligatorio.'); return }
    if (form.photos.length === 0) { showToast('error', 'Añade al menos una foto del estudio.'); return }

    setSaving(true)

    const payload = {
      name:            form.name.trim(),
      description:     form.description.trim() || null,
      address:         form.address.trim() || null,
      city:            form.city.trim() || null,
      country:         form.country.trim() || 'España',
      postal_code:     form.postal_code.trim() || null,
      lat:             form.lat !== '' ? parseFloat(form.lat) : null,
      lng:             form.lng !== '' ? parseFloat(form.lng) : null,
      price_per_hour:  form.price_per_hour !== '' ? parseFloat(form.price_per_hour) : null,
      photos:          form.photos,
      equipment_tags:  form.equipment_tags,
      is_published:    form.is_published,
      // Para compatibilidad con BookStudio que usa image_url como fallback
      image_url:       form.photos[0] ?? studio?.image_url ?? null,
      // Mantener location como concatenación para compatibilidad
      location:        [form.city, form.country].filter(Boolean).join(', ') || studio?.location || null,
    }

    let data, error
    if (isNew) {
      ;({ data, error } = await supabase
        .from('studios')
        .insert({ ...payload, producer_id: producerId })
        .select()
        .single())
    } else {
      ;({ data, error } = await supabase
        .from('studios')
        .update(payload)
        .eq('id', studio.id)
        .select()
        .single())
    }

    setSaving(false)

    if (error) {
      showToast('error', `Error al guardar: ${error.message}`)
      return
    }

    showToast('success', isNew ? 'Estudio creado correctamente.' : 'Cambios guardados.')
    onSaved(data)
  }

  return (
    <div className="space-y-8 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl border font-mono text-xs shadow-xl transition-all ${
          toast.type === 'success'
            ? 'bg-green-500/15 border-green-500/30 text-green-400'
            : 'bg-red-500/15 border-red-500/30 text-red-400'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Sección: Información básica */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-mono text-text/40 uppercase tracking-widest border-b border-white/5 pb-2">
          Información básica
        </h4>

        <div>
          <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">
            Nombre del estudio *
          </label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Ej: Studio 54 Madrid"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">
            Descripción
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Qué hace especial a tu estudio, equipamiento destacado, ambiente..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">
            Precio por hora (€)
          </label>
          <input
            type="number"
            min="0"
            step="5"
            value={form.price_per_hour}
            onChange={e => set('price_per_hour', e.target.value)}
            placeholder="Ej: 40"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
          />
        </div>
      </section>

      {/* Sección: Ubicación */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-mono text-text/40 uppercase tracking-widest border-b border-white/5 pb-2">
          Ubicación
        </h4>

        <div>
          <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">Dirección</label>
          <input
            value={form.address}
            onChange={e => set('address', e.target.value)}
            placeholder="Calle Gran Vía 28, 1º"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">Ciudad</label>
            <input
              value={form.city}
              onChange={e => set('city', e.target.value)}
              placeholder="Madrid"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">Código Postal</label>
            <input
              value={form.postal_code}
              onChange={e => set('postal_code', e.target.value)}
              placeholder="28013"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">País</label>
          <input
            value={form.country}
            onChange={e => set('country', e.target.value)}
            placeholder="España"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">
              Latitud <span className="text-text/20">(opcional)</span>
            </label>
            <input
              type="number"
              step="0.000001"
              value={form.lat}
              onChange={e => set('lat', e.target.value)}
              placeholder="40.416775"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-text/50 uppercase tracking-widest block mb-1.5">
              Longitud <span className="text-text/20">(opcional)</span>
            </label>
            <input
              type="number"
              step="0.000001"
              value={form.lng}
              onChange={e => set('lng', e.target.value)}
              placeholder="-3.703790"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>
        <p className="text-[10px] font-mono text-text/20">
          Puedes obtener lat/lng en Google Maps → clic derecho sobre tu dirección → copiar coordenadas.
        </p>
      </section>

      {/* Sección: Equipamiento */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-mono text-text/40 uppercase tracking-widest border-b border-white/5 pb-2">
          Equipamiento
        </h4>

        <div className="flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
            placeholder="Escribe y pulsa Enter para añadir"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm font-mono outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={() => addTag(tagInput)}
            className="px-3 py-2.5 bg-white/10 border border-white/10 rounded-xl text-text hover:bg-accent hover:border-accent hover:text-white transition-all"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Sugerencias */}
        <div className="flex flex-wrap gap-1.5">
          {EQUIPMENT_SUGGESTIONS.filter(s => !form.equipment_tags.includes(s)).slice(0, 8).map(s => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="text-[10px] font-mono text-text/40 border border-white/5 px-2 py-1 rounded-full hover:border-accent/50 hover:text-accent transition-all"
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Tags seleccionados */}
        {form.equipment_tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.equipment_tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-accent/15 border border-accent/25 text-accent text-[11px] font-mono px-2.5 py-1 rounded-full">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Sección: Fotos */}
      <section className="space-y-3">
        <h4 className="text-[10px] font-mono text-text/40 uppercase tracking-widest border-b border-white/5 pb-2">
          Fotos del estudio *
        </h4>
        <PhotoUploader
          studioId={studio?.id ?? 'new'}
          photos={form.photos}
          onChange={urls => set('photos', urls)}
        />
      </section>

      {/* Footer: Toggle publicar + Guardar */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        {/* Toggle publicar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePublishToggle}
            className={`w-10 h-5 rounded-full transition-colors relative ${form.is_published ? 'bg-accent' : 'bg-white/10'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow ${form.is_published ? 'left-5' : 'left-0.5'}`} />
          </button>
          <div>
            <p className="text-xs font-mono text-white">{form.is_published ? 'Publicado en Radar' : 'No publicado'}</p>
            <p className="text-[10px] font-mono text-text/30">
              {form.is_published ? 'Visible para los clientes' : 'Solo tú puedes verlo'}
            </p>
          </div>
          {form.is_published ? <Eye size={14} className="text-accent" /> : <EyeOff size={14} className="text-text/20" />}
        </div>

        {/* Botón guardar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent text-white font-mono font-bold text-sm px-6 py-3 rounded-xl hover:bg-[#9d3df2] transition-all disabled:opacity-50 shadow-lg shadow-accent/20"
        >
          <Save size={14} />
          {saving ? 'Guardando…' : isNew ? 'Crear Estudio' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}
