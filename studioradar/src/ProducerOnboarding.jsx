import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from './lib/supabase'

export default function ProducerOnboarding() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('validating') // validating | form | success | error
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', iban: '' })

  // Validar token al cargar
  useEffect(() => {
    if (!token) {
      setErrorMsg('Enlace inválido. Solicita uno nuevo al equipo de Helicon.')
      setStatus('error')
      return
    }
    setStatus('form')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.name.trim() || !form.email.trim() || !form.iban.trim()) {
      setErrorMsg('Por favor rellena todos los campos.')
      return
    }

    // Validación básica de IBAN (formato europeo)
    const ibanClean = form.iban.replace(/\s/g, '').toUpperCase()
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(ibanClean)) {
      setErrorMsg('El IBAN no tiene un formato válido.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    const { data, error } = await supabase.rpc('submit_producer_onboarding', {
      p_token: token,
      p_name:  form.name.trim(),
      p_email: form.email.trim().toLowerCase(),
      p_iban:  ibanClean,
    })

    setLoading(false)

    if (error || data?.error) {
      setErrorMsg(data?.error || 'Error al enviar. Inténtalo de nuevo.')
      return
    }

    setStatus('success')
  }

  if (status === 'validating') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white">HELICON</span>
          <div className="mt-10 bg-[#1A1A1A] border border-red-500/30 rounded-2xl p-8">
            <p className="text-red-400 font-mono text-sm">{errorMsg}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white">HELICON</span>
          <div className="mt-10 bg-[#1A1A1A] border border-accent/30 rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg mb-2">Datos recibidos</h2>
            <p className="text-text/50 text-xs font-mono">
              Hemos guardado tu información. En breve nos pondremos en contacto contigo para confirmar el acceso al portal.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white">HELICON</span>
          <div className="flex items-center gap-2 justify-center mt-3">
            <div className="w-8 h-px bg-white/10" />
            <span className="text-[10px] font-mono text-accent uppercase tracking-widest">Registro de Productor</span>
            <div className="w-8 h-px bg-white/10" />
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-white/8 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white font-bold text-xl mb-1">Tus datos</h1>
          <p className="text-text/40 text-xs font-mono mb-8">
            Este enlace caduca en 24 horas y es de un solo uso.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-text/50 text-[10px] font-mono uppercase tracking-widest block mb-1.5">
                Nombre completo
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-accent/50"
              />
            </div>

            <div>
              <label className="text-text/50 text-[10px] font-mono uppercase tracking-widest block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-accent/50"
              />
            </div>

            <div>
              <label className="text-text/50 text-[10px] font-mono uppercase tracking-widest block mb-1.5">
                IBAN
              </label>
              <input
                type="text"
                value={form.iban}
                onChange={e => setForm(f => ({ ...f, iban: e.target.value }))}
                placeholder="ES12 3456 7890 1234 5678 9012"
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 text-white text-sm font-mono placeholder:text-white/20 focus:outline-none focus:border-accent/50"
              />
              <p className="text-text/30 text-[10px] font-mono mt-1">
                Solo se usa para tramitar tus pagos. Almacenado de forma segura.
              </p>
            </div>

            {errorMsg && (
              <p className="text-red-400 text-xs font-mono">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white font-mono font-bold text-sm py-4 rounded-xl hover:bg-accent/90 transition-all disabled:opacity-60 disabled:pointer-events-none mt-2"
            >
              {loading ? 'Enviando…' : 'Enviar datos'}
            </button>
          </form>
        </div>

        <p className="text-center text-text/20 text-[10px] font-mono mt-6">
          Tus datos están protegidos · heliconradar.com
        </p>
      </div>
    </div>
  )
}
