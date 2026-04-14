import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Activity, ArrowRight, Instagram, Music, Youtube, User } from 'lucide-react'

export default function UserOnboarding() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | form | submitting
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState(null)
  const [form, setForm] = useState({
    artist_name: '',
    instagram: '',
    spotify: '',
    youtube: '',
  })

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { navigate('/login', { replace: true }); return }

      setUserId(session.user.id)

      // Si ya tiene artist_name, el onboarding está completo
      const { data: row } = await supabase
        .from('users')
        .select('artist_name')
        .eq('user_id', session.user.id)
        .maybeSingle()

      if (row?.artist_name) { navigate('/', { replace: true }); return }

      // Pre-rellenar nombre desde Google si viene de OAuth
      const googleName = session.user.user_metadata?.full_name ?? ''
      setForm(f => ({ ...f, artist_name: googleName }))
      setStatus('form')
    }
    check()
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.artist_name.trim()) { setError('El nombre artístico es obligatorio.'); return }
    if (!form.instagram.trim())   { setError('El perfil de Instagram es obligatorio.'); return }

    setStatus('submitting')

    const { data: { session } } = await supabase.auth.getSession()

    const payload = {
      user_id:     userId,
      name:        session?.user?.user_metadata?.full_name ?? form.artist_name.trim(),
      email:       session?.user?.email ?? '',
      artist_name: form.artist_name.trim(),
      instagram:   form.instagram.trim(),
      spotify:     form.spotify.trim() || null,
      youtube:     form.youtube.trim() || null,
    }

    // Upsert: crea la fila si no existe, actualiza si ya existe
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'user_id' })

    if (upsertError) {
      setError('Error al guardar. Inténtalo de nuevo.')
      setStatus('form')
      return
    }

    navigate('/', { replace: true })
  }

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const inputClass = 'w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-accent/50 transition-colors'
  const labelClass = 'text-text/50 text-[10px] font-mono uppercase tracking-widest block mb-1.5'

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <Activity className="w-5 h-5 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <span className="font-mono text-2xl font-bold tracking-[0.2em] text-white">HELICON</span>
          </Link>
          <div className="flex items-center gap-2 justify-center mt-3">
            <div className="w-8 h-px bg-white/10" />
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">Perfil artístico</span>
            <div className="w-8 h-px bg-white/10" />
          </div>
        </div>

        <div className="bg-[#111111] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white font-bold text-xl mb-1">Cuéntanos sobre ti</h1>
          <p className="text-text/40 text-xs font-mono mb-8">
            Solo lo hacemos una vez. Estos datos aparecerán en tu perfil.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Nombre artístico */}
            <div>
              <label className={labelClass}>Nombre artístico <span className="text-accent">*</span></label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                <input
                  type="text"
                  value={form.artist_name}
                  onChange={e => field('artist_name', e.target.value)}
                  placeholder="Tu nombre artístico"
                  required
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className={labelClass}>Instagram <span className="text-accent">*</span></label>
              <div className="relative">
                <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                <input
                  type="text"
                  value={form.instagram}
                  onChange={e => field('instagram', e.target.value)}
                  placeholder="@tuusuario"
                  required
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>

            {/* Spotify */}
            <div>
              <label className={labelClass}>Spotify <span className="text-text/30 normal-case tracking-normal">— opcional</span></label>
              <div className="relative">
                <Music className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                <input
                  type="text"
                  value={form.spotify}
                  onChange={e => field('spotify', e.target.value)}
                  placeholder="URL o nombre de artista"
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>

            {/* YouTube */}
            <div>
              <label className={labelClass}>YouTube <span className="text-text/30 normal-case tracking-normal">— opcional</span></label>
              <div className="relative">
                <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                <input
                  type="text"
                  value={form.youtube}
                  onChange={e => field('youtube', e.target.value)}
                  placeholder="URL de tu canal"
                  className={inputClass + ' pl-10'}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white font-mono font-bold text-sm py-3.5 rounded-xl hover:bg-[#9d3df2] transition-all shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] disabled:opacity-60 disabled:pointer-events-none mt-2"
            >
              {status === 'submitting' ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Guardando…
                </>
              ) : (
                <>Empezar <ArrowRight size={14} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text/20 text-[10px] font-mono mt-8">
          Tus datos están protegidos · heliconradar.com
        </p>
      </div>
    </div>
  )
}
