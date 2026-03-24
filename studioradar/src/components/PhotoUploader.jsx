import { useState, useRef } from 'react'
import { Upload, X, Loader2, GripVertical } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MAX_FILES = 10
const MAX_SIZE_MB = 5
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const BUCKET = 'studio-photos'

export default function PhotoUploader({ studioId, photos = [], onChange }) {
  const [uploading, setUploading] = useState({})  // { filename: true }
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const dragIndex = useRef(null)

  const handleFiles = async (files) => {
    setError(null)
    const validFiles = []

    for (const file of files) {
      if (!ACCEPTED.includes(file.type)) {
        setError(`"${file.name}" no es un formato válido (JPG, PNG, WebP).`)
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" supera el límite de ${MAX_SIZE_MB}MB.`)
        continue
      }
      if (photos.length + validFiles.length >= MAX_FILES) {
        setError(`Máximo ${MAX_FILES} fotos por estudio.`)
        break
      }
      validFiles.push(file)
    }

    if (!validFiles.length) return

    for (const file of validFiles) {
      const ext = file.name.split('.').pop()
      const filename = `${studioId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      setUploading(prev => ({ ...prev, [filename]: true }))

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filename, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        setError(`Error al subir "${file.name}": ${uploadError.message}`)
        setUploading(prev => { const n = { ...prev }; delete n[filename]; return n })
        continue
      }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

      setUploading(prev => { const n = { ...prev }; delete n[filename]; return n })
      onChange([...photos, publicUrl])
    }
  }

  const handleInputChange = (e) => {
    handleFiles(Array.from(e.target.files))
    e.target.value = ''  // reset para poder volver a subir el mismo archivo
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFiles(Array.from(e.dataTransfer.files))
  }

  const removePhoto = async (url, index) => {
    // Extraer el path relativo del bucket de la URL pública
    // URL ejemplo: https://<project>.supabase.co/storage/v1/object/public/studio-photos/<path>
    const marker = `/object/public/${BUCKET}/`
    const path = url.includes(marker) ? url.split(marker)[1] : null

    if (path) {
      await supabase.storage.from(BUCKET).remove([path])
    }

    const newPhotos = photos.filter((_, i) => i !== index)
    onChange(newPhotos)
  }

  // Drag-and-drop para reordenar (HTML5 nativo)
  const handleDragStart = (index) => { dragIndex.current = index }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const newPhotos = [...photos]
    const [moved] = newPhotos.splice(dragIndex.current, 1)
    newPhotos.splice(index, 0, moved)
    dragIndex.current = index
    onChange(newPhotos)
  }

  const handleDragEnd = () => { dragIndex.current = null }

  const isUploading = Object.keys(uploading).length > 0

  return (
    <div className="space-y-3">
      {/* Zona de drop / botón */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="border-2 border-dashed border-white/10 rounded-xl p-5 text-center hover:border-accent/40 transition-colors cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={handleInputChange}
        />
        <Upload size={20} className="mx-auto mb-2 text-text/30 group-hover:text-accent transition-colors" />
        <p className="text-xs font-mono text-text/40">
          Arrastra fotos aquí o <span className="text-accent">haz clic para seleccionar</span>
        </p>
        <p className="text-[10px] font-mono text-text/20 mt-1">
          {MAX_SIZE_MB}MB máx · JPG PNG WebP · máx {MAX_FILES} fotos
        </p>
      </div>

      {/* Spinner de subida */}
      {isUploading && (
        <div className="flex items-center gap-2 text-xs font-mono text-accent">
          <Loader2 size={13} className="animate-spin" />
          Subiendo {Object.keys(uploading).length} foto{Object.keys(uploading).length > 1 ? 's' : ''}…
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-xs font-mono">{error}</p>
      )}

      {/* Grid de fotos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group cursor-grab active:cursor-grabbing"
            >
              <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />

              {/* Overlay con controles */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-between p-1">
                <GripVertical size={14} className="text-white/60 mt-0.5" />
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(url, i) }}
                  className="w-5 h-5 bg-red-500/80 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>

              {/* Badge portada */}
              {i === 0 && (
                <div className="absolute bottom-1 left-1 bg-accent/90 text-white text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded">
                  Portada
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <p className="text-[10px] font-mono text-text/20">
          Arrastra las fotos para reordenar. La primera será la portada.
        </p>
      )}
    </div>
  )
}
