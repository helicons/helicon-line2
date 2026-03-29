import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, MapPin, ShoppingCart, Menu, X, ArrowRight, LogOut, User } from 'lucide-react'
import { gsap } from 'gsap'
import { supabase } from '../lib/supabase'

const NAV_LINKS = [
  { label: 'Estudios', to: '/book-studio', Icon: MapPin, },
  /*   { label: 'Artistas',     to: '/artists',         Icon: Mic,          }, */
  /*   { label: 'Productores', to: '/producers', Icon: Headphones, }, */
  { label: 'Beats Market', to: '/beats', Icon: ShoppingCart, },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [clientUser, setClientUser] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const mobileMenuRef = useRef(null)
  const overlayRef = useRef(null)
  const userMenuRef = useRef(null)

  // Cargar estado de sesión cliente (y crear fila en users si es login con Google)
  useEffect(() => {
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

    async function loadClientUser(event, session) {
      if (!session) { setClientUser(null); return }
      // Solo crear fila en users si el login NO vino del portal de productores
      if (event === 'SIGNED_IN' && !window.location.pathname.startsWith('/producer')) {
        await ensureUserRow(session.user)
      }
      const { data } = await supabase
        .from('users')
        .select('name, email')
        .eq('user_id', session.user.id)
        .maybeSingle()
      if (data) {
        setClientUser({
          ...data,
          avatar: session.user.user_metadata?.avatar_url ?? null,
        })
      } else {
        setClientUser(null)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadClientUser('INITIAL', session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      loadClientUser(event, session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Cerrar menú de usuario al hacer click fuera
  useEffect(() => {
    if (!userMenuOpen) return
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [userMenuOpen])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => { setOpen(false) }, [location.pathname])

  useEffect(() => {
    const menu = mobileMenuRef.current
    const overlay = overlayRef.current
    if (!menu || !overlay) return
    if (open) {
      gsap.set(menu, { display: 'flex' })
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
      gsap.fromTo(menu, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
      gsap.fromTo(
        menu.querySelectorAll('.mobile-link'),
        { x: -24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.3, stagger: 0.07, delay: 0.1, ease: 'power2.out' }
      )
    } else {
      gsap.to(overlay, { opacity: 0, duration: 0.2 })
      gsap.to(menu, {
        y: -10, opacity: 0, duration: 0.25, ease: 'power2.in',
        onComplete: () => gsap.set(menu, { display: 'none' }),
      })
    }
  }, [open])

  const isActive = (to) => to && location.pathname === to

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setClientUser(null)
    setUserMenuOpen(false)
    navigate('/')
  }

  const initials = clientUser?.name
    ? clientUser.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <>
      {/* ── Barra principal ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 transition-all duration-500 pointer-events-none">
        <div className={`
          pointer-events-auto flex items-center justify-between
          w-[92%] max-w-6xl rounded-2xl px-6 py-3
          transition-all duration-500
          ${scrolled
            ? 'bg-[#050505]/85 backdrop-blur-2xl border border-white/10 shadow-[0_4px_40px_rgba(0,0,0,0.6)]'
            : 'bg-[#0a0a0a]/40 backdrop-blur-md border border-white/5'}
        `}>
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group select-none">
            <span className="relative flex">
              <Activity className="w-5 h-5 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <span className="absolute inset-0 w-5 h-5 bg-accent/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </span>
            <span className="font-heading font-bold text-lg tracking-wide text-white">Helicon</span>
          </Link>

          {/* Links escritorio */}
          <div className="hidden md:flex items-center gap-1 font-ui text-sm">
            {NAV_LINKS.map(({ label, to }) => {
              const active = isActive(to)
              return (
                <Link
                  key={label}
                  to={to}
                  className={`
                    relative flex items-center gap-1.5 px-4 py-2 rounded-xl
                    transition-all duration-200
                    ${active ? 'text-white bg-white/[0.08]' : 'text-text/70 hover:text-white hover:bg-white/5'}
                  `}
                >
                  {label}
                  {active && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* CTA + Hamburger */}
          <div className="flex items-center gap-3">
            {/* Auth desktop */}
            <div className="hidden md:block">
              {clientUser ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-accent/50 transition-all duration-200 flex-shrink-0"
                  >
                    {clientUser.avatar ? (
                      <img src={clientUser.avatar} alt={clientUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="w-full h-full bg-accent/20 border border-accent/30 flex items-center justify-center text-[11px] font-mono font-bold text-accent">
                        {initials}
                      </span>
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="flex items-center gap-3 px-3 py-3 border-b border-white/8">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          {clientUser.avatar ? (
                            <img src={clientUser.avatar} alt={clientUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="w-full h-full bg-accent/20 flex items-center justify-center text-[10px] font-mono font-bold text-accent">
                              {initials}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-ui text-white truncate">{clientUser.name}</p>
                          <p className="text-[10px] font-mono text-text/40 truncate">{clientUser.email}</p>
                        </div>
                      </div>
                      <Link
                        to="/perfil"
                        onClick={() => setUserMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-ui text-text/60 hover:text-white hover:bg-white/5 transition-all"
                      >
                        <User size={13} />
                        Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-ui text-text/60 hover:text-white hover:bg-white/5 transition-all border-t border-white/5"
                      >
                        <LogOut size={13} />
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login">
                  <button className="inline-flex items-center gap-1.5 font-ui text-xs uppercase tracking-widest bg-accent text-white px-5 py-2 rounded-xl hover:bg-[#9d3df2] transition-all shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_30px_rgba(138,43,226,0.5)]">
                    Iniciar sesión <ArrowRight size={13} />
                  </button>
                </Link>
              )}
            </div>

            <button
              onClick={() => setOpen(v => !v)}
              aria-label="Abrir menú"
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-white/10 text-text/70 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all duration-200"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Fondo móvil ── */}
      <div
        ref={overlayRef}
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        style={{ display: 'none', opacity: 0 }}
      />

      {/* ── Menú móvil ── */}
      <div
        ref={mobileMenuRef}
        className="fixed top-[82px] left-0 right-0 z-50 md:hidden flex-col mx-4 rounded-2xl border border-white/10 bg-[#080808]/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden"
        style={{ display: 'none', opacity: 0 }}
      >
        <div className="h-px w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

        <div className="flex flex-col p-3 gap-1">
          {NAV_LINKS.map(({ label, to, Icon }) => {
            const active = isActive(to)
            return (
              <Link
                key={label}
                to={to}
                className={`
                  mobile-link flex items-center gap-3.5 px-4 py-3.5 rounded-xl
                  font-ui text-sm tracking-wide transition-all duration-200
                  ${active
                    ? 'bg-accent/15 text-white border border-accent/25'
                    : 'text-text/60 hover:text-white hover:bg-white/5 border border-transparent'}
                `}
              >
                <span className={`
                  flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-all duration-200
                  ${active ? 'bg-accent/20 text-accent shadow-[0_0_12px_rgba(138,43,226,0.25)]' : 'bg-accent/10 text-accent/60'}
                `}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-accent/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        <div className="px-4 pb-4">
          <div className="h-px w-full bg-white/5 mb-3" />
          {clientUser ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-xl">
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-accent/20">
                  {clientUser.avatar ? (
                    <img src={clientUser.avatar} alt={clientUser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="w-full h-full bg-accent/20 flex items-center justify-center text-[11px] font-mono font-bold text-accent">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-ui text-white truncate">{clientUser.name}</p>
                  <p className="text-[10px] font-mono text-text/40 truncate">{clientUser.email}</p>
                </div>
              </div>
              <Link to="/perfil" className="w-full flex items-center justify-center gap-2 py-3 text-sm font-ui text-text/60 hover:text-white border border-white/8 hover:border-white/15 rounded-xl transition-all">
                <User size={14} />
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-ui text-text/60 hover:text-white border border-white/8 hover:border-white/15 rounded-xl transition-all"
              >
                <LogOut size={14} />
                Cerrar sesión
              </button>
            </div>
          ) : (
            <Link to="/login" className="block w-full">
              <button className="w-full py-3.5 text-sm font-ui uppercase tracking-widest bg-accent text-white rounded-xl hover:bg-[#9d3df2] transition-all flex items-center justify-center gap-2">
                Iniciar sesión <ArrowRight size={14} />
              </button>
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
