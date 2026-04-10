import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const ACCENT = '#8a2be2';

const STUDIOS = [
  { name: 'Neon Room Studio', location: 'Palermo, CABA', price: '$3.500/h', tag: 'Disponible hoy', slots: 4 },
  { name: 'The Vault', location: 'San Telmo, CABA', price: '$4.200/h', tag: 'Top Rated', slots: 2 },
  { name: '808 Suite', location: 'Villa Crespo, CABA', price: '$2.800/h', tag: 'Nuevo', slots: 6 },
];

const FEATURES = [
  { icon: '📍', text: 'Más de 50 estudios en tu ciudad' },
  { icon: '📅', text: 'Reserva en tiempo real, sin llamadas' },
  { icon: '🎚️', text: 'Elige por equipamiento y precio' },
];

function StudioCard({ studio, slideProgress, isMobile }) {
  return (
    <div style={{
      background: '#111111',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 16,
      padding: isMobile ? '24px 28px' : '20px 24px',
      marginBottom: isMobile ? 20 : 16,
      transform: `translateX(${interpolate(slideProgress, [0, 1], [120, 0])}px)`,
      opacity: slideProgress,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 600, fontSize: isMobile ? 26 : 18, color: '#ffffff' }}>
            {studio.name}
          </span>
          <span style={{
            background: 'rgba(138,43,226,0.2)',
            border: '1px solid rgba(138,43,226,0.4)',
            borderRadius: 6,
            padding: '2px 8px',
            fontFamily: 'system-ui, sans-serif',
            fontSize: isMobile ? 18 : 11,
            fontWeight: 600,
            color: ACCENT,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>{studio.tag}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={isMobile ? 18 : 13} height={isMobile ? 18 : 13} viewBox="0 0 24 24" fill="none" stroke="rgba(229,229,229,0.4)" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: isMobile ? 22 : 14, color: 'rgba(229,229,229,0.5)' }}>
            {studio.location}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'monospace', fontSize: isMobile ? 28 : 20, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>
          {studio.price}
        </div>
        <div style={{ fontFamily: 'system-ui, sans-serif', fontSize: isMobile ? 18 : 12, color: 'rgba(138,43,226,0.8)' }}>
          {studio.slots} turnos hoy
        </div>
      </div>
    </div>
  );
}

export function Studios() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isMobile = width < height;

  const fadeIn = interpolate(frame, [0, 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [185, 210], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  const titleSlide = spring({ frame: frame - 10, fps, config: { damping: 80, stiffness: 100 } });

  const featureOps = FEATURES.map((_, i) =>
    interpolate(frame, [40 + i * 18, 70 + i * 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  );

  const cardSprings = STUDIOS.map((_, i) =>
    spring({ frame: frame - (70 + i * 25), fps, config: { damping: 90, stiffness: 110 } })
  );

  if (isMobile) {
    return (
      <AbsoluteFill style={{ background: '#050505', opacity }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(138,43,226,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(138,43,226,0.04) 1px, transparent 1px)`, backgroundSize: '80px 80px' }} />

        {/* Top: copy */}
        <div style={{
          position: 'absolute',
          top: 120,
          left: 80,
          right: 80,
          opacity: titleSlide,
          transform: `translateY(${interpolate(titleSlide, [0, 1], [30, 0])}px)`,
        }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 20, fontWeight: 600, color: ACCENT, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>Estudios</p>
          <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 72, color: '#ffffff', lineHeight: 1.1, marginBottom: 36 }}>
            Encuentra tu<br /><span style={{ color: ACCENT }}>estudio ideal</span>
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: featureOps[i], transform: `translateX(${interpolate(featureOps[i], [0, 1], [-20, 0])}px)` }}>
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 26, color: 'rgba(229,229,229,0.75)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: cards */}
        <div style={{ position: 'absolute', bottom: 80, left: 80, right: 80 }}>
          {STUDIOS.map((studio, i) => (
            <StudioCard key={studio.name} studio={studio} slideProgress={cardSprings[i]} isMobile />
          ))}
        </div>

        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: `linear-gradient(to bottom, transparent, ${ACCENT}, transparent)`, opacity: 0.5 }} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: '#050505', opacity }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(138,43,226,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(138,43,226,0.04) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

      <div style={{
        position: 'absolute',
        left: 120,
        top: '50%',
        transform: `translateY(calc(-50% + ${interpolate(titleSlide, [0, 1], [30, 0])}px))`,
        opacity: titleSlide,
        maxWidth: 480,
      }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 600, color: ACCENT, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16 }}>Estudios</p>
        <h1 style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 56, color: '#ffffff', lineHeight: 1.1, marginBottom: 28 }}>
          Encuentra tu<br /><span style={{ color: ACCENT }}>estudio ideal</span>
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: featureOps[i], transform: `translateX(${interpolate(featureOps[i], [0, 1], [-20, 0])}px)` }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: 17, color: 'rgba(229,229,229,0.75)' }}>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'absolute', right: 100, top: '50%', transform: 'translateY(-50%)', width: 560 }}>
        {STUDIOS.map((studio, i) => (
          <StudioCard key={studio.name} studio={studio} slideProgress={cardSprings[i]} isMobile={false} />
        ))}
      </div>

      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(to bottom, transparent, ${ACCENT}, transparent)`, opacity: 0.5 }} />
    </AbsoluteFill>
  );
}
