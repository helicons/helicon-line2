import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Crea el row en la tabla `producers` la primera vez que el productor hace login con Google
async function ensureProducerRow(user) {
  const { data: existing } = await supabase
    .from('producers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    await supabase.from('producers').insert({
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email.split('@')[0],
      email: user.email,
    })
  }
}

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate('/producer/login', { replace: true })
        return
      }
      await ensureProducerRow(session.user)
      setReady(true)
    })
  }, [navigate])

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="text-text/40 text-xs font-mono uppercase tracking-widest">Cargando</span>
        </div>
      </div>
    )
  }

  return children
}
