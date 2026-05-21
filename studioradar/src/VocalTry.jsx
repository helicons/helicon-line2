import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Mic, Music, Upload, ArrowLeft, Check, X,
  Play, Pause, RotateCcw, Star, ShoppingCart,
  MessageCircle, AlertCircle, MapPin, Disc3,
  Users, Globe, AtSign, Link, TrendingUp, Award, Send,
  Zap, Activity,
} from "lucide-react";
import { analyzeAudio, suggestGenres, commonProgressions } from "./lib/audioAnalysis";

const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL ?? "http://localhost:8000";
const PREVIEW_SECS = 30;
const LOAD_MS = 10000;

const LOADING_TEXTS = [
  "Buscando el beat perfecto…",
  "Analizando tu vocal…",
  "Sincronizando el tempo…",
  "Mezclando vocal y beat…",
  "Ajustando el balance…",
  "Verificando compatibilidad…",
  "Preparando el preview…",
  "Afinando los niveles…",
  "Casi listo…",
  "Generando los previews…",
];

const HELICON_STATS = [
  { icon: <Disc3 className="w-4 h-4 text-violet-400" />, stat: "+500M", text: "streams generados con nuestros productores de elite" },
  { icon: <MapPin className="w-4 h-4 text-violet-400" />, stat: "Radar", text: "Encuentra los estudios de grabación más cercanos a ti en nuestro mapa" },
  { icon: <Users className="w-4 h-4 text-violet-400" />, stat: "+2K", text: "artistas han encontrado su sonido y firmado deals a través de Helicon" },
  { icon: <Globe className="w-4 h-4 text-violet-400" />, stat: "+30", text: "países con productores verificados activos en nuestra red" },
];

const GENRE_LIST = [
  "Trap", "R&B", "Drill", "Plugg", "Boom Bap", "Rage",
  "Melodic", "Afrobeats", "Lo-Fi", "Soul", "Cloud Rap",
  "Neo Soul", "Alt", "UK", "Dark", "Chill", "Bedroom Pop",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fmt = (s) => `0:${String(Math.floor(s)).padStart(2, "0")}`;
const BAR_SEED = (seed, count = 40) =>
  Array.from({ length: count }, (_, i) =>
    24 + Math.abs(Math.sin(i * 0.6 + seed) * 52 + Math.sin(i * 0.25 + seed * 2) * 24)
  );

// ── Inline UI Components ──────────────────────────────────────

function GlassButton({ children, className = "", contentClassName = "", size = "md", glassColor, disabled, onClick }) {
  const pad = size === "sm" ? "px-4 py-2" : "px-6 py-3";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative overflow-hidden rounded-2xl transition-all active:scale-95 select-none ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:brightness-110"} ${pad} ${className}`}
      style={{
        background: glassColor ?? "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
      }}
    >
      <div className={`flex items-center justify-center gap-2 text-white font-semibold text-sm ${contentClassName}`}>
        {children}
      </div>
    </button>
  );
}

function Spinner({ size = 48 }) {
  return (
    <div
      className="rounded-full border-2 border-t-transparent animate-spin"
      style={{ width: size, height: size, borderColor: "rgba(167,139,250,0.8)", borderTopColor: "transparent" }}
    />
  );
}

function MorphingText({ texts, className = "", style = {} }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % texts.length), 2200);
    return () => clearInterval(id);
  }, [texts.length]);
  return (
    <div className={`text-center transition-opacity duration-500 ${className}`} style={style}>
      {texts[idx]}
    </div>
  );
}

function AuroraBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full blur-[120px]"
        style={{ background: "rgba(124,58,237,0.12)" }} />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full blur-[140px]"
        style={{ background: "rgba(67,56,202,0.10)" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px]"
        style={{ background: "rgba(139,92,246,0.06)" }} />
    </div>
  );
}

// ── HeliconStats ──────────────────────────────────────────────

