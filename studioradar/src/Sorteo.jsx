import { useState, useEffect, useRef } from 'react'

const CSS = `
  :root {
    --black: #0a0a0a;
    --white: #f5f5f0;
    --gold: #c9a84c;
    --gold-light: #e8d48b;
    --red: #e63946;
    --gray: #2a2a2a;
    --gray-mid: #888;
    --gray-light: #1a1a1a;
  }
  .sorteo-root {
    background: var(--black);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  .sorteo-root * { box-sizing: border-box; }
  .sorteo-root ::-webkit-scrollbar { width: 4px; }
  .sorteo-root ::-webkit-scrollbar-track { background: var(--black); }
  .sorteo-root ::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 2px; }
  .sorteo-noise {
    position: fixed; top: 0; left: 0;
    width: 100%; height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 9999;
  }

  /* NAV */
  .s-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem; background: rgba(10,10,10,0.88);
    backdrop-filter: blur(16px); border-bottom: 1px solid rgba(201,168,76,0.15);
  }
  .s-nav-logo {
    font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.3em; text-transform: uppercase; color: var(--white); opacity: 0.6;
  }
  .s-nav-logo span { color: var(--gold); }
  .s-nav-cta {
    background: var(--gold); color: var(--black);
    font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    padding: 0.6rem 1.4rem; border: none; cursor: pointer;
    transition: all 0.25s; border-radius: 2px; white-space: nowrap;
  }
  .s-nav-cta:hover { background: var(--gold-light); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(201,168,76,0.3); }

  /* HERO */
  .s-hero {
    min-height: 100vh; display: flex; flex-direction: column;
    justify-content: center; align-items: center; text-align: center;
    padding: 6rem 2rem 4rem; position: relative; overflow: hidden;
  }
  .s-hero::after {
    content: ''; position: absolute; bottom: 0; left: 0; right: 0;
    height: 200px; background: linear-gradient(to top, var(--black), transparent);
    pointer-events: none;
  }
  .s-hero-bg-lines { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; opacity: 0.06; }
  .s-hero-bg-lines span { position: absolute; width: 1px; height: 100%; background: var(--gold); }
  .s-hero-glow {
    position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .s-tag {
    font-family: 'Space Mono', monospace; font-size: 0.7rem; letter-spacing: 0.35em;
    text-transform: uppercase; color: var(--gold); border: 1px solid var(--gold);
    padding: 0.5rem 1.5rem; margin-bottom: 2.5rem; animation: s-fadeDown 1s ease both;
    display: inline-flex; align-items: center; gap: 0.6rem;
  }
  .s-tag::before { content: ''; width: 6px; height: 6px; background: var(--gold); border-radius: 50%; animation: s-blink 1.5s infinite; }
  .s-hero h1 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(3.5rem, 12vw, 9rem); line-height: 0.9; letter-spacing: -0.02em;
    animation: s-fadeUp 1s 0.2s ease both;
  }
  .s-hero h1 .accent { color: var(--gold); display: block; }
  .s-hero-sub {
    font-family: 'Space Mono', monospace; font-size: clamp(0.75rem, 2vw, 1rem);
    color: var(--gray-mid); margin-top: 1.5rem; max-width: 500px; line-height: 1.6;
    animation: s-fadeUp 1s 0.4s ease both;
  }
  .s-price-block {
    margin-top: 2.5rem; display: flex; align-items: center; gap: 1.25rem;
    animation: s-fadeUp 1s 0.55s ease both;
  }
  .s-price-badge span { font-family: 'Bebas Neue', sans-serif; font-size: 4rem; color: var(--gold); }
  .s-price-badge small {
    display: block; font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.3em; text-transform: uppercase; color: var(--gray-mid); margin-top: -0.25rem;
  }
  .s-price-sep { width: 1px; height: 50px; background: rgba(201,168,76,0.3); }
  .s-price-extra {
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--gray-mid); line-height: 1.9;
    text-align: left;
  }
  .s-hero-ctas {
    display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
    margin-top: 2.5rem; animation: s-fadeUp 1s 0.7s ease both;
  }
  .s-btn-hero {
    background: var(--gold); color: var(--black);
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 1rem 2.5rem; border: none; cursor: pointer;
    transition: all 0.25s;
  }
  .s-btn-hero:hover { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(201,168,76,0.3); }
  .s-btn-hero-ghost {
    background: transparent; color: var(--gray-mid);
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 1rem 2rem; border: 1px solid var(--gray); cursor: pointer;
    transition: all 0.25s;
  }
  .s-btn-hero-ghost:hover { border-color: rgba(201,168,76,0.4); color: var(--white); }
  .s-hero-fomo {
    display: inline-flex; align-items: center; gap: 0.6rem;
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.2em; text-transform: uppercase; color: #555;
    margin-top: 2rem; animation: s-fadeUp 1s 0.85s ease both;
  }
  .s-hero-fomo-dot { width: 5px; height: 5px; background: var(--gold); border-radius: 50%; animation: s-blink 1.5s infinite; }

  /* TICKER */
  .s-ticker-bar {
    background: rgba(201,168,76,0.06); border-top: 1px solid rgba(201,168,76,0.15);
    border-bottom: 1px solid rgba(201,168,76,0.15);
    padding: 0.9rem 0; overflow: hidden;
  }
  .s-ticker {
    display: flex; gap: 4rem; white-space: nowrap; animation: s-tickerScroll 22s linear infinite;
  }
  .s-ticker-item {
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(201,168,76,0.7); flex-shrink: 0;
  }

  /* SECTIONS */
  .s-section { padding: 6rem 2rem; max-width: 900px; margin: 0 auto; }
  .s-label { font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.4em; text-transform: uppercase; color: var(--gold); margin-bottom: 1rem; }
  .s-title { font-family: 'Bebas Neue', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; margin-bottom: 0.5rem; }

  /* FEATURES */
  .s-features { display: grid; gap: 1px; background: var(--gray); border: 1px solid var(--gray); margin-top: 3rem; }
  .s-feature {
    background: var(--black); padding: 2rem;
    display: grid; grid-template-columns: 50px 1fr; gap: 1.5rem; align-items: start; transition: background 0.3s;
  }
  .s-feature:hover { background: var(--gray-light); }
  .s-feature-icon { font-family: 'Bebas Neue', sans-serif; font-size: 1.8rem; color: var(--gold); line-height: 1; }
  .s-feature h3 { font-family: 'Space Mono', monospace; font-size: 0.85rem; margin-bottom: 0.4rem; letter-spacing: 0.05em; }
  .s-feature p { font-size: 0.85rem; color: var(--gray-mid); line-height: 1.5; }

  /* SCROLL HINT */
  .s-scroll-hint {
    position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%);
    font-family: 'Space Mono', monospace; font-size: 0.6rem; letter-spacing: 0.3em;
    text-transform: uppercase; color: var(--gray-mid); animation: s-pulse 2s infinite; z-index: 2;
  }
  .s-scroll-hint::after {
    content: ''; display: block; width: 1px; height: 30px; background: var(--gold);
    margin: 0.75rem auto 0; animation: s-scrollLine 2s infinite;
  }

  /* MID CTA */
  .s-mid-cta {
    padding: 7rem 2rem; text-align: center;
    background: linear-gradient(180deg, transparent, rgba(201,168,76,0.04) 50%, transparent);
    border-top: 1px solid rgba(201,168,76,0.1); border-bottom: 1px solid rgba(201,168,76,0.1);
    position: relative; overflow: hidden;
  }
  .s-mid-cta::before {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 600px; height: 300px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
  .s-mid-cta-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: clamp(2.5rem, 7vw, 6rem); line-height: 1; letter-spacing: -0.01em;
    max-width: 800px; margin: 0 auto 0.75rem;
  }
  .s-mid-cta-title em { font-style: normal; color: var(--gold); }
  .s-mid-cta-sub {
    font-family: 'Space Mono', monospace; font-size: 0.7rem;
    color: var(--gray-mid); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 2.5rem;
  }

  /* STEPS */
  .s-steps { counter-reset: step; margin-top: 2rem; }
  .s-step {
    counter-increment: step; padding: 2.5rem 0; border-bottom: 1px solid var(--gray);
    display: grid; grid-template-columns: 70px 1fr; gap: 1.5rem; align-items: start;
  }
  .s-step::before { content: counter(step, decimal-leading-zero); font-family: 'Bebas Neue', sans-serif; font-size: 2.8rem; color: rgba(201,168,76,0.3); line-height: 1; transition: color 0.3s; }
  .s-step:hover::before { color: var(--gold); }
  .s-step h3 { font-family: 'Space Mono', monospace; font-size: 0.85rem; margin-bottom: 0.5rem; }
  .s-step p { font-size: 0.82rem; color: var(--gray-mid); line-height: 1.6; }
  .s-step-tip {
    display: inline-block; margin-top: 0.75rem;
    background: rgba(201,168,76,0.08); color: var(--gold);
    font-family: 'Space Mono', monospace; font-size: 0.55rem;
    letter-spacing: 0.2em; text-transform: uppercase; padding: 0.3rem 0.75rem;
  }
  .s-steps-cta { margin-top: 3rem; text-align: center; }

  /* FORM */
  .s-form-section { padding: 0 2rem 6rem; max-width: 620px; margin: 0 auto; }
  .s-form-wrapper { border: 1px solid var(--gray); padding: 2.5rem; position: relative; background: rgba(201,168,76,0.02); }
  .s-form-wrapper::before { content: ''; position: absolute; top: -1px; left: 2rem; width: 60px; height: 3px; background: var(--gold); }
  .s-input-group { margin-bottom: 1.75rem; }
  .s-input-group label {
    display: block; font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.25em; text-transform: uppercase; color: var(--gray-mid); margin-bottom: 0.5rem;
  }
  .s-input-group input {
    width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--gray);
    color: var(--white); font-family: 'DM Sans', sans-serif; font-size: 1rem; padding: 0.75rem 0; outline: none; transition: border-color 0.3s;
  }
  .s-input-group input:focus { border-color: var(--gold); }
  .s-input-group input::placeholder { color: #333; }
  .s-multi-hint {
    background: rgba(201,168,76,0.06); border: 1px solid rgba(201,168,76,0.15);
    padding: 0.75rem 1rem; margin-bottom: 1.5rem;
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.08em; color: rgba(201,168,76,0.8); line-height: 1.6;
  }
  .s-checkbox-group { display: flex; align-items: flex-start; gap: 0.75rem; margin: 2rem 0; }
  .s-checkbox-group input[type="checkbox"] {
    appearance: none; width: 18px; height: 18px; min-width: 18px;
    border: 1px solid var(--gray-mid); background: transparent; cursor: pointer; position: relative; margin-top: 2px;
  }
  .s-checkbox-group input[type="checkbox"]:checked { border-color: var(--gold); background: var(--gold); }
  .s-checkbox-group input[type="checkbox"]:checked::after {
    content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    color: var(--black); font-size: 0.7rem; font-weight: bold;
  }
  .s-checkbox-group label { font-size: 0.75rem; color: var(--gray-mid); line-height: 1.5; cursor: pointer; }
  .s-btn-submit {
    width: 100%; background: var(--gold); color: var(--black); font-family: 'Bebas Neue', sans-serif;
    font-size: 1.4rem; letter-spacing: 0.1em;
    padding: 1rem; border: none; cursor: pointer;
    transition: all 0.3s;
  }
  .s-btn-submit:hover:not(:disabled) { background: var(--gold-light); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(201,168,76,0.2); }
  .s-btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  /* RESULT */
  .s-result { text-align: center; padding: 2.5rem; border: 1px solid var(--gold); animation: s-fadeUp 0.6s ease; background: rgba(201,168,76,0.03); position: relative; }
  .s-result::before { content: ''; position: absolute; top: -1px; left: 2rem; width: 60px; height: 3px; background: var(--gold); }
  .s-result-code {
    font-family: 'Bebas Neue', sans-serif; font-size: 3rem; color: var(--gold);
    letter-spacing: 0.15em; margin: 1rem 0; padding: 1rem; border: 2px dashed rgba(201,168,76,0.4); user-select: all;
    background: rgba(201,168,76,0.05);
  }
  .s-result-instructions { text-align: left; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--gray); }
  .s-bizum-step { display: grid; grid-template-columns: 30px 1fr; gap: 1rem; margin-bottom: 1.25rem; align-items: start; }
  .s-bizum-num { font-family: 'Bebas Neue', sans-serif; font-size: 1.4rem; color: var(--gold); }
  .s-bizum-step p { font-size: 0.82rem; color: var(--gray-mid); line-height: 1.6; }
  .s-bizum-step strong { color: var(--white); }
  .s-bizum-phone {
    display: inline-flex; align-items: center; gap: 0.5rem; background: var(--gray-light);
    padding: 0.6rem 1.2rem; border: 1px solid var(--gray); font-family: 'Space Mono', monospace;
    font-size: 1.1rem; color: var(--gold); cursor: pointer; transition: all 0.25s; margin: 0.5rem 0; border-radius: 2px;
  }
  .s-bizum-phone:hover { background: var(--gray); border-color: rgba(201,168,76,0.4); }
  .s-btn-reset {
    width: 100%; margin-top: 2rem; background: transparent; color: var(--gray-mid);
    border: 1px solid var(--gray); padding: 0.9rem;
    font-family: 'Space Mono', monospace; font-size: 0.65rem; letter-spacing: 0.2em;
    text-transform: uppercase; cursor: pointer; transition: all 0.25s;
  }
  .s-btn-reset:hover { border-color: rgba(201,168,76,0.4); color: var(--gold); }

  /* TOAST */
  .s-toast {
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(100px);
    background: var(--gold); color: var(--black); font-family: 'Space Mono', monospace;
    font-size: 0.65rem; padding: 0.75rem 1.5rem; z-index: 10000; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); letter-spacing: 0.15em; text-transform: uppercase;
  }
  .s-toast.show { transform: translateX(-50%) translateY(0); }

  /* FOOTER */
  .s-footer {
    text-align: center; padding: 3rem 2rem; border-top: 1px solid var(--gray);
    font-family: 'Space Mono', monospace; font-size: 0.6rem; color: #444; letter-spacing: 0.15em; line-height: 2.5;
  }

  /* ANIMATIONS */
  @keyframes s-fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes s-fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes s-blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes s-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes s-scrollLine {
    0% { transform: scaleY(0); transform-origin: top; }
    50% { transform: scaleY(1); transform-origin: top; }
    51% { transform-origin: bottom; }
    100% { transform: scaleY(0); transform-origin: bottom; }
  }
  @keyframes s-tickerScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  @media (max-width: 700px) {
    .s-features { grid-template-columns: 1fr; }
    .s-feature-icon { font-size: 1.8rem; }
    .s-step { grid-template-columns: 45px 1fr; gap: 1rem; }
    .s-step::before { font-size: 2rem; }
    .s-form-wrapper { padding: 1.75rem 1.25rem; }
    .s-result-code { font-size: 2rem; }
    .s-section { padding: 4rem 1.5rem; }
    .s-form-section { padding: 0 1.25rem 4rem; }
    .s-mid-cta { padding: 4rem 1.5rem; }
  }
`

