import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { Activity, ArrowRight, Eye, EyeOff, Mail, Lock, User } from 'lucide-react'

async function ensureUserRow(user) {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('users').insert({
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email.split('@')[0],
      email: user.email,
    })
  }
}

export default function UserLogin() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Si ya hay sesión de cliente, redirigir
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (userRow) navigate('/', { replace: true })
    })
  }, [navigate])

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message)
        setLoading(false)
        return
      }
      // Verificar que tiene cuenta cliente
      const { data: userRow } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle()
      if (!userRow) {
        // Auth existe pero no tiene cuenta cliente — crearla
        await ensureUserRow(data.user)
      }
      navigate('/', { replace: true })
    } else {
      // Registro
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este email ya tiene una cuenta. Inicia sesión.')
        } else {
          setError(error.message)
        }
        setLoading(false)
        return
      }
      if (data.user) {
        // Crear fila en users con nombre
        await supabase.from('users').insert({
          user_id: data.user.id,
          name: name || email.split('@')[0],
          email: data.user.email,
        })
        if (data.session) {
          navigate('/', { replace: true })
        } else {
          setSuccess('Revisa tu email para confirmar tu cuenta.')
          setLoading(false)
        }
      }
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
    setName('')
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
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
              Área de clientes
            </span>
            <div className="w-8 h-px bg-white/10" />
          </div>
        </div>

        {/* Toggle login / registro */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/8">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest rounded-lg transition-all duration-200 ${
              mode === 'login'
                ? 'bg-accent text-white shadow-[0_0_16px_rgba(138,43,226,0.4)]'
                : 'text-text/40 hover:text-white/60'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest rounded-lg transition-all duration-200 ${
              mode === 'register'
                ? 'bg-accent text-white shadow-[0_0_16px_rgba(138,43,226,0.4)]'
                : 'text-text/40 hover:text-white/60'
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Card */}
        <div className="bg-[#111111] border border-white/8 rounded-2xl p-8 shadow-2xl">

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#050505] font-mono font-bold text-sm py-3.5 px-6 rounded-xl hover:bg-white/90 transition-all disabled:opacity-60 disabled:pointer-events-none mb-6"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Conectando…
              </span>
            ) : (
              <>
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

          {/* Divisor */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] font-mono text-text/30 uppercase tracking-widest">o con email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Formulario */}
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-text/30 font-mono focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-text/30 font-mono focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-white/5 border border-white/8 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-text/30 font-mono focus:outline-none focus:border-accent/50 focus:bg-white/8 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-xs font-mono text-center py-1">{error}</p>
            )}
            {success && (
              <p className="text-green-400 text-xs font-mono text-center py-1">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white font-mono font-bold text-sm py-3.5 rounded-xl hover:bg-[#9d3df2] transition-all shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] disabled:opacity-60 disabled:pointer-events-none mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {mode === 'login' ? 'Entrando…' : 'Creando cuenta…'}
                </span>
              ) : (
                <>
                  {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text/20 text-[10px] font-mono mt-8">
          ¿Eres productor?{' '}
          <Link to="/producer/login" className="text-accent/50 hover:text-accent transition-colors">
            Accede al portal de estudios
          </Link>
        </p>
      </div>
    </div>
  )
}