function HeliconStats() {
  return (
    <div className="w-full rounded-3xl overflow-hidden"
      style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.18)" }}>
      <div className="px-5 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
        <div className="w-5 h-5 rounded-md flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.3)" }}>
          <Disc3 className="w-3 h-3 text-violet-300" />
        </div>
        <span className="text-violet-300/80 text-xs font-bold uppercase tracking-widest">Helicon Radar</span>
      </div>
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {HELICON_STATS.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "rgba(124,58,237,0.15)" }}>
              {s.icon}
            </div>
            <div>
              <div className="text-white font-black text-base leading-tight">{s.stat}</div>
              <div className="text-white/45 text-xs leading-relaxed mt-0.5">{s.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── LoadingScreen ─────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-12 w-full max-w-lg min-h-[65vh]">
      <MorphingText
        texts={LOADING_TEXTS}
        className="text-violet-200 h-20 md:h-28"
        style={{ fontSize: "clamp(1.4rem, 4vw, 2.1rem)" }}
      />
      <div className="relative rounded-full p-5"
        style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "0 0 32px rgba(124,58,237,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}>
        <Spinner size={64} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: "0 0 28px rgba(167,139,250,0.4)" }} />
      </div>
      <p className="text-white/20 text-xs tracking-[0.3em] uppercase">Helicon Radar</p>
    </div>
  );
}

// ── GenrePicker ───────────────────────────────────────────────

function GenrePicker({ selected, onChange }) {
  function toggle(g) {
    onChange(selected.includes(g) ? selected.filter(x => x !== g) : [...selected, g]);
  }
  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-xs uppercase tracking-widest">Géneros</p>
        {selected.length > 0 && (
          <button onClick={() => onChange([])} className="text-white/20 text-xs hover:text-white/50 transition-colors">
            Limpiar
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {GENRE_LIST.map(g => {
          const active = selected.includes(g);
          return (
            <button key={g} onClick={() => toggle(g)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 select-none"
              style={active ? {
                background: "rgba(124,58,237,0.35)",
                border: "1px solid rgba(167,139,250,0.5)",
                color: "rgba(233,213,255,0.95)",
                boxShadow: "0 0 10px rgba(124,58,237,0.3)",
              } : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.35)",
              }}
            >{g}</button>
          );
        })}
      </div>
    </div>
  );
}

// ── BeatCard ──────────────────────────────────────────────────

