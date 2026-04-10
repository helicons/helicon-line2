import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, Music2, Image, X, Loader, ChevronDown, Plus } from 'lucide-react'

const GENRES = ['Trap', 'R&B', 'Drill', 'Synthwave', 'Techno', 'Industrial', 'Hard', 'Bouncy', 'Chill']
const MOODS = ['Dark', 'Aggressive', 'Chill', 'Sad', 'Energetic', 'Melancholic']
const KEY_OPTIONS = ['C Maj','C Min','C# Maj','C# Min','D Maj','D Min','D# Maj','D# Min','E Maj','E Min','F Maj','F Min','F# Maj','F# Min','G Maj','G Min','G# Maj','G# Min','A Maj','A Min','A# Maj','A# Min','B Maj','B Min']

const DEFAULT_CONDITIONS = {
  basic:     { tag: 'MP3 Lease',        features: ['MP3 320kbps', '2.500 copias físicas', '500K streams', 'No radio comercial', 'Crédito: "Prod. por [productor]"'] },
  premium:   { tag: 'WAV + Stems',      features: ['WAV sin comprimir + stems', 'Copias ilimitadas', 'Streams ilimitados', 'Radio comercial incluida', 'Crédito: "Prod. por [productor]"'] },
  exclusive: { tag: 'Derechos Totales', features: ['WAV + stems + proyecto DAW', 'Derechos exclusivos totales', 'Beat retirado del mercado', 'TV / Sync / Publicidad', 'Sin crédito obligatorio'] },
}

// Condiciones predefinidas disponibles para seleccionar
const PRESET_CONDITIONS = {
  basic: [
    'MP3 320kbps', 'WAV sin comprimir', '2.500 copias físicas', '5.000 copias físicas',
    '500K streams', '1M streams', 'Streams ilimitados', 'No radio comercial',
    'Radio comercial incluida', 'Crédito: "Prod. por [productor]"', 'Sin crédito obligatorio',
    '1 vídeo musical', 'Uso no comercial', 'Distribución digital',
  ],
  premium: [
    'WAV sin comprimir + stems', 'MP3 320kbps', 'Copias ilimitadas', '10.000 copias físicas',
    'Streams ilimitados', '1M streams', 'Radio comercial incluida', 'No radio comercial',
    'Crédito: "Prod. por [productor]"', '1 vídeo musical', 'Distribución digital',
    'Uso en sync (vídeo)', 'Sin crédito obligatorio',
  ],
  exclusive: [
    'WAV + stems + proyecto DAW', 'WAV sin comprimir + stems', 'Derechos exclusivos totales',
    'Beat retirado del mercado', 'TV / Sync / Publicidad', 'Sin crédito obligatorio',
    'Crédito: "Prod. por [productor]"', 'Copias ilimitadas', 'Streams ilimitados',
    'Radio comercial incluida', 'Distribución digital', 'Uso comercial completo',
  ],
}

