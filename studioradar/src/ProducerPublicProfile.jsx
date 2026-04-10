import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { ArrowLeft, Play, Pause, Music2, ShoppingCart } from 'lucide-react'

export default function ProducerPublicProfile() {
  const { producerId } = useParams()
  const navigate = useNavigate()

  const [producer, setProducer] = useState(null)
  const [beats, setBeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const [{ data: prod }, { data: beatData }] = await Promise.all([
        supabase.from('producers').select('id, name, avatar_url, bio').eq('id', producerId).single(),
        supabase.from('beats').select('*').eq('producer_id', producerId).eq('is_published', true).order('created_at', { ascending: false }),
      ])
      setProducer(prod)
      setBeats(beatData ?? [])
      setLoading(false)
    }
    load()
  }, [producerId])

  // Audio
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio()
    const audio = audioRef.current
    audio.onended = () => setIsPlaying(false)
    return () => { audio.pause() }
  }, [])

  const togglePlay = (beat) => {
    const audio = audioRef.current
    if (!audio) return
    if (playingId === beat.id) {
      if (isPlaying) { audio.pause(); setIsPlaying(false) }
      else { audio.play().catch(() => {}); setIsPlaying(true) }
    } else {
      audio.pause()
      audio.src = beat.audio_url
      audio.play().catch(() => {})
      setPlayingId(beat.id)
      setIsPlaying(true)
    }
  }

  const goToMarketplace = (beat) => {
    navigate(`/beats?beat=${beat.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!producer) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-text/40 font-mono text-sm">Productor no encontrado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#050505]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-text/40 hover:text-white transition-colors font-mono text-xs"
          >
            <ArrowLeft size={14} /> Volver
          </button>
          <span className="font-mono text-sm font-bold tracking-[0.2em] text-white cursor-pointer hover:text-accent transition-colors" onClick={() => navigate('/')}>
            HELICON
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Perfil */}
        <div className="flex items-center gap-6 mb-12">
          {producer.avatar_url ? (
            <img
              src={producer.avatar_url}
              alt={producer.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-accent/30 shadow-lg shadow-accent/10"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center">
              <Music2 size={32} className="text-accent/50" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{producer.name}</h1>
            {producer.bio && (
              <p className="text-text/50 text-sm font-mono mt-2 max-w-md">{producer.bio}</p>
            )}
            <p className="text-text/30 text-xs font-mono mt-2 uppercase tracking-widest">
              {beats.length} beat{beats.length !== 1 ? 's' : ''} publicado{beats.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Beats */}
        {beats.length === 0 ? (
          <div className="text-center py-20">
            <Music2 size={40} className="text-text/10 mx-auto mb-4" />
            <p className="text-text/30 font-mono text-sm">Este productor aún no tiene beats publicados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {beats.map((beat, i) => {
              const active = playingId === beat.id
              const playing = active && isPlaying
              return (
                <div
                  key={beat.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${active ? 'border-accent/30 bg-accent/5' : 'border-white/5 bg-white/2 hover:border-white/10'}`}
                >
                  {/* Número / play */}
                  <button
                    onClick={() => togglePlay(beat)}
                    className="w-8 h-8 flex items-center justify-center shrink-0 group"
                  >
                    {playing ? (
                      <Pause size={16} className="text-accent" />
                    ) : (
                      <>
                        <span className="text-text/30 font-mono text-xs group-hover:hidden">{String(i + 1).padStart(2, '0')}</span>
                        <Play size={16} className="text-white hidden group-hover:block" />
                      </>
                    )}
                  </button>

                  {/* Portada */}
                  {beat.image_url ? (
                    <img src={beat.image_url} alt={beat.title} className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                      <Music2 size={16} className="text-accent/50" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${active ? 'text-accent' : 'text-white'}`}>{beat.title}</p>
                    <p className="text-text/40 text-xs font-mono mt-0.5">
                      {[beat.genre, beat.mood, beat.bpm && `${beat.bpm} BPM`, beat.key].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Precio básico */}
                  <div className="text-right shrink-0">
                    {beat.price_basic > 0 && (
                      <p className="text-accent font-bold text-sm">{beat.price_basic}€</p>
                    )}
                    {beat.price_premium > 0 && (
                      <p className="text-text/30 text-[10px] font-mono">{beat.price_premium}€ premium</p>
                    )}
                  </div>

                  {/* Botón comprar */}
                  <button
                    onClick={() => goToMarketplace(beat)}
                    className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent text-accent hover:text-white border border-accent/30 font-mono text-xs px-3 py-2 rounded-lg transition-all shrink-0"
                  >
                    <ShoppingCart size={12} /> Comprar
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