function BeatCard({ beat, index, vocalFilename, activeId, onActivate, onMoreFromProducer }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [mixing, setMixing] = useState(false);
  const isPlaying = activeId === beat.id;
  const bars = useMemo(() => BAR_SEED(index * 3.7), [index]);

  const mixSrc = `${FASTAPI_URL}/vocal/mix-preview?vocal_filename=${encodeURIComponent(vocalFilename)}&beat_id=${beat.id}&preview_start=40&preview_duration=30`;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!isPlaying && !a.paused) a.pause();
  }, [isPlaying]);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); onActivate(null); return; }
    setMixing(true);
    onActivate(beat.id);
    try { await a.play(); } catch { onActivate(null); }
    finally { setMixing(false); }
  }

  function restart() {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    setCurrent(0);
    onActivate(beat.id);
    a.play().catch(() => {});
  }

  function onTimeUpdate() {
    const a = audioRef.current;
    if (!a) return;
    setCurrent(a.currentTime);
    if (a.currentTime >= PREVIEW_SECS) {
      a.pause(); a.currentTime = 0; setCurrent(0); onActivate(null);
    }
  }

  const progress = Math.min(current / PREVIEW_SECS, 1);
  const compatLabel =
    beat.compatScore === 4 ? "Misma key" :
    beat.compatScore === 3 ? "Relativa"  :
    beat.compatScore === 2 ? "Paralela"  : null;

  return (
    <div className="w-full rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(10px)" }}>

      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-white/20 font-black text-xs tabular-nums flex-shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <div className="text-white font-bold text-base leading-tight truncate">{beat.name}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-white/40 text-xs font-mono">{beat.key}</span>
              <span className="text-white/15 text-xs">·</span>
              <span className="text-white/30 text-xs">{beat.camelot}</span>
              {beat.compatScore >= 3 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: "rgba(167,139,250,0.15)", color: "rgba(167,139,250,0.9)", border: "1px solid rgba(167,139,250,0.25)" }}>
                  <Zap className="w-2.5 h-2.5" />{compatLabel}
                </span>
              )}
              {beat.compatScore === 2 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                  {compatLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-white font-black text-sm tabular-nums">{beat.bpm}</div>
          <div className="text-white/25 text-xs">BPM</div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col sm:flex-row">

        {/* Player */}
        <div className="flex-1 p-4 space-y-3">
          <audio
            ref={audioRef}
            src={mixSrc}
            preload="none"
            onTimeUpdate={onTimeUpdate}
            onEnded={() => { setCurrent(0); onActivate(null); }}
            onCanPlay={() => setMixing(false)}
          />

          {/* Waveform */}
          <div className="flex items-center gap-[2px] h-12">
            {bars.map((h, i) => {
              const filled = i / bars.length < progress;
              return (
                <div key={i} className="flex-1 rounded-full"
                  style={{
                    height: `${h}%`,
                    background: filled ? "rgba(167,139,250,0.9)" : "rgba(124,58,237,0.18)",
                    transition: "background 0.15s",
                  }}
                />
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="h-[2px] rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-violet-500 transition-all duration-300"
              style={{ width: `${progress * 100}%` }} />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggle}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: isPlaying ? "rgba(167,139,250,0.25)" : "rgba(124,58,237,0.22)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  boxShadow: isPlaying ? "0 0 16px rgba(167,139,250,0.35)" : "none",
                }}>
                {mixing
                  ? <Spinner size={14} />
                  : isPlaying
                    ? <Pause className="w-3.5 h-3.5 text-violet-200" />
                    : <Play className="w-3.5 h-3.5 text-violet-200 translate-x-px" />}
              </button>
              <button onClick={restart}
                className="w-7 h-7 rounded-full flex items-center justify-center opacity-30 hover:opacity-70 transition-opacity">
                <RotateCcw className="w-3 h-3 text-white" />
              </button>
              <div className="flex gap-1 ml-1 flex-wrap">
                {beat.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-white/40 text-xs font-mono tabular-nums">
              {fmt(current)} <span className="text-white/15">/ {fmt(PREVIEW_SECS)}</span>
            </span>
          </div>
        </div>

        {/* Producer card */}
        <div className="sm:w-52 flex-shrink-0 p-4 flex flex-col gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
              {beat.producer.avatar}
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-sm leading-tight truncate">{beat.producer.name}</div>
              <div className="text-white/35 text-xs truncate">{beat.producer.handle}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-white/60 text-xs font-semibold">{beat.producer.rating}</span>
            </div>
            <div className="text-white/20 text-xs">{beat.producer.sales?.toLocaleString()} ventas</div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            <button className="w-full rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "rgba(124,58,237,0.3)",
                border: "1px solid rgba(167,139,250,0.35)",
                color: "rgba(233,213,255,0.95)",
                boxShadow: "0 0 12px rgba(124,58,237,0.25)",
              }}>
              <ShoppingCart className="w-3.5 h-3.5" />
              Comprar · ${beat.producer.price}
            </button>
            <button className="w-full rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.55)",
              }}>
              <MessageCircle className="w-3.5 h-3.5" />
              Contactar
            </button>
            <button onClick={() => onMoreFromProducer(beat.producer.name)}
              className="w-full rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-80 active:scale-95"
              style={{ color: "rgba(167,139,250,0.65)" }}>
              <Disc3 className="w-3 h-3" />
              Más de {beat.producer.name.split(" ")[0]}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Field (ProducerView input) ────────────────────────────────

function Field({ label, icon, placeholder, value, onChange, type = "text", required, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs text-white/40 uppercase tracking-widest">
        {icon}{label}
        {required && <span className="text-violet-400">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition-all"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", caretColor: "#a78bfa" }}
        onFocus={(e) => { e.currentTarget.style.border = "1px solid rgba(167,139,250,0.4)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.12)"; }}
        onBlur={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
      />
      {hint && <p className="text-white/20 text-xs pl-1">{hint}</p>}
    </div>
  );
}

