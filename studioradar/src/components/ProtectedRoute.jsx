import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Comprueba si el usuario tiene acceso al portal de productores.
// Caso 1: ya tiene user_id vinculado (productor existente) → acceso directo.
// Caso 2: está pre-registrado por email sin user_id (onboarding) → vincula y da acceso.
// Caso 3: no existe en ningún caso → bloqueado.
async function checkAndLinkProducer(user) {
  // Caso 1: productor ya vinculado (la mayoría de logins normales)
  const { data: byUserId } = await supabase
    .from('producers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (byUserId) return true

  // Caso 2: pre-registrado por email, primer login
  const { data: byEmail } = await supabase
    .from('producers')
    .select('id, user_id')
    .eq('email', user.email)
    .maybeSingle()

  if (!byEmail) return false

  await supabase
    .from('producers')
    .update({
      user_id: user.id,
      name: user.user_metadata?.full_name ?? user.email.split('@')[0],
    })
    .eq('id', byEmail.id)

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
