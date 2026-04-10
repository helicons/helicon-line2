import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const ACCENT = '#8a2be2';
const RINGS = [60, 110, 170, 240, 320];

export function CTA() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isMobile = width < height;

  const fadeIn = interpolate(frame, [0, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const ringProgress = RINGS.map((_, i) =>
    spring({ frame: frame - i * 12, fps, config: { damping: 60, stiffness: 80, mass: 1.2 } })
  );

  const rotation = interpolate(frame, [0, 180], [0, 180], { extrapolateRight: 'clamp' });

  const logoSpring = spring({ frame: frame - 20, fps, config: { damping: 80, stiffness: 100 } });
  const urlSpring = spring({ frame: frame - 50, fps, config: { damping: 90, stiffness: 120 } });
  const ctaSpring = spring({ frame: frame - 80, fps, config: { damping: 80, stiffness: 100 } });
  const taglineOp = interpolate(frame, [100, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const cx = width / 2;
  const cy = height / 2;
  const ringScale = isMobile ? 2.5 : 2.2;
  const urlFontSize = isMobile ? 68 : 72;
  const ctaPadding = isMobile ? '22px 56px' : '18px 44px';
  const ctaFontSize = isMobile ? 28 : 22;

  return (
    <AbsoluteFill style={{ background: '#050505', opacity: fadeIn }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(138,43,226,0.12) 0%, transparent 70%)' }} />

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ctaGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(138,43,226,0.3)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <ellipse cx={cx} cy={cy} rx={interpolate(ringProgress[4], [0, 1], [0, 700])} ry={interpolate(ringProgress[4], [0, 1], [0, 400])} fill="url(#ctaGlow)" />

        {RINGS.map((r, i) => (
          <circle
            key={r}
            cx={cx} cy={cy}
            r={r * ringScale * interpolate(ringProgress[i], [0.3, 1], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
            fill="none"
            stroke={`rgba(138,43,226,${0.2 - i * 0.03})`}
            strokeWidth="1"
            opacity={ringProgress[i]}
          />
        ))}

        <g transform={`rotate(${rotation}, ${cx}, ${cy})`} opacity={0.6}>
          <line x1={cx} y1={cy} x2={cx} y2={cy - 320 * ringProgress[0]} stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" />
        </g>

        <line x1={cx} y1={cy - 400} x2={cx} y2={cy + 400} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        <line x1={cx - 500} y1={cy} x2={cx + 500} y2={cy} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, opacity: logoSpring, display: 'flex', alignItems: 'center', gap: 14 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 12px ${ACCENT})` }}>
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: isMobile ? 60 : 48, color: '#ffffff', letterSpacing: '0.05em' }}>
            Helicon
          </span>
        </div>

        {/* URL */}
        <div style={{ transform: `scale(${interpolate(urlSpring, [0, 1], [0.85, 1])})`, opacity: urlSpring, marginBottom: 40 }}>
          <h1 style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            fontSize: urlFontSize,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            textAlign: 'center',
            textShadow: `0 0 40px rgba(138,43,226,0.5), 0 0 80px rgba(138,43,226,0.2)`,
          }}>
            heliconradar.com
          </h1>
        </div>

        {/* CTA button */}
        <div style={{ opacity: ctaSpring, transform: `translateY(${interpolate(ctaSpring, [0, 1], [20, 0])}px)`, marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            background: ACCENT,
            borderRadius: 14,
            padding: ctaPadding,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
            fontSize: ctaFontSize,
            color: '#ffffff',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            boxShadow: `0 0 40px rgba(138,43,226,0.5), 0 0 80px rgba(138,43,226,0.2)`,
          }}>
            Regístrate gratis
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </div>

        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: isMobile ? 26 : 18, color: 'rgba(229,229,229,0.45)', letterSpacing: '0.05em', opacity: taglineOp }}>
          Estudios · Beats · Productores
        </p>
      </div>
    </AbsoluteFill>
  );
}
