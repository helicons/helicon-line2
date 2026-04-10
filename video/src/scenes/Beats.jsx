import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const ACCENT = '#8a2be2';

const BEATS = [
  { title: 'Midnight Trap Vol.3', producer: 'FL Studio Pro', bpm: 140, key: 'Cm', price: '$1.200', plays: '4.2k' },
  { title: 'Soul Bounce Kit', producer: 'Beat Lab 808', bpm: 95, key: 'F#m', price: '$800', plays: '2.8k' },
  { title: 'Dark Drill Loop', producer: 'Urban Sounds', bpm: 145, key: 'Gm', price: '$1.500', plays: '6.1k' },
];

function Waveform({ frame, isMobile }) {
  const barCount = 64;
  const barH = isMobile ? 100 : 80;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 3, height: barH }}>
      {Array.from({ length: barCount }, (_, i) => {
        const base = Math.sin(i * 0.38) * 0.4 + 0.6;
        const animated = Math.sin(i * 0.38 + frame * 0.12) * 0.35 + base;
        const heightPct = Math.max(0.1, animated);
        const isActive = i > 20 && i < 45;
        return (
          <div key={i} style={{
            flex: 1,
            height: `${heightPct * 100}%`,
            background: isActive ? ACCENT : 'rgba(138,43,226,0.3)',
            borderRadius: 2,
          }} />
        );
      })}
    </div>
  );
}

function BeatCard({ beat, progress, isMobile }) {
  const fs = isMobile ? { title: 26, sub: 20, tag: 18, price: 28, plays: 18 } : { title: 16, sub: 13, tag: 12, price: 18, plays: 12 };
  const iconSize = isMobile ? 56 : 44;
  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14,
      padding: isMobile ? '20px 24px' : '16px 20px',
      marginBottom: isMobile ? 16 : 12,
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? 20 : 16,
      opacity: progress,
      transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
    }}>
      <div style={{ width: iconSize, height: iconSize, borderRadius: '50%', background: 'rgba(138,43,226,0.15)', border: '1px solid rgba(138,43,226,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={iconSize * 0.36} height={iconSize * 0.36} viewBox="0 0 24 24" fill={ACCENT}>
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: fs.title, color: '#ffffff', marginBottom: 4 }}>{beat.title}</div>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: fs.sub, color: 'rgba(229,229,229,0.45)' }}>{beat.producer}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontSize: fs.tag, color: 'rgba(229,229,229,0.5)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px' }}>{beat.bpm} BPM</span>
        <span style={{ fontFamily: 'monospace', fontSize: fs.tag, color: 'rgba(229,229,229,0.5)', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px' }}>{beat.key}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: fs.price, color: '#ffffff' }}>{beat.price}</div>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: fs.plays, color: 'rgba(138,43,226,0.7)' }}>{beat.plays} plays</div>
      </div>
    </div>
  );
}

export function Beats() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isMobile = width < height;

  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [185, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  const titleSlide = spring({ frame: frame - 10, fps, config: { damping: 80, stiffness: 100 } });
  const waveformOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const cardProgressList = BEATS.map((_, i) =>
    spring({ frame: frame - (80 + i * 22), fps, config: { damping: 90, stiffness: 110 } })
  );

  if (isMobile) {
    return (
      <AbsoluteFill style={{ background: '#050505', opacity }}>
        <div style={{ position: 'absolute', right: -300, top: '50%', transform: 'translateY(-50%)', width: 1200, height: 1200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 65%)' }} />

        {/* Top: title */}
        <div style={{ position: 'absolute', top: 120, left: 80, right: 80, opacity: titleSlide, transform: `translateY(${interpolate(titleSlide, [0, 1], [30, 0])}px)` }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 20, fontWeight: 600, color: ACCENT, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>Beats Market</p>
          <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 72, color: '#ffffff', lineHeight: 1.1, marginBottom: 32 }}>
            El sonido que<br /><span style={{ color: ACCENT }}>necesitas</span>
          </h1>
          <div style={{ opacity: waveformOp }}>
            <Waveform frame={frame} isMobile />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'monospace', fontSize: 18, color: 'rgba(229,229,229,0.3)' }}>
              <span>0:00</span><span>▶ Escuchando...</span><span>2:47</span>
            </div>
          </div>
        </div>

        {/* Bottom: beat cards */}
        <div style={{ position: 'absolute', bottom: 80, left: 80, right: 80 }}>
          {BEATS.map((beat, i) => (
            <BeatCard key={beat.title} beat={beat} progress={cardProgressList[i]} isMobile />
          ))}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: '#050505', opacity }}>
      <div style={{ position: 'absolute', right: -200, top: '50%', transform: 'translateY(-50%)', width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(138,43,226,0.06) 0%, transparent 65%)' }} />

      <div style={{ position: 'absolute', left: 120, top: '50%', transform: `translateY(calc(-50% + ${interpolate(titleSlide, [0, 1], [30, 0])}px))`, opacity: titleSlide, width: 480 }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: ACCENT, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Beats Market</p>
        <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 56, color: '#ffffff', lineHeight: 1.1, marginBottom: 28 }}>
          El sonido que<br /><span style={{ color: ACCENT }}>tu track necesita</span>
        </h1>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, color: 'rgba(229,229,229,0.6)', lineHeight: 1.6, marginBottom: 32 }}>
          Compra y vende beats, loops y kits<br />directamente con los mejores productores.
        </p>
        <div style={{ opacity: waveformOp }}>
          <Waveform frame={frame} isMobile={false} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'monospace', fontSize: 11, color: 'rgba(229,229,229,0.3)' }}>
            <span>0:00</span><span>▶ Escuchando...</span><span>2:47</span>
          </div>
        </div>
      </div>

      <div style={{ position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)', width: 580 }}>
        {BEATS.map((beat, i) => (
          <BeatCard key={beat.title} beat={beat} progress={cardProgressList[i]} isMobile={false} />
        ))}
        <div style={{ marginTop: 20, display: 'flex', gap: 32, padding: '16px 20px', background: 'rgba(138,43,226,0.08)', border: '1px solid rgba(138,43,226,0.2)', borderRadius: 12, opacity: cardProgressList[2] }}>
          {[['500+', 'Productores'], ['10K+', 'Beats'], ['$∞', 'Royalties']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 22, color: '#ffffff' }}>{val}</div>
              <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: 'rgba(229,229,229,0.45)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
}
