import { useState, useEffect, useRef } from 'react'

const CSS = `
  .h2-root {
    background: #050505;
    color: #E0E0E0;
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    font-family: 'Space Mono', monospace;
  }
  .h2-root * { box-sizing: border-box; }
  .h2-root ::-webkit-scrollbar { width: 3px; }
  .h2-root ::-webkit-scrollbar-track { background: #050505; }
  .h2-root ::-webkit-scrollbar-thumb { background: #8A2BE2; border-radius: 2px; }

  /* NAVBAR */
  .h2-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 2rem; background: rgba(5,5,5,0.85);
    backdrop-filter: blur(16px); border-bottom: 1px solid rgba(138,43,226,0.15);
    transition: all 0.3s;
  }
  .h2-nav-logo {
    font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.3em; text-transform: uppercase; color: #E0E0E0; opacity: 0.7;
  }
  .h2-nav-logo span { color: #8A2BE2; }
  .h2-nav-cta {
    background: #8A2BE2; color: #fff;
    font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    padding: 0.6rem 1.4rem; border: none; cursor: pointer;
    transition: all 0.25s; border-radius: 4px;
    box-shadow: 0 0 20px rgba(138,43,226,0.35);
    white-space: nowrap;
  }
  .h2-nav-cta:hover { background: #9d3df2; box-shadow: 0 0 35px rgba(138,43,226,0.6); transform: translateY(-1px); }

  /* HERO */
  .h2-hero {
    min-height: 100vh; display: flex; flex-direction: column;
    justify-content: center; align-items: center; text-align: center;
    padding: 6rem 2rem 4rem; position: relative; overflow: hidden;
  }
  .h2-hero-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(138,43,226,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(138,43,226,0.06) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none;
  }
  .h2-hero-glow {
    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(138,43,226,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .h2-badge {
    display: inline-flex; align-items: center; gap: 0.5rem;
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: #8A2BE2; border: 1px solid rgba(138,43,226,0.35);
    padding: 0.5rem 1.25rem; margin-bottom: 2rem;
    animation: h2-fadeDown 0.8s ease both;
  }
  .h2-badge::before { content: ''; width: 6px; height: 6px; background: #8A2BE2; border-radius: 50%; animation: h2-blink 1.5s infinite; }
  .h2-hero h1 {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: clamp(3rem, 10vw, 8rem); line-height: 0.95;
    letter-spacing: -0.02em; font-weight: 700;
    animation: h2-fadeUp 0.8s 0.15s ease both;
  }
  .h2-hero h1 em { font-style: normal; color: #8A2BE2; display: block; }
  .h2-hero-sub {
    font-size: clamp(0.75rem, 1.5vw, 0.9rem); color: rgba(224,224,224,0.5);
    max-width: 480px; line-height: 1.7; margin-top: 1.5rem;
    animation: h2-fadeUp 0.8s 0.3s ease both;
    font-family: 'Space Mono', monospace;
  }
  .h2-price-block {
    margin-top: 2.5rem; display: flex; align-items: center; gap: 1rem;
    animation: h2-fadeUp 0.8s 0.45s ease both;
  }
  .h2-price {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: 5rem; color: #E0E0E0; line-height: 1;
  }
  .h2-price-label {
    text-align: left; font-family: 'Space Mono', monospace;
    font-size: 0.6rem; letter-spacing: 0.25em; text-transform: uppercase;
    color: rgba(224,224,224,0.4); line-height: 1.8;
  }
  .h2-price-sep { width: 1px; height: 50px; background: rgba(138,43,226,0.3); }
  .h2-hero-ctas {
    display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;
    margin-top: 2.5rem; animation: h2-fadeUp 0.8s 0.6s ease both;
  }
  .h2-btn-primary {
    background: #8A2BE2; color: #fff;
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 1rem 2.5rem; border: none; cursor: pointer;
    transition: all 0.25s; border-radius: 4px;
    box-shadow: 0 0 30px rgba(138,43,226,0.4);
  }
  .h2-btn-primary:hover { background: #9d3df2; box-shadow: 0 0 50px rgba(138,43,226,0.7); transform: translateY(-2px); }
  .h2-btn-ghost {
    background: transparent; color: rgba(224,224,224,0.6);
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 1rem 2rem; border: 1px solid rgba(224,224,224,0.12); cursor: pointer;
    transition: all 0.25s; border-radius: 4px;
  }
  .h2-btn-ghost:hover { border-color: rgba(138,43,226,0.4); color: #E0E0E0; background: rgba(138,43,226,0.05); }
  .h2-fomo {
    display: inline-flex; align-items: center; gap: 0.6rem; margin-top: 2rem;
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: rgba(224,224,224,0.35); animation: h2-fadeUp 0.8s 0.75s ease both;
  }
  .h2-fomo-dot { width: 5px; height: 5px; background: #8A2BE2; border-radius: 50%; animation: h2-blink 1.5s infinite; }

  /* URGENCY BAR */
  .h2-urgency {
    background: rgba(138,43,226,0.08); border-top: 1px solid rgba(138,43,226,0.2);
    border-bottom: 1px solid rgba(138,43,226,0.2);
    padding: 1rem 2rem; overflow: hidden;
  }
  .h2-ticker {
    display: flex; gap: 4rem; white-space: nowrap; animation: h2-ticker 20s linear infinite;
  }
  .h2-ticker-item {
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(138,43,226,0.8); flex-shrink: 0;
  }
  .h2-ticker-item span { color: rgba(224,224,224,0.5); }

  /* SECTIONS */
  .h2-section { padding: 6rem 2rem; max-width: 900px; margin: 0 auto; }
  .h2-label {
    font-family: 'Space Mono', monospace; font-size: 0.55rem;
    letter-spacing: 0.5em; text-transform: uppercase; color: #8A2BE2; margin-bottom: 1rem;
  }
  .h2-heading {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1;
    font-weight: 700; letter-spacing: -0.01em; margin-bottom: 0.5rem;
  }

  /* PRIZE CARDS */
  .h2-prize-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: rgba(138,43,226,0.15); margin-top: 3rem; border: 1px solid rgba(138,43,226,0.15); }
  .h2-prize-card {
    background: #050505; padding: 2.5rem 2rem;
    transition: background 0.3s; position: relative; overflow: hidden;
  }
  .h2-prize-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #8A2BE2, transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .h2-prize-card:hover { background: rgba(138,43,226,0.04); }
  .h2-prize-card:hover::before { opacity: 1; }
  .h2-prize-num {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: 3.5rem; color: rgba(138,43,226,0.2); line-height: 1; margin-bottom: 1rem;
  }
  .h2-prize-title {
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.1em; margin-bottom: 0.75rem; color: #E0E0E0;
  }
  .h2-prize-desc { font-size: 0.8rem; color: rgba(224,224,224,0.45); line-height: 1.6; }
  .h2-prize-value {
    display: inline-block; margin-top: 1.25rem;
    font-family: 'Space Mono', monospace; font-size: 0.55rem;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: #8A2BE2; border: 1px solid rgba(138,43,226,0.3);
    padding: 0.3rem 0.75rem;
  }

  /* MID CTA */
  .h2-mid-cta {
    margin: 0; padding: 6rem 2rem; text-align: center;
    background: linear-gradient(180deg, transparent, rgba(138,43,226,0.06) 50%, transparent);
    border-top: 1px solid rgba(138,43,226,0.1); border-bottom: 1px solid rgba(138,43,226,0.1);
    position: relative; overflow: hidden;
  }
  .h2-mid-cta::before {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 500px; height: 300px;
    background: radial-gradient(ellipse, rgba(138,43,226,0.1) 0%, transparent 70%);
    pointer-events: none;
  }
  .h2-mid-cta-heading {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: clamp(2rem, 6vw, 5rem); font-weight: 700;
    line-height: 1; letter-spacing: -0.02em;
    max-width: 700px; margin: 0 auto 0.75rem;
  }
  .h2-mid-cta-heading em { font-style: normal; color: #8A2BE2; }
  .h2-mid-cta-sub {
    font-size: 0.75rem; color: rgba(224,224,224,0.4);
    letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 2.5rem;
  }

  /* STEPS */
  .h2-steps { margin-top: 3rem; display: flex; flex-direction: column; gap: 0; }
  .h2-step {
    display: grid; grid-template-columns: 80px 1fr; gap: 2rem; align-items: start;
    padding: 2.5rem 0; border-bottom: 1px solid rgba(224,224,224,0.06);
    position: relative;
  }
  .h2-step:last-child { border-bottom: none; }
  .h2-step-num {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: 3.5rem; color: rgba(138,43,226,0.25); line-height: 1;
    transition: color 0.3s;
  }
  .h2-step:hover .h2-step-num { color: rgba(138,43,226,0.6); }
  .h2-step-title {
    font-family: 'Space Mono', monospace; font-size: 0.8rem;
    letter-spacing: 0.08em; color: #E0E0E0; margin-bottom: 0.6rem;
  }
  .h2-step-desc { font-size: 0.8rem; color: rgba(224,224,224,0.45); line-height: 1.7; }
  .h2-step-tip {
    display: inline-block; margin-top: 0.75rem;
    background: rgba(138,43,226,0.12); color: #8A2BE2;
    font-family: 'Space Mono', monospace; font-size: 0.55rem;
    letter-spacing: 0.2em; text-transform: uppercase; padding: 0.3rem 0.75rem;
    border-radius: 2px;
  }

  /* FORM */
  .h2-form-outer { padding: 0 2rem 6rem; max-width: 620px; margin: 0 auto; }
  .h2-form-header { margin-bottom: 2.5rem; }
  .h2-form-wrapper {
    border: 1px solid rgba(138,43,226,0.2); padding: 2.5rem;
    position: relative; background: rgba(138,43,226,0.03);
  }
  .h2-form-wrapper::before {
    content: ''; position: absolute; top: -1px; left: 2rem; width: 80px; height: 2px;
    background: #8A2BE2;
  }
  .h2-input-group { margin-bottom: 1.75rem; }
  .h2-input-group label {
    display: block; font-family: 'Space Mono', monospace; font-size: 0.55rem;
    letter-spacing: 0.35em; text-transform: uppercase; color: rgba(224,224,224,0.4); margin-bottom: 0.6rem;
  }
  .h2-input-group input {
    width: 100%; background: transparent; border: none;
    border-bottom: 1px solid rgba(224,224,224,0.1);
    color: #E0E0E0; font-family: 'Space Mono', monospace; font-size: 0.9rem;
    padding: 0.75rem 0; outline: none; transition: border-color 0.3s;
  }
  .h2-input-group input:focus { border-color: #8A2BE2; }
  .h2-input-group input::placeholder { color: rgba(224,224,224,0.15); }
  .h2-multi-hint {
    background: rgba(138,43,226,0.08); border: 1px solid rgba(138,43,226,0.15);
    padding: 0.75rem 1rem; margin-bottom: 1.5rem;
    font-family: 'Space Mono', monospace; font-size: 0.6rem;
    letter-spacing: 0.1em; color: rgba(138,43,226,0.8); line-height: 1.6;
    border-radius: 2px;
  }
  .h2-checkbox-group { display: flex; align-items: flex-start; gap: 0.75rem; margin: 2rem 0 1.5rem; }
  .h2-checkbox-group input[type="checkbox"] {
    appearance: none; width: 16px; height: 16px; min-width: 16px;
    border: 1px solid rgba(224,224,224,0.2); background: transparent;
    cursor: pointer; position: relative; margin-top: 2px; transition: all 0.2s;
  }
  .h2-checkbox-group input[type="checkbox"]:checked { border-color: #8A2BE2; background: #8A2BE2; }
  .h2-checkbox-group input[type="checkbox"]:checked::after {
    content: '✓'; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    color: #fff; font-size: 0.65rem; font-weight: bold;
  }
  .h2-checkbox-group label { font-size: 0.7rem; color: rgba(224,224,224,0.4); line-height: 1.6; cursor: pointer; font-family: 'Space Mono', monospace; }
  .h2-btn-submit {
    width: 100%; background: #8A2BE2; color: #fff;
    font-family: 'Space Mono', monospace; font-size: 0.75rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    padding: 1.1rem; border: none; cursor: pointer; transition: all 0.25s;
    border-radius: 4px; box-shadow: 0 0 30px rgba(138,43,226,0.35); position: relative; overflow: hidden;
  }
  .h2-btn-submit:hover:not(:disabled) { background: #9d3df2; box-shadow: 0 0 50px rgba(138,43,226,0.7); transform: translateY(-2px); }
  .h2-btn-submit:disabled { opacity: 0.3; cursor: not-allowed; box-shadow: none; }
  .h2-btn-submit::after {
    content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    transform: translateX(-100%); transition: transform 0.6s;
  }
  .h2-btn-submit:hover:not(:disabled)::after { transform: translateX(100%); }

  /* RESULT */
  .h2-result {
    border: 1px solid rgba(138,43,226,0.3); padding: 2.5rem;
    text-align: center; animation: h2-fadeUp 0.6s ease;
    background: rgba(138,43,226,0.04);
    position: relative;
  }
  .h2-result::before {
    content: ''; position: absolute; top: -1px; left: 2rem; width: 80px; height: 2px;
    background: #8A2BE2;
  }
  .h2-result-label {
    font-family: 'Space Mono', monospace; font-size: 0.55rem;
    letter-spacing: 0.4em; text-transform: uppercase; color: #8A2BE2; margin-bottom: 1rem;
  }
  .h2-result-code {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: clamp(1.8rem, 6vw, 3rem); color: #E0E0E0;
    letter-spacing: 0.1em; padding: 1rem 1.5rem;
    border: 1px dashed rgba(138,43,226,0.4); user-select: all;
    background: rgba(138,43,226,0.06); margin: 0.75rem 0;
  }
  .h2-result-note {
    font-family: 'Space Mono', monospace; font-size: 0.65rem;
    color: rgba(224,224,224,0.35); letter-spacing: 0.1em;
  }
  .h2-bizum-steps { text-align: left; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(224,224,224,0.06); }
  .h2-bizum-row { display: grid; grid-template-columns: 28px 1fr; gap: 1rem; margin-bottom: 1.5rem; align-items: start; }
  .h2-bizum-n {
    font-family: 'Clash Display', 'Bebas Neue', sans-serif;
    font-size: 1.5rem; color: rgba(138,43,226,0.5); line-height: 1;
  }
  .h2-bizum-text { font-size: 0.78rem; color: rgba(224,224,224,0.5); line-height: 1.6; }
  .h2-bizum-text strong { color: #E0E0E0; font-weight: 700; }
  .h2-phone-btn {
    display: inline-flex; align-items: center; gap: 0.6rem; margin: 0.5rem 0;
    background: rgba(138,43,226,0.1); border: 1px solid rgba(138,43,226,0.25);
    padding: 0.6rem 1.2rem; cursor: pointer; transition: all 0.2s; border-radius: 4px;
    font-family: 'Space Mono', monospace; font-size: 0.85rem; color: #8A2BE2;
  }
  .h2-phone-btn:hover { background: rgba(138,43,226,0.2); border-color: rgba(138,43,226,0.5); }
  .h2-phone-btn span { font-size: 0.55rem; color: rgba(224,224,224,0.3); letter-spacing: 0.2em; text-transform: uppercase; }
  .h2-btn-reset {
    width: 100%; margin-top: 2rem; background: transparent; color: rgba(224,224,224,0.5);
    border: 1px solid rgba(224,224,224,0.12); padding: 0.9rem;
    font-family: 'Space Mono', monospace; font-size: 0.65rem; letter-spacing: 0.2em;
    text-transform: uppercase; cursor: pointer; transition: all 0.25s; border-radius: 4px;
  }
  .h2-btn-reset:hover { border-color: rgba(138,43,226,0.4); color: #8A2BE2; background: rgba(138,43,226,0.05); }

  /* TOAST */
  .h2-toast {
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(120px);
    background: #8A2BE2; color: #fff; border-radius: 4px;
    font-family: 'Space Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.2em; text-transform: uppercase;
    padding: 0.75rem 1.5rem; z-index: 10000; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
    box-shadow: 0 8px 30px rgba(138,43,226,0.5);
  }
  .h2-toast.show { transform: translateX(-50%) translateY(0); }

  /* FOOTER */
  .h2-footer {
    text-align: center; padding: 3rem 2rem;
    border-top: 1px solid rgba(224,224,224,0.05);
    font-family: 'Space Mono', monospace; font-size: 0.55rem;
    color: rgba(224,224,224,0.2); letter-spacing: 0.15em; line-height: 2.5;
  }

  /* ANIMATIONS */
  @keyframes h2-fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes h2-fadeDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes h2-blink { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
  @keyframes h2-ticker {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* RESPONSIVE */
  @media (max-width: 700px) {
    .h2-nav { padding: 0.85rem 1.25rem; }
    .h2-prize-grid { grid-template-columns: 1fr; }
    .h2-step { grid-template-columns: 50px 1fr; gap: 1.25rem; }
    .h2-step-num { font-size: 2.5rem; }
    .h2-form-wrapper { padding: 1.75rem 1.25rem; }
    .h2-section { padding: 4rem 1.25rem; }
    .h2-form-outer { padding: 0 1.25rem 4rem; }
    .h2-mid-cta { padding: 4rem 1.25rem; }
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

export default function Sorteo2() {
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
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap'
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
    <div className="h2-root">
      <style>{CSS}</style>

      {/* NAV */}
      <nav className="h2-nav">
        <div className="h2-nav-logo">Helicon <span>×</span> Sorteo</div>
        <button className="h2-nav-cta" onClick={scrollToForm}>
          Participa ya — 1€ →
        </button>
      </nav>

      {/* HERO */}
      <div className="h2-hero">
        <div className="h2-hero-grid" />
        <div className="h2-hero-glow" />

        <div className="h2-badge">Sorteo exclusivo · Cero Estudios Madrid</div>

        <h1>
          GRABA EN
          <em>CERO ESTUDIOS</em>
          MADRID
        </h1>

        <p className="h2-hero-sub">
          Una sesión completa de grabación y mezcla en uno de los estudios más importantes de Madrid.
          La decisión más fácil de tu carrera.
        </p>

        <div className="h2-price-block">
          <div className="h2-price">1€</div>
          <div className="h2-price-sep" />
          <div className="h2-price-label">
            por participación<br />
            vía Bizum<br />
            sin límite de entradas
          </div>
        </div>

        <div className="h2-hero-ctas">
          <button className="h2-btn-primary" onClick={scrollToForm}>
            Quiero mi código — Participa ya
          </button>
          <button className="h2-btn-ghost" onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}>
            ¿Cómo funciona?
          </button>
        </div>

        <div className="h2-fomo">
          <div className="h2-fomo-dot" />
          Plazas abiertas · 1€ por boleto · Sorteo público
        </div>
      </div>

      {/* TICKER */}
      <div className="h2-urgency">
        <div className="h2-ticker">
          {tickerDouble.map((item, i) => (
            <span key={i} className="h2-ticker-item">
              {item.startsWith('🎙') ? item : <><span>·</span> {item.replace('· ', '')}</>}
            </span>
          ))}
        </div>
      </div>

      {/* PRIZE */}
      <section className="h2-section">
        <div className="h2-label">· El premio ·</div>
        <div className="h2-heading">LO QUE TE LLEVAS</div>
        <p style={{ color: 'rgba(224,224,224,0.45)', fontSize: '0.85rem', lineHeight: 1.8, maxWidth: 600, fontFamily: "'Space Mono', monospace", marginTop: '0.5rem' }}>
          Premio valorado en más de <strong style={{ color: '#8A2BE2' }}>500€</strong> —&nbsp;
          sesión completa en <strong style={{ color: '#E0E0E0' }}>Cero Estudios</strong>, donde han grabado algunos de los artistas más relevantes de la escena actual en Madrid.
          Tú entras por 1€.
        </p>

        <div className="h2-prize-grid">
          {[
            {
              n: '01', title: 'Sesión de grabación',
              desc: 'Sala profesional, técnico de sonido y tiempo ilimitado para grabar tu tema como merece.',
              value: 'Incluido',
            },
            {
              n: '02', title: 'Mezcla profesional',
              desc: 'Tu canción mezclada por el equipo del estudio. Lista para subir a Spotify, Apple Music o cualquier plataforma.',
              value: 'Incluido',
            },
            {
              n: '03', title: 'Participaciones ilimitadas',
              desc: 'Cada euro es un boleto más. Aumenta tus probabilidades sin límite — 1€ = 1 boleto extra.',
              value: 'Sin límite',
            },
          ].map(c => (
            <div key={c.n} className="h2-prize-card">
              <div className="h2-prize-num">{c.n}</div>
              <div className="h2-prize-title">{c.title}</div>
              <p className="h2-prize-desc">{c.desc}</p>
              <span className="h2-prize-value">{c.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* MID CTA */}
      <div className="h2-mid-cta">
        <div className="h2-mid-cta-heading">
          El próximo artista que grabe<br />
          en Cero podrías ser <em>tú.</em>
        </div>
        <p className="h2-mid-cta-sub">Por solo 1€. Sin excusas.</p>
        <button className="h2-btn-primary" onClick={scrollToForm} style={{ fontSize: '0.8rem', padding: '1rem 3rem' }}>
          Participa ahora →
        </button>
      </div>

      {/* HOW IT WORKS */}
      <section className="h2-section" id="como-funciona">
        <div className="h2-label">· Cómo funciona ·</div>
        <div className="h2-heading">3 PASOS Y ESTÁS DENTRO</div>

        <div className="h2-steps">
          {[
            {
              n: '01',
              title: 'Rellena el formulario',
              desc: 'Introduce tu nombre, email y teléfono. Recibirás al instante tu código único de participación — guárdalo bien.',
              tip: '< 30 segundos',
            },
            {
              n: '02',
              title: 'Envía tu Bizum',
              desc: 'Haz un Bizum de 1€ (o más, si quieres más boletos) al número que te indicamos. En el concepto escribe tu código.',
              tip: 'Cada 1€ = 1 boleto más',
            },
            {
              n: '03',
              title: 'Espera al sorteo',
              desc: 'Verificamos tu pago y estarás dentro. El ganador se anuncia públicamente en Instagram para total transparencia.',
              tip: 'Sorteo público',
            },
          ].map(s => (
            <div key={s.n} className="h2-step">
              <div className="h2-step-num">{s.n}</div>
              <div>
                <div className="h2-step-title">{s.title}</div>
                <p className="h2-step-desc">{s.desc}</p>
                <span className="h2-step-tip">{s.tip}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <button className="h2-btn-primary" onClick={scrollToForm}>
            Empieza aquí — es gratis rellenar →
          </button>
        </div>
      </section>

      {/* FORM */}
      <div className="h2-form-outer" id="participar" ref={formRef}>
        <div className="h2-form-header">
          <div className="h2-label">· Tu turno ·</div>
          <div className="h2-heading">CONSIGUE TU CÓDIGO</div>
          <p style={{ color: 'rgba(224,224,224,0.35)', fontSize: '0.7rem', fontFamily: "'Space Mono', monospace", marginTop: '0.5rem', lineHeight: 1.7 }}>
            Rellena el formulario, te damos tu código y te explicamos cómo hacer el Bizum.
          </p>
        </div>

        {!showResult ? (
          <div className="h2-form-wrapper">
            <div className="h2-input-group">
              <label>Nombre completo</label>
              <input type="text" placeholder="Tu nombre artístico o real" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="h2-input-group">
              <label>Email</label>
              <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="h2-input-group">
              <label>Teléfono</label>
              <input type="tel" placeholder="6XX XXX XXX" value={telefono} onChange={e => setTelefono(e.target.value)} />
            </div>

            <div className="h2-multi-hint">
              💡 Puedes comprar múltiples participaciones — cuantos más Bizums de 1€ envíes con tu código, más boletos tienes en el sorteo.
            </div>

            <div className="h2-checkbox-group">
              <input type="checkbox" id="h2-bases" checked={bases} onChange={e => setBases(e.target.checked)} />
              <label htmlFor="h2-bases">
                Acepto las bases legales del sorteo y la política de privacidad. Entiendo que mi participación se confirma al realizar el pago por Bizum.
              </label>
            </div>

            <button className="h2-btn-submit" disabled={!isValid} onClick={handleSubmit}>
              {isValid ? 'Obtener mi código de participación →' : 'Rellena todos los campos'}
            </button>
          </div>
        ) : (
          <div className="h2-result">
            <div className="h2-result-label">Tu código de participación</div>
            <div className="h2-result-code">{userCode}</div>
            <p className="h2-result-note">Selecciónalo para copiarlo — lo necesitas para el Bizum</p>

            <div className="h2-bizum-steps">
              <div className="h2-bizum-row">
                <div className="h2-bizum-n">1</div>
                <p className="h2-bizum-text">Abre tu app del banco y ve a <strong>Bizum</strong></p>
              </div>
              <div className="h2-bizum-row">
                <div className="h2-bizum-n">2</div>
                <div>
                  <p className="h2-bizum-text">
                    Envía <strong>1€</strong> o múltiplos (más euros = más boletos) al número:
                  </p>
                  <div className="h2-phone-btn" onClick={copyPhone}>
                    📱 633 151 895
                    <span>· copiar</span>
                  </div>
                </div>
              </div>
              <div className="h2-bizum-row">
                <div className="h2-bizum-n">3</div>
                <p className="h2-bizum-text">
                  En el <strong>concepto</strong> del Bizum escribe exactamente: <strong>{userCode}</strong>
                </p>
              </div>
              <div className="h2-bizum-row">
                <div className="h2-bizum-n" style={{ color: '#8A2BE2' }}>✓</div>
                <p className="h2-bizum-text">
                  ¡Listo! Verificaremos tu pago y estarás dentro. Recibirás confirmación por email.<br />
                  <strong>El ganador se anuncia en Instagram.</strong>
                </p>
              </div>
            </div>

            <button className="h2-btn-reset" onClick={handleReset}>
              + Comprar otra participación
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="h2-footer">
        Sorteo organizado de forma independiente · No vinculado oficialmente con Cero Estudios<br />
        El ganador será seleccionado aleatoriamente y anunciado públicamente por Instagram<br />
        Participaciones ilimitadas · 1€ por participación vía Bizum · Contacto: 633 151 895
      </footer>

      <div className={`h2-toast${toast ? ' show' : ''}`}>Número copiado ✓</div>
    </div>
  )
}
