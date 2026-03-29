import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Upload, Music2, Image, X, Loader } from 'lucide-react'

const GENRES = ['Trap', 'R&B', 'Drill', 'Synthwave', 'Techno', 'Industrial', 'Hard', 'Bouncy', 'Chill']
const MOODS = ['Dark', 'Aggressive', 'Chill', 'Sad', 'Energetic', 'Melancholic']
const KEY_OPTIONS = ['C Maj','C Min','C# Maj','C# Min','D Maj','D Min','D# Maj','D# Min','E Maj','E Min','F Maj','F Min','F# Maj','F# Min','G Maj','G Min','G# Maj','G# Min','A Maj','A Min','A# Maj','A# Min','B Maj','B Min']

export default function BeatForm({ producerId, onSaved, onCancel }) {
  const [title, setTitle] = useState('')
  const [bpm, setBpm] = useState('')
  const [key, setKey] = useState('')
  const [genre, setGenre] = useState('')
  const [mood, setMood] = useState('')
  const [price, setPrice] = useState('')
  const [tags, setTags] = useState('')

  const [audioFile, setAudioFile] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

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
    if (!audioFile) { setError('Sube el archivo de audio'); return }

    setUploading(true)
    setError(null)

    try {
      const timestamp = Date.now()
      let audio_url = null
      let image_url = null

      // Subir audio
      setProgress('Subiendo audio…')
      const audioExt = audioFile.name.split('.').pop()
      const audioPath = `${producerId}/${timestamp}.${audioExt}`
      const { error: audioErr } = await supabase.storage
        .from('beats-audio')
        .upload(audioPath, audioFile, { upsert: false })
      if (audioErr) throw new Error('Error al subir audio: ' + audioErr.message)
      const { data: audioData } = supabase.storage.from('beats-audio').getPublicUrl(audioPath)
      audio_url = audioData.publicUrl

      // Subir imagen (opcional)
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

      // Insertar beat en DB
      setProgress('Guardando beat…')
      const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean)
      const { data: beat, error: dbErr } = await supabase
        .from('beats')
        .insert({
          producer_id: producerId,
          title: title.trim(),
          bpm: bpm ? parseInt(bpm) : null,
          key: key || null,
          genre: genre || null,
          mood: mood || null,
          price: price ? parseFloat(price) : 0,
          tags: tagsArray,
          audio_url,
          image_url,
          is_published: true,
        })
        .select()
        .single()

      if (dbErr) throw new Error('Error al guardar: ' + dbErr.message)
      onSaved(beat)
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
        <label className={labelClass}>Archivo de audio *</label>
        <div
          onClick={() => audioRef.current?.click()}
          className={`flex items-center gap-3 h-14 rounded-xl border border-dashed cursor-pointer transition-colors px-4 ${audioFile ? 'border-accent/40 bg-accent/5' : 'border-white/15 hover:border-accent/40 bg-white/3'}`}
        >
          <Music2 size={18} className={audioFile ? 'text-accent' : 'text-text/30'} />
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-mono truncate block ${audioFile ? 'text-white' : 'text-text/30'}`}>
              {audioFile ? audioFile.name : 'Click para subir MP3'}
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

      {/* Precio + Tags */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Precio base (€)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="29" min={0} step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tags (separados por coma)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="dark, melodic, trap" className={inputClass} />
        </div>
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
          {uploading ? <><Loader size={13} className="animate-spin" /> Subiendo…</> : <><Upload size={13} /> Publicar Beat</>}
        </button>
      </div>
    </form>
  )
}