// ── ProducerView ──────────────────────────────────────────────

function ProducerView() {
  const [phase, setPhase] = useState("form");
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [beatLink, setBeatLink] = useState("");
  const [streams, setStreams] = useState("");
  const [placements, setPlacements] = useState("");
  const [email, setEmail] = useState("");
  const [errMsg, setErrMsg] = useState("");

  const canSubmit = name.trim() && instagram.trim() && beatLink.trim();

  async function submit() {
    if (!canSubmit) return;
    setPhase("sending");
    try {
      const res = await fetch(`${FASTAPI_URL}/producer/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, instagram, beatLink, streams, placements, email }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPhase("done");
    } catch {
      setErrMsg("No se pudo enviar. Intenta de nuevo.");
      setPhase("error");
    }
  }

  if (phase === "sending") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center min-h-[50vh] justify-center">
        <Spinner size={56} />
        <p className="text-white/50 text-sm">Enviando tu perfil…</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center min-h-[50vh] justify-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(167,139,250,0.35)", boxShadow: "0 0 32px rgba(124,58,237,0.3)" }}>
          <Check className="w-8 h-8 text-violet-300" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">¡Perfil enviado!</h2>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            Nuestro equipo revisará tu perfil y se pondrá en contacto contigo pronto.
          </p>
        </div>
        <p className="text-violet-400/60 text-xs tracking-widest uppercase">Helicon Radar</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-4 items-center w-full max-w-sm text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-white font-semibold">{errMsg}</p>
        <GlassButton className="w-full" onClick={() => setPhase("form")}>Reintentar</GlassButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 items-center w-full max-w-sm">
      <div className="text-center mb-1">
        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-1">Producer</p>
        <h2 className="text-3xl font-black text-white tracking-tight">Tu perfil</h2>
        <p className="text-white/40 text-sm mt-1">Cuéntanos sobre tu música y te contactamos.</p>
      </div>

      <div className="w-full flex flex-col gap-3">
        <Field label="Nombre / Alias" icon={<Mic className="w-3 h-3" />} placeholder="ej. Storm Drip" value={name} onChange={setName} required />
        <Field label="Instagram" icon={<AtSign className="w-3 h-3" />} placeholder="@tuhandle" value={instagram} onChange={setInstagram} required />
        <Field label="Link de beats" icon={<Link className="w-3 h-3" />} placeholder="Beatstars, SoundCloud, Drive…" value={beatLink} onChange={setBeatLink} required hint="Beatstars, SoundCloud, Google Drive, etc." />
        <Field label="Streams totales" icon={<TrendingUp className="w-3 h-3" />} placeholder="ej. 2.5M streams en Spotify" value={streams} onChange={setStreams} hint="Opcional — suma de todos tus canales" />
        <Field label="Placements destacados" icon={<Award className="w-3 h-3" />} placeholder="ej. Rosalía, Bad Bunny…" value={placements} onChange={setPlacements} hint="Opcional — artistas con los que has trabajado" />
        <Field label="Tu email" icon={<Send className="w-3 h-3" />} placeholder="para que podamos responderte" value={email} onChange={setEmail} type="email" hint="Opcional — si quieres respuesta directa" />
      </div>

      <GlassButton className="w-full mt-1" contentClassName="gap-2" onClick={submit} disabled={!canSubmit}>
        Enviar perfil
        <Send className="w-4 h-4" />
      </GlassButton>

      <p className="text-white/15 text-xs text-center leading-relaxed">
        Campos marcados con <span className="text-violet-400">*</span> son obligatorios.<br />
        Tu información no se comparte con terceros.
      </p>
    </div>
  );
}

// ── ArtistView ────────────────────────────────────────────────

function ArtistView() {
  const [phase, setPhase] = useState("upload");
  const [file, setFile] = useState(null);
  const [recording, setRecording] = useState(false);
  const [bpm, setBpm] = useState(140);
  const [detectedKey, setDetectedKey] = useState(null);
  const [detectedMode, setDetectedMode] = useState(null);
  const [analysisPct, setAnalysisPct] = useState(0);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [vocalFilename, setVocalFilename] = useState("");
  const [response, setResponse] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [producerFilter, setProducerFilter] = useState("");
  const inputRef = useRef(null);

  const hasAudio = !!file || recording;

  const runAnalysis = useCallback(async (f) => {
    setPhase("analyzing");
    setAnalysisPct(0);
    try {
      const result = await analyzeAudio(f, setAnalysisPct);
      setDetectedKey(result.key);
      setDetectedMode(result.mode);
      if (result.bpm) setBpm(result.bpm);
    } catch {
      // Analysis failed — continue with defaults
    }
    setPhase("upload");
  }, []);

  function handleFile(f) {
    setFile(f);
    setRecording(false);
    runAnalysis(f);
  }

  async function findBeats(producer = "") {
    setPhase("loading");
    setActiveId(null);
    setProducerFilter(producer);
    try {
      const url = new URL(`${FASTAPI_URL}/vocal/analyze`);
      if (selectedGenres.length > 0) url.searchParams.set("genres", selectedGenres.join(","));
      if (producer) url.searchParams.set("producer", producer);

      const fd = new FormData();
      if (file) fd.append("file", file);

      const [raw] = await Promise.all([
        fetch(url.toString(), { method: "POST", body: fd }).then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        }),
        sleep(LOAD_MS),
      ]);

      // Map FastAPI snake_case → camelCase
      const data = {
        vocalFilename:   raw.vocal_filename,
        detectedBpm:     raw.detected_bpm,
        detectedKey:     raw.detected_key,
        detectedCamelot: raw.detected_camelot,
        detectedMode:    raw.detected_mode,
        availableGenres: raw.available_genres,
        beats: (raw.beats ?? []).map(b => ({
          id:          b.id,
          name:        b.name,
          bpm:         b.bpm,
          key:         b.key,
          camelot:     b.camelot,
          tags:        b.tags,
          producer:    b.producer,
          compatScore: b.compat_score,
        })),
      };

      setVocalFilename(data.vocalFilename);
      setResponse(data);
      setPhase("result");
    } catch (e) {
      console.error(e);
      setErrorMsg("No se pudo buscar beats. Intenta de nuevo.");
      setPhase("error");
    }
  }

  if (phase === "analyzing") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-sm text-center min-h-[50vh] justify-center">
        <Spinner size={48} />
        <div>
          <p className="text-white font-bold text-lg">Analizando tu vocal…</p>
          <p className="text-white/35 text-sm mt-1">Detectando key, BPM y género</p>
        </div>
        <div className="w-48 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full rounded-full bg-violet-500 transition-all duration-300" style={{ width: `${analysisPct}%` }} />
        </div>
        <p className="text-white/20 text-xs">{analysisPct}%</p>
      </div>
    );
  }

  if (phase === "loading") return <LoadingScreen />;

  if (phase === "error") {
    return (
      <div className="flex flex-col gap-4 items-center w-full max-w-sm text-center">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-white font-semibold">{errorMsg}</p>
        <GlassButton className="w-full" onClick={() => setPhase("upload")}>Reintentar</GlassButton>
      </div>
    );
  }

  if (phase === "result" && response) {
    const genres = detectedKey && detectedMode ? suggestGenres(bpm, detectedMode) : [];
    const progressions = detectedKey && detectedMode ? commonProgressions(detectedKey, detectedMode) : [];

    return (
      <div className="flex flex-col gap-5 items-center w-full max-w-2xl">
        <div className="text-center">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-1">
            {producerFilter ? `Más de ${producerFilter.split(" ")[0]}` : "Preview · 30 seg cada uno"}
          </p>
          <h2 className="text-3xl font-black text-white tracking-tight">
            {producerFilter ? `Beats de ${producerFilter}` : "3 beats para tu vocal"}
          </h2>
          <p className="text-white/30 text-sm mt-1">
            {bpm} BPM
            {detectedKey && detectedMode && (
              <> · <span className="text-violet-400/70">{detectedKey} {detectedMode === "minor" ? "menor" : "mayor"}</span></>
            )}
          </p>
        </div>

        {detectedKey && detectedMode && !producerFilter && (
          <div className="w-full rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-300/70 text-xs font-bold uppercase tracking-widest">Análisis de tu vocal</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-white/30 text-xs mb-1">Key detectada</div>
                <div className="text-white font-black text-lg">{detectedKey} <span className="text-violet-400 text-sm font-bold">{detectedMode === "minor" ? "m" : ""}</span></div>
              </div>
              <div>
                <div className="text-white/30 text-xs mb-1">BPM detectado</div>
                <div className="text-white font-black text-lg">{bpm}</div>
              </div>
              <div className="col-span-2">
                <div className="text-white/30 text-xs mb-1">Géneros compatibles</div>
                <div className="flex flex-wrap gap-1">
                  {genres.map(g => (
                    <span key={g} className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(124,58,237,0.15)", color: "rgba(196,181,253,0.8)", border: "1px solid rgba(124,58,237,0.2)" }}>
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {progressions.length > 0 && (
              <div>
                <div className="text-white/30 text-xs mb-1.5">Progresiones frecuentes en {detectedKey} {detectedMode === "minor" ? "menor" : "mayor"}</div>
                <div className="flex flex-col gap-1">
                  {progressions.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-violet-400/40 text-xs w-3">{i + 1}.</span>
                      <span className="text-white/50 text-xs font-mono">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4 w-full">
          {response.beats.map((beat, i) => (
            <BeatCard
              key={`${beat.id}-${beat.name}`}
              beat={beat}
              index={i}
              vocalFilename={vocalFilename}
              activeId={activeId}
              onActivate={setActiveId}
              onMoreFromProducer={(name) => findBeats(name)}
            />
          ))}
        </div>

        <HeliconStats />

        <div className="flex gap-3 w-full pb-2">
          <GlassButton className="flex-1" size="sm"
            onClick={() => {
              setPhase("upload"); setResponse(null); setFile(null);
              setRecording(false); setProducerFilter("");
              setDetectedKey(null); setDetectedMode(null);
              setSelectedGenres([]); setVocalFilename("");
            }}>
            Nueva vocal
          </GlassButton>
          <GlassButton className="flex-1" size="sm"
            onClick={() => { setResponse(null); findBeats(""); }}>
            {producerFilter ? "Ver todos los beats" : "Otros beats"}
          </GlassButton>
        </div>
      </div>
    );
  }

  // Upload phase
  return (
    <div className="flex flex-col gap-4 items-center w-full max-w-sm">
      <div className="text-center mb-2">
        <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-1">Artist</p>
        <h2 className="text-3xl font-black text-white tracking-tight">Tu vocal</h2>
        <p className="text-white/40 text-sm mt-1">Sube o graba tu voz para comenzar.</p>
      </div>

      <input ref={inputRef} type="file" accept="audio/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

      <GlassButton className="w-full py-0" contentClassName="justify-start gap-4 py-5"
        onClick={() => inputRef.current?.click()}>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          {file ? <Check className="w-5 h-5 text-green-300" /> : <Upload className="w-5 h-5" />}
        </div>
        <div className="text-left flex-1 min-w-0">
          <div className="font-bold text-base leading-tight">Subir vocal</div>
          <div className="text-xs opacity-55 mt-0.5 truncate">
            {file ? file.name : "MP3, WAV, FLAC — hasta 50 MB"}
          </div>
        </div>
        {file && (
          <button className="flex-shrink-0 p-1"
            onClick={(e) => { e.stopPropagation(); setFile(null); setDetectedKey(null); setDetectedMode(null); }}>
            <X className="w-4 h-4 opacity-40 hover:opacity-100 transition-opacity" />
          </button>
        )}
      </GlassButton>

      <GlassButton className="w-full py-0" contentClassName="justify-start gap-4 py-5"
        glassColor={recording ? "rgba(220,38,38,0.2)" : undefined}
        onClick={() => { setRecording(r => { if (!r) { setFile(null); setDetectedKey(null); setDetectedMode(null); } return !r; }); }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: recording ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.15)" }}>
          <Mic className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <div className="font-bold text-base leading-tight">{recording ? "Grabando…" : "Grabar en el navegador"}</div>
          <div className="text-xs opacity-55 mt-0.5">{recording ? "Toca de nuevo para detener" : "Sin configuración necesaria"}</div>
        </div>
        {recording && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />}
      </GlassButton>

      {detectedKey && detectedMode && (
        <div className="w-full rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
          <Activity className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white/60 text-xs">Vocal detectada</div>
            <div className="text-white font-bold text-sm">
              {detectedKey} {detectedMode === "minor" ? "menor" : "mayor"} · {bpm} BPM
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {suggestGenres(bpm, detectedMode).slice(0, 2).map(g => (
              <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(124,58,237,0.2)", color: "rgba(196,181,253,0.8)" }}>
                {g}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasAudio && (
        <div className="w-full rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <GenrePicker selected={selectedGenres} onChange={setSelectedGenres} />
        </div>
      )}

      {hasAudio && (
        <div className="w-full rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/40 text-xs uppercase tracking-widest">BPM del beat</p>
            <span className="text-white font-black text-lg tabular-nums">{bpm}</span>
          </div>
          <input type="range" min={60} max={220} value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full accent-violet-500"
            style={{ cursor: "pointer" }} />
          <div className="flex justify-between text-white/15 text-xs mt-1.5">
            <span>Slow</span><span>Mid</span><span>Fast</span>
          </div>
        </div>
      )}

      {hasAudio && (
        <GlassButton className="w-full mt-1" contentClassName="gap-2" onClick={() => findBeats("")}>
          Buscar beats
          <Music className="w-4 h-4" />
        </GlassButton>
      )}
    </div>
  );
}

// ── RolePicker ────────────────────────────────────────────────

function RolePicker({ onPick }) {
  return (
    <div className="flex flex-col gap-4 items-center w-full max-w-sm">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-black text-white tracking-tight">¿Quién eres?</h2>
        <p className="text-white/40 text-sm mt-1">Elige tu rol para comenzar.</p>
      </div>
      <GlassButton className="w-full py-0" contentClassName="justify-start gap-4 py-5" onClick={() => onPick("artist")}>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0"><Mic className="w-5 h-5" /></div>
        <div className="text-left">
          <div className="font-bold text-base leading-tight">Artista</div>
          <div className="text-xs opacity-55 mt-0.5">Sube vocal · Encuentra un beat · Escucha tu mezcla</div>
        </div>
      </GlassButton>
      <GlassButton className="w-full py-0" contentClassName="justify-start gap-4 py-5" onClick={() => onPick("producer")}>
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0"><Music className="w-5 h-5" /></div>
        <div className="text-left">
          <div className="font-bold text-base leading-tight">Productor</div>
          <div className="text-xs opacity-55 mt-0.5">Sube tu beat · Sé descubierto</div>
        </div>
      </GlassButton>
    </div>
  );
}

// ── VocalTry (página principal) ───────────────────────────────

export default function VocalTry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roleParam = searchParams.get("role");
  const [role, setRole] = useState(roleParam ?? null);

  return (
    <div className="min-h-screen flex items-start justify-center font-light relative overflow-hidden w-full bg-[#07070d]">
      <AuroraBg />

      <button
        className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-full text-sm text-white/70 hover:text-white transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
        onClick={() => (role && !roleParam ? setRole(null) : navigate("/"))}
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <div className="relative z-10 flex flex-col gap-6 items-center justify-start w-full px-4 sm:px-6 pt-24 pb-16">
        {!role && <RolePicker onPick={setRole} />}
        {role === "artist" && <ArtistView />}
        {role === "producer" && <ProducerView />}
      </div>
    </div>
  );
}