const TICKER_ITEMS = [
  '🎙 Sesión de grabación completa',
  '· Mezcla profesional incluida',
  '· 1€ por participación',
  '· Bizum instantáneo',
  '· Plazas limitadas',
  '· Sorteo público en Instagram',
  '· Participaciones ilimitadas',
  '· Premio valorado en +500€',
]

export default function Sorteo() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [bases, setBases] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [userCode, setUserCode] = useState('')
  const [toast, setToast] = useState(false)
  const formRef = useRef(null)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600&display=swap'
    document.head.appendChild(link)
    return () => document.head.removeChild(link)
  }, [])

  const isValid = nombre.trim() && email.trim() && telefono.trim() && bases

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSubmit = () => {
    if (!isValid) return
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
    const num = Math.floor(Math.random() * 9000 + 1000)
    setUserCode(`CERO-${rand}${num}`)
    setShowResult(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleReset = () => {
    setNombre(''); setEmail(''); setTelefono(''); setBases(false)
    setShowResult(false); setUserCode('')
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
  }

  const copyPhone = () => {
    navigator.clipboard.writeText('633151895').then(() => {
      setToast(true)
      setTimeout(() => setToast(false), 2200)
    })
  }

  const tickerDouble = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="sorteo-root">
      <style>{CSS}</style>
      <div className="sorteo-noise" />

      {/* NAV */}
      <nav className="s-nav">
        <div className="s-nav-logo">Cero Estudios <span>×</span> Sorteo</div>
        <button className="s-nav-cta" onClick={scrollToForm}>
          Participa ya — 1€ →
        </button>
      </nav>

      {/* HERO */}
      <div className="s-hero">
        <div className="s-hero-bg-lines">
          <span style={{ left: '10%' }} /><span style={{ left: '25%' }} />
          <span style={{ left: '50%' }} /><span style={{ left: '75%' }} />
          <span style={{ left: '90%' }} />
        </div>
        <div className="s-hero-glow" />

        <div className="s-tag">Sorteo exclusivo · Madrid</div>

        <h1>
          SESIÓN EN
          <span className="accent">CERO ESTUDIOS</span>
        </h1>

        <p className="s-hero-sub">
          Grabación + mezcla profesional en uno de los estudios más importantes de Madrid.
          La decisión más fácil de tu carrera.
        </p>

        <div className="s-price-block">
          <div className="s-price-badge">
            <span>1€</span>
            <small>por participación</small>
          </div>        </div>

        <div className="s-hero-ctas">
          <button className="s-btn-hero" onClick={scrollToForm}>
            Quiero mi código — Participa ya
          </button>
          <button className="s-btn-hero-ghost" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
            ¿Cómo funciona?
          </button>
        </div>

        <div className="s-hero-fomo">
          <div className="s-hero-fomo-dot" />
          Plazas abiertas · 1€ por boleto · Sorteo público
        </div>

        <div className="s-scroll-hint">scroll</div>
      </div>

      {/* TICKER */}
      <div className="s-ticker-bar">
        <div className="s-ticker">
          {tickerDouble.map((item, i) => (
            <span key={i} className="s-ticker-item">{item}</span>
          ))}
        </div>
      </div>

      {/* QUÉ INCLUYE */}
      <section className="s-section">
        <div className="s-label">· El premio ·</div>
        <div className="s-title">LO QUE TE LLEVAS</div>
        <p style={{ color: 'var(--gray-mid)', lineHeight: 1.8, fontSize: '0.85rem', fontFamily: "'Space Mono', monospace", maxWidth: 600, marginTop: '0.5rem' }}>
          Premio valorado en más de <strong style={{ color: 'var(--gold)' }}>500€</strong> —
          sesión completa en <strong style={{ color: 'var(--white)' }}>Cero Estudios</strong>,
          donde han grabado algunos de los artistas más relevantes de la escena actual en Madrid.
          Tú entras por 1€.
        </p>
        <div className="s-features">
          {[
            { title: 'Grabación profesional', desc: 'Sesión de grabación completa en las instalaciones de Cero Estudios con su equipo técnico y acústica de primer nivel.' },
            { title: 'Mezcla incluida', desc: 'Tu tema mezclado profesionalmente por el equipo del estudio. Sonido listo para publicar.' },
            { title: 'Participaciones ilimitadas', desc: 'Puedes comprar tantas participaciones como quieras. Más participaciones = más posibilidades.' },
          ].map(f => (
            <div key={f.title} className="s-feature">
              <div className="s-feature-icon">◉</div>
              <div><h3>{f.title}</h3><p>{f.desc}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* MID CTA */}
      <div className="s-mid-cta">
        <div className="s-mid-cta-title">
          El próximo artista que grabe<br />
          en Cero podrías ser <em>tú.</em>
        </div>
        <p className="s-mid-cta-sub">Por solo 1€. Sin excusas.</p>
        <button className="s-btn-hero" onClick={scrollToForm} style={{ fontSize: '0.8rem', padding: '1rem 3rem' }}>
          Participa ahora →
        </button>
      </div>

      {/* CÓMO PARTICIPAR */}
      <section className="s-section" id="como-funciona">
        <div className="s-label">· Cómo funciona ·</div>
        <div className="s-title">3 PASOS Y ESTÁS DENTRO</div>
        <div className="s-steps">
          {[
            { title: 'Rellena el formulario', desc: 'Introduce tu nombre, email y teléfono. Recibirás un código único de participación al instante — guárdalo bien.', tip: '< 30 segundos' },
            { title: 'Envía tu Bizum', desc: 'Haz un Bizum de 1€ (o más, si quieres más boletos) al número indicado. En el concepto escribe tu código.', tip: 'Cada 1€ = 1 boleto más' },
            { title: 'Espera al sorteo', desc: 'Verificamos tu pago y estarás dentro. El ganador se anuncia públicamente en Instagram para total transparencia.', tip: 'Sorteo público' },
          ].map(s => (
            <div key={s.title} className="s-step">
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <span className="s-step-tip">{s.tip}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="s-steps-cta">
          <button className="s-btn-hero" onClick={scrollToForm}>
            Empieza aquí — es gratis rellenar →
          </button>
        </div>
      </section>

      {/* FORMULARIO */}
      <div className="s-form-section" id="participar" ref={formRef}>
        <div className="s-label">· Tu turno ·</div>
        <div className="s-title" style={{ marginBottom: '0.5rem' }}>CONSIGUE TU CÓDIGO</div>
        <p style={{ color: 'var(--gray-mid)', fontSize: '0.7rem', fontFamily: "'Space Mono', monospace", marginBottom: '2rem', lineHeight: 1.7 }}>
          Rellena el formulario, te damos tu código y te explicamos cómo hacer el Bizum.
        </p>

        {!showResult ? (
          <div className="s-form-wrapper">
            <div className="s-input-group">
              <label>Nombre completo</label>
              <input type="text" placeholder="Tu nombre artístico o real" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="s-input-group">
              <label>Email</label>
              <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="s-input-group">
              <label>Teléfono</label>
              <input type="tel" placeholder="6XX XXX XXX" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>
            <div className="s-multi-hint">
              💡 Puedes comprar múltiples participaciones — cuantos más Bizums de 1€ envíes con tu código, más boletos tienes en el sorteo.
            </div>
            <div className="s-checkbox-group">
              <input type="checkbox" id="bases" checked={bases} onChange={e => setBases(e.target.checked)} />
              <label htmlFor="bases">Acepto las bases legales del sorteo y la política de privacidad. Entiendo que mi participación se confirma al realizar el pago por Bizum.</label>
            </div>
            <button className="s-btn-submit" disabled={!isValid} onClick={handleSubmit}>
              OBTENER MI CÓDIGO
            </button>
          </div>
        ) : (
          <div className="s-result">
            <div className="s-label">Tu código de participación</div>
            <div className="s-result-code">{userCode}</div>
            <p style={{ fontSize: '0.7rem', color: 'var(--gray-mid)', fontFamily: "'Space Mono', monospace" }}>
              Selecciónalo para copiarlo — lo necesitas para el Bizum
            </p>
            <div className="s-result-instructions">
              <div className="s-bizum-step">
                <div className="s-bizum-num">1</div>
                <p>Abre tu app del banco y ve a <strong>Bizum</strong></p>
              </div>
              <div className="s-bizum-step">
                <div className="s-bizum-num">2</div>
                <div>
                  <p>Envía <strong>1€</strong> o múltiplos (más euros = más boletos) al número:</p>
                  <div className="s-bizum-phone" onClick={copyPhone}>
                    📱 633 151 895
                    <span style={{ fontSize: '0.6rem', color: 'var(--gray-mid)' }}>· copiar</span>
                  </div>
                </div>
              </div>
              <div className="s-bizum-step">
                <div className="s-bizum-num">3</div>
                <p>En el <strong>concepto</strong> del Bizum escribe exactamente: <strong>{userCode}</strong></p>
              </div>
              <div className="s-bizum-step">
                <div className="s-bizum-num">✓</div>
                <p>¡Listo! Verificaremos tu pago y estarás dentro. Recibirás confirmación por email. <strong>El ganador se anuncia en Instagram.</strong></p>
              </div>
            </div>
            <button className="s-btn-reset" onClick={handleReset}>
              + Comprar otra participación
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="s-footer">
        Sorteo organizado de forma independiente · No vinculado oficialmente con Cero Estudios<br />
        El ganador será seleccionado aleatoriamente y anunciado públicamente por Instagram<br />
        Participaciones ilimitadas · 1€ por participación vía Bizum · Contacto: 633 151 895
      </footer>

      <div className={`s-toast${toast ? ' show' : ''}`}>Número copiado ✓</div>
    </div>
  )
}
