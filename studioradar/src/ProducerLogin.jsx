import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

export default function ProducerLogin() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Si ya hay sesión activa, redirigir al dashboard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/producer/dashboard', { replace: true })
    })
  }, [navigate])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/producer/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // Si no hay error, el navegador redirige a Google — no hace falta setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <span className="font-mono text-3xl font-bold tracking-[0.3em] text-white">
            HELICON
          </span>
          <div className="flex items-center gap-2 justify-center mt-3">
            <div className="w-8 h-px bg-white/10" />
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
              Producer Portal
            </span>
            <div className="w-8 h-px bg-white/10" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#1A1A1A] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white font-bold text-xl mb-2">Acceso Productor</h1>
          <p className="text-text/50 text-xs font-mono mb-8">
            Gestiona la disponibilidad de tu estudio y visualiza tus reservas.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#050505] font-mono font-bold text-sm py-4 px-6 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Conectando…
              </span>
            ) : (
              <>
                {/* Google icon */}
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.1 0 5.6 1.1 7.6 2.8l5.7-5.7C33.5 3.5 29 1.5 24 1.5 14.9 1.5 7.2 7.2 4.3 15.1l6.6 5.1C12.3 14 17.7 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.5 24c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.6 37 46.5 31 46.5 24z"/>
                  <path fill="#FBBC05" d="M10.9 28.8A14.6 14.6 0 019.5 24c0-1.7.3-3.3.8-4.8L3.7 14C2 17.1 1 20.4 1 24s1 6.9 2.7 10l7.2-5.2z"/>
                  <path fill="#34A853" d="M24 46.5c5.5 0 10.1-1.8 13.5-4.9l-7.5-5.8c-1.8 1.2-4.1 1.9-6 1.9-6.3 0-11.7-4.5-13.2-10.5L3.6 32.5C6.5 40.5 14.6 46.5 24 46.5z"/>
                </svg>
                Continuar con Google
              </>
            )}
          </button>

          {error && (
            <p className="mt-4 text-red-400 text-xs font-mono text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-text/20 text-[10px] font-mono mt-8">
          Solo para productores registrados en Helicon
        </p>
      </div>
    </div>
  )
}