const LICENSE_LABELS = { basic: 'Basic', premium: 'Premium', exclusive: 'Exclusive' }
const LICENSE_COLORS = {
  basic:     { text: 'text-blue-400',   border: 'border-blue-500/40',   bg: 'bg-blue-500/10'   },
  premium:   { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10' },
  exclusive: { text: 'text-amber-400',  border: 'border-amber-500/40',  bg: 'bg-amber-500/10'  },
}

function LicenseConditionEditor({ licenseId, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const inputRef = useRef()

  const label  = LICENSE_LABELS[licenseId]
  const colors = LICENSE_COLORS[licenseId]
  const presets = PRESET_CONDITIONS[licenseId]

  const addFeature = (feat) => {
    const trimmed = feat.trim()
    if (!trimmed || value.features.includes(trimmed)) return
    onChange({ ...value, features: [...value.features, trimmed] })
  }

  const removeFeature = (feat) => {
    onChange({ ...value, features: value.features.filter(f => f !== feat) })
  }

  const handleCustomAdd = () => {
    addFeature(customInput)
    setCustomInput('')
    inputRef.current?.focus()
  }

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? colors.border : 'border-white/10'}`}>
      {/* Header acordeón */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`font-mono text-xs font-bold uppercase tracking-widest ${colors.text}`}>{label}</span>
          <span className="font-mono text-[10px] text-text/30">{value.tag}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-text/20">{value.features.length} condiciones</span>
          <ChevronDown size={13} className={`text-text/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4 bg-white/2">

          {/* Subtítulo */}
          <div>
            <label className="font-mono text-[10px] text-text/40 uppercase tracking-widest block mb-1.5">Subtítulo</label>
            <input
              type="text"
              value={value.tag}
              onChange={e => onChange({ ...value, tag: e.target.value })}
              placeholder="ej. MP3 Lease"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text/20"
            />
          </div>

          {/* Chips seleccionados */}
          <div>
            <label className="font-mono text-[10px] text-text/40 uppercase tracking-widest block mb-2">Condiciones elegidas</label>
            {value.features.length === 0 ? (
              <p className="text-text/20 text-[11px] font-mono italic">Ninguna seleccionada</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {value.features.map(feat => (
                  <span
                    key={feat}
                    className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full border ${colors.border} ${colors.bg} ${colors.text}`}
                  >
                    {feat}
                    <button
                      type="button"
                      onClick={() => removeFeature(feat)}
                      className="hover:opacity-60 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Presets disponibles (los no seleccionados) */}
          <div>
            <label className="font-mono text-[10px] text-text/40 uppercase tracking-widest block mb-2">Añadir condición</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {presets.filter(p => !value.features.includes(p)).map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => addFeature(preset)}
                  className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/10 text-text/40 hover:border-white/30 hover:text-white transition-all"
                >
                  <Plus size={9} /> {preset}
                </button>
              ))}
            </div>

            {/* Input condición personalizada */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCustomAdd() } }}
                placeholder="Escribe una condición propia…"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-xs text-white font-mono outline-none focus:border-accent transition-colors placeholder:text-text/20"
              />
              <button
                type="button"
                onClick={handleCustomAdd}
                disabled={!customInput.trim()}
                className={`px-3 py-2 rounded-lg border font-mono text-xs transition-all ${customInput.trim() ? `${colors.border} ${colors.bg} ${colors.text} hover:opacity-80` : 'border-white/10 text-text/20 cursor-not-allowed'}`}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

export default function BeatForm({ producerId, beat, onSaved, onCancel }) {
  const [title, setTitle] = useState(beat?.title ?? '')
  const [bpm, setBpm] = useState(beat?.bpm ?? '')
  const [key, setKey] = useState(beat?.key ?? '')
  const [genre, setGenre] = useState(beat?.genre ?? '')
  const [mood, setMood] = useState(beat?.mood ?? '')
  const [priceBasic, setPriceBasic] = useState(beat?.price_basic ?? beat?.price ?? '')
  const [pricePremium, setPricePremium] = useState(beat?.price_premium ?? '')
  const [priceExclusive, setPriceExclusive] = useState(beat?.price_exclusive ?? '')
  const [tags, setTags] = useState(beat?.tags?.join(', ') ?? '')
  const [conditions, setConditions] = useState(beat?.license_conditions ?? DEFAULT_CONDITIONS)

  const [audioFile, setAudioFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(beat?.image_url ?? null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState('')

  const audioRef = useRef()
  const imageRef = useRef()

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('El título es obligatorio'); return }
    if (!beat && !audioFile) { setError('Sube el archivo de audio'); return }

    setUploading(true)
    setError(null)

    try {
      const timestamp = Date.now()
      let audio_url = beat?.audio_url ?? null
      let image_url = beat?.image_url ?? null

      if (audioFile) {
        setProgress('Subiendo audio…')
        const audioExt = audioFile.name.split('.').pop()
        const audioPath = `${producerId}/${timestamp}.${audioExt}`
        const { error: audioErr } = await supabase.storage
          .from('beats-audio')
          .upload(audioPath, audioFile, { upsert: false })
        if (audioErr) throw new Error('Error al subir audio: ' + audioErr.message)
        const { data: audioData } = supabase.storage.from('beats-audio').getPublicUrl(audioPath)
        audio_url = audioData.publicUrl
      }

      if (imageFile) {
        setProgress('Subiendo portada…')
        const imgExt = imageFile.name.split('.').pop()
        const imgPath = `${producerId}/${timestamp}.${imgExt}`
        const { error: imgErr } = await supabase.storage
          .from('beats-images')
          .upload(imgPath, imageFile, { upsert: false })
        if (imgErr) throw new Error('Error al subir imagen: ' + imgErr.message)
        const { data: imgData } = supabase.storage.from('beats-images').getPublicUrl(imgPath)
        image_url = imgData.publicUrl
      }

      setProgress('Guardando beat…')
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)

      // Limpiar features vacíos antes de guardar
      const cleanConditions = Object.fromEntries(
        Object.entries(conditions).map(([k, v]) => [
          k, { ...v, features: v.features.filter(f => f.trim() !== '') }
        ])
      )

      const payload = {
        producer_id: producerId,
        title: title.trim(),
        bpm: bpm ? parseInt(bpm) : null,
        key: key || null,
        genre: genre || null,
        mood: mood || null,
        price_basic: priceBasic ? parseFloat(priceBasic) : 0,
        price_premium: pricePremium ? parseFloat(pricePremium) : 0,
        price_exclusive: priceExclusive ? parseFloat(priceExclusive) : 0,
        price: priceBasic ? parseFloat(priceBasic) : 0,
        tags: tagsArray,
        audio_url,
        image_url,
        is_published: beat ? beat.is_published : true,
        license_conditions: cleanConditions,
      }

      let res
      if (beat?.id) {
        res = await supabase.from('beats').update(payload).eq('id', beat.id).select().single()
      } else {
        res = await supabase.from('beats').insert(payload).select().single()
      }

      if (res.error) throw new Error('Error al guardar: ' + res.error.message)
      onSaved(res.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      setProgress('')
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-accent transition-colors font-mono placeholder:text-text/30"
  const selectClass = "w-full bg-[#111] border border-white/10 rounded-xl py-3 px-4 text-sm text-white outline-none focus:border-accent transition-colors font-mono appearance-none cursor-pointer"
  const labelClass = "font-mono text-[10px] text-text/50 uppercase tracking-widest block mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Portada */}
      <div>
        <label className={labelClass}>Portada (opcional)</label>
        <div
          onClick={() => imageRef.current?.click()}
          className="relative h-32 rounded-xl border border-dashed border-white/15 hover:border-accent/40 transition-colors cursor-pointer overflow-hidden flex items-center justify-center bg-white/3"
        >
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center hover:bg-red-500/80 transition-colors z-10"
              >
                <X size={12} className="text-white" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-text/30">
              <Image size={24} />
              <span className="text-xs font-mono">Click para subir imagen</span>
            </div>
          )}
          <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
      </div>

      {/* Audio */}
      <div>
        <label className={labelClass}>Archivo de audio {beat ? '(Opcional para actualizar)' : '*'}</label>
        <div
          onClick={() => audioRef.current?.click()}
          className={`flex items-center gap-3 h-14 rounded-xl border border-dashed cursor-pointer transition-colors px-4 ${audioFile ? 'border-accent/40 bg-accent/5' : 'border-white/15 hover:border-accent/40 bg-white/3'}`}
        >
          <Music2 size={18} className={audioFile ? 'text-accent' : 'text-text/30'} />
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-mono truncate block ${audioFile ? 'text-white' : 'text-text/30'}`}>
              {audioFile ? audioFile.name : (beat ? 'Mantener actual / Click para cambiar MP3' : 'Click para subir MP3')}
            </span>
            {!audioFile && <span className="text-[10px] font-mono text-text/20">Solo MP3 · Máx. 45MB</span>}
          </div>
          {audioFile && (
            <button type="button" onClick={e => { e.stopPropagation(); setAudioFile(null) }} className="ml-auto text-text/40 hover:text-red-400 transition-colors">
              <X size={14} />
            </button>
          )}
          <input ref={audioRef} type="file" accept=".mp3,audio/mpeg" className="hidden" onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            if (!file.name.toLowerCase().endsWith('.mp3') && file.type !== 'audio/mpeg') {
              setError('Solo se aceptan archivos MP3'); return
            }
            if (file.size > 45 * 1024 * 1024) {
              setError('El archivo supera 45MB. Exporta con bitrate menor o reduce la duración.'); return
            }
            setError(null)
            setAudioFile(file)
          }} />
        </div>
      </div>

      {/* Título */}
      <div>
        <label className={labelClass}>Título *</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="EJ. NEON TEARS" className={inputClass} />
      </div>

      {/* BPM + Key */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>BPM</label>
          <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="140" min={40} max={300} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Key</label>
          <select value={key} onChange={e => setKey(e.target.value)} className={selectClass}>
            <option value="">— Seleccionar —</option>
            {KEY_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>

      {/* Genre + Mood */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Género</label>
          <select value={genre} onChange={e => setGenre(e.target.value)} className={selectClass}>
            <option value="">— Seleccionar —</option>
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Mood</label>
          <select value={mood} onChange={e => setMood(e.target.value)} className={selectClass}>
            <option value="">— Seleccionar —</option>
            {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Precios */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Basic (€)</label>
          <input type="number" value={priceBasic} onChange={e => setPriceBasic(e.target.value)} placeholder="29" min={0} step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Premium (€)</label>
          <input type="number" value={pricePremium} onChange={e => setPricePremium(e.target.value)} placeholder="79" min={0} step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Exclusive (€)</label>
          <input type="number" value={priceExclusive} onChange={e => setPriceExclusive(e.target.value)} placeholder="450" min={0} step="0.01" className={inputClass} />
        </div>
      </div>

      {/* Condiciones de licencia */}
      <div>
        <label className={labelClass}>Condiciones por licencia</label>
        <div className="space-y-2">
          {['basic', 'premium', 'exclusive'].map(id => (
            <LicenseConditionEditor
              key={id}
              licenseId={id}
              value={conditions[id]}
              onChange={val => setConditions(prev => ({ ...prev, [id]: val }))}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className={labelClass}>Tags (separados por coma)</label>
        <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="dark, melodic, trap" className={inputClass} />
      </div>

      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      {progress && (
        <div className="flex items-center gap-2 text-accent text-xs font-mono">
          <Loader size={12} className="animate-spin" />
          {progress}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={uploading}
          className="flex-1 py-3 rounded-xl border border-white/10 text-text/50 hover:text-white font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={uploading}
          className="flex-1 py-3 rounded-xl bg-accent text-white font-mono font-bold text-xs uppercase tracking-widest hover:bg-[#9d3df2] transition-all shadow-lg shadow-accent/20 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {uploading ? <><Loader size={13} className="animate-spin" /> Guardando…</> : <><Upload size={13} /> {beat ? 'Actualizar Beat' : 'Publicar Beat'}</>}
        </button>
      </div>
    </form>
  )
}
