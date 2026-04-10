import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Comprueba si el email está pre-registrado en producers.
// Si está pero sin user_id vinculado (primer login), lo vincula ahora.
// Devuelve true si el acceso está permitido, false si no.
async function checkAndLinkProducer(user) {
  const { data: producer } = await supabase
    .from('producers')
    .select('id, user_id')
    .eq('email', user.email)
    .maybeSingle()

  if (!producer) return false

  if (!producer.user_id) {
    await supabase
      .from('producers')
      .update({
        user_id: user.id,
        name: user.user_metadata?.full_name ?? user.email.split('@')[0],
      })
      .eq('id', producer.id)
  }

  return true
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

      const allowed = await checkAndLinkProducer(session.user)
      if (!allowed) {
        await supabase.auth.signOut()
        navigate('/producer/login?error=no_access', { replace: true })
        return
      }

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
