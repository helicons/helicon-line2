import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const ACCENT = '#8a2be2';
const ACCENT_DIM = 'rgba(138,43,226,0.15)';
const ACCENT_GLOW = 'rgba(138,43,226,0.5)';
const RINGS = [48, 38, 28, 18, 9];
const STUDIO_DOTS = [
  { cx: 30, cy: 32, name: 'Neon Room' },
  { cx: 73, cy: 29, name: 'The Vault' },
  { cx: 65, cy: 72, name: '808 Suite' },
];

function RadarSVG({ frame }) {
  const rotation = interpolate(frame, [20, 180], [0, 540], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(138,43,226,0.08)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="sweepGrad" cx="50%" cy="0%">
          <stop offset="0%" stopColor={ACCENT} stopOpacity="0.9" />
          <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
        </radialGradient>
        <clipPath id="circleClip">
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      <circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />
      <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />
      <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.04)" strokeWidth="0.15" />

      {RINGS.map((r, i) => {
        const op = interpolate(frame, [i * 10, i * 10 + 30], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={ACCENT_DIM} strokeWidth="0.25" opacity={op} />
        );
      })}

      <g
        clipPath="url(#circleClip)"
        transform={`rotate(${rotation}, 50, 50)`}
        opacity={interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}
      >
        <path
          d={`M 50 50 L 50 0 A 50 50 0 0 1 ${50 + 50 * Math.sin(Math.PI / 4)} ${50 - 50 * Math.cos(Math.PI / 4)} Z`}
          fill="url(#sweepGrad)"
          opacity={0.3}
        />
        <line x1="50" y1="50" x2="50" y2="1" stroke={ACCENT} strokeWidth="0.5" strokeLinecap="round" />
        <circle cx="50" cy="2" r="0.6" fill={ACCENT} />
      </g>

      {STUDIO_DOTS.map((dot, i) => {
        const dotFrame = 60 + i * 20;
        const op = interpolate(frame, [dotFrame, dotFrame + 20], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const pulse = Math.sin((frame - dotFrame) * 0.15) * 0.4 + 0.6;
        return (
          <g key={dot.name} opacity={op}>
            <circle cx={dot.cx} cy={dot.cy} r={1.2 * pulse} fill={ACCENT} opacity={0.3} />
            <circle cx={dot.cx} cy={dot.cy} r={0.8} fill={ACCENT} />
          </g>
        );
      })}
    </svg>
  );
}

export function Intro() {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isMobile = width < height;

  const logoY = spring({ frame: frame - 60, fps, config: { damping: 80, stiffness: 120, mass: 0.8 } });
  const logoOpacity = interpolate(frame, [60, 100], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const taglineOp = interpolate(frame, [100, 140], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const overallOp = interpolate(frame, [160, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  if (isMobile) {
    return (
      <AbsoluteFill style={{ background: '#050505', opacity: overallOp }}>
        {/* Radar full screen, faded */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.5 }}>
          <RadarSVG frame={frame} />
        </div>

        {/* Centered content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          opacity: logoOpacity,
          transform: `translateY(${interpolate(logoY, [0, 1], [40, 0])}px)`,
          padding: '0 80px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 36 }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 64, color: '#ffffff', letterSpacing: '0.04em' }}>
              Helicon
            </span>
          </div>

          <div style={{ opacity: taglineOp, textAlign: 'center' }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400, fontSize: 34, color: 'rgba(229,229,229,0.75)', letterSpacing: '0.03em', lineHeight: 1.4 }}>
              Tu radar de estudios<br />
              <span style={{ color: ACCENT, fontWeight: 600 }}>musicales</span>
            </p>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 80, width: '100%', textAlign: 'center', opacity: taglineOp * 0.6, fontFamily: 'monospace', fontSize: 24, color: 'rgba(229,229,229,0.4)', letterSpacing: '0.1em' }}>
          heliconradar.com
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: '#050505', opacity: overallOp }}>
      <div style={{ position: 'absolute', right: -80, top: '50%', transform: 'translateY(-50%)', width: 800, height: 800, opacity: 0.7 }}>
        <RadarSVG frame={frame} />
      </div>

      <div style={{
        position: 'absolute',
        left: 120,
        top: '50%',
        transform: `translateY(calc(-50% + ${interpolate(logoY, [0, 1], [40, 0])}px))`,
        opacity: logoOpacity,
        maxWidth: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 700, fontSize: 42, color: '#ffffff', letterSpacing: '0.05em' }}>Helicon</span>
        </div>

        <div style={{ opacity: taglineOp }}>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400, fontSize: 26, color: 'rgba(229,229,229,0.75)', letterSpacing: '0.04em', lineHeight: 1.4 }}>
            Tu radar de estudios<br />
            <span style={{ color: ACCENT, fontWeight: 600 }}>musicales</span>
          </p>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 60, left: 120, opacity: taglineOp * 0.6, fontFamily: 'monospace', fontSize: 16, color: 'rgba(229,229,229,0.4)', letterSpacing: '0.1em' }}>
        heliconradar.com
      </div>
    </AbsoluteFill>
  );
}
