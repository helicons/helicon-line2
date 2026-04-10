import { AbsoluteFill, Sequence } from 'remotion';
import { Intro } from './scenes/Intro';
import { Studios } from './scenes/Studios';
import { Beats } from './scenes/Beats';
import { CTA } from './scenes/CTA';

const INTRO_START = 0;
const STUDIOS_START = 180;
const BEATS_START = 390;
const CTA_START = 600;
const TOTAL = 780;

export const HeliconVideo = () => (
  <AbsoluteFill style={{ background: '#050505', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
    <Sequence from={INTRO_START} durationInFrames={STUDIOS_START - INTRO_START}>
      <Intro />
    </Sequence>
    <Sequence from={STUDIOS_START} durationInFrames={BEATS_START - STUDIOS_START}>
      <Studios />
    </Sequence>
    <Sequence from={BEATS_START} durationInFrames={CTA_START - BEATS_START}>
      <Beats />
    </Sequence>
    <Sequence from={CTA_START} durationInFrames={TOTAL - CTA_START}>
      <CTA />
    </Sequence>
  </AbsoluteFill>
);
