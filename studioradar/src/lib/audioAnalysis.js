export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Middle octave reference frequencies (C4-B4)
const BASE_FREQS = {
  "C": 261.63, "C#": 277.18, "D": 293.66, "D#": 311.13,
  "E": 329.63, "F": 349.23, "F#": 369.99, "G": 392.00,
  "G#": 415.30, "A": 440.00, "A#": 466.16, "B": 493.88,
};

// Krumhansl-Schmuckler key profiles
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function pearson(a, b) {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const ca = a[i] - ma, cb = b[i] - mb;
    num += ca * cb; da += ca * ca; db += cb * cb;
  }
  return num / Math.sqrt(da * db + 1e-10);
}

function goertzel(samples, freq, sampleRate) {
  const N = samples.length;
  const k = N * freq / sampleRate;
  const omega = (2 * Math.PI * k) / N;
  const coeff = 2 * Math.cos(omega);
  let q1 = 0, q2 = 0;
  for (let i = 0; i < N; i++) {
    const q0 = coeff * q1 - q2 + samples[i];
    q2 = q1; q1 = q0;
  }
  return q1 * q1 + q2 * q2 - q1 * q2 * coeff;
}

function toMono(buf) {
  const out = new Float32Array(buf.length);
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const data = buf.getChannelData(ch);
    for (let i = 0; i < buf.length; i++) out[i] += data[i] / buf.numberOfChannels;
  }
  return out;
}

function rms(arr, start, len) {
  let sum = 0;
  for (let i = start; i < start + len && i < arr.length; i++) sum += arr[i] * arr[i];
  return Math.sqrt(sum / len);
}

export async function analyzeAudio(file, onProgress) {
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(10);

  const ctx = new AudioContext();
  const audioBuf = await ctx.decodeAudioData(arrayBuffer);
  await ctx.close();
  onProgress?.(25);

  const sampleRate = audioBuf.sampleRate;
  const mono = toMono(audioBuf);

  const WIN = Math.min(sampleRate * 2, mono.length);
  const STEP = sampleRate * 3;
  const MAX_TIME = sampleRate * 90;
  const chromaAcc = new Array(12).fill(0);
  let validWindows = 0;

  for (let start = 0; start + WIN <= Math.min(mono.length, MAX_TIME); start += STEP) {
    if (rms(mono, start, WIN) < 0.005) continue;
    const frame = mono.slice(start, start + WIN);

    for (let n = 0; n < 12; n++) {
      const baseFreq = BASE_FREQS[NOTE_NAMES[n]];
      for (let oct = -2; oct <= 3; oct++) {
        const freq = baseFreq * Math.pow(2, oct);
        if (freq > 60 && freq < sampleRate / 2 - 50) {
          chromaAcc[n] += goertzel(frame, freq, sampleRate);
        }
      }
    }
    validWindows++;
  }
  onProgress?.(70);

  const rawChroma = validWindows > 0 ? chromaAcc.map(v => v / validWindows) : new Array(12).fill(1);
  const chromaMax = Math.max(...rawChroma, 1e-10);
  const chroma = rawChroma.map(v => v / chromaMax);

  let bestCorr = -Infinity;
  let bestKey = "C";
  let bestMode = "major";

  for (let root = 0; root < 12; root++) {
    const rotated = [...chroma.slice(root), ...chroma.slice(0, root)];
    const maj = pearson(rotated, MAJOR_PROFILE);
    const min = pearson(rotated, MINOR_PROFILE);
    if (maj > bestCorr) { bestCorr = maj; bestKey = NOTE_NAMES[root]; bestMode = "major"; }
    if (min > bestCorr) { bestCorr = min; bestKey = NOTE_NAMES[root]; bestMode = "minor"; }
  }

  let bpm = null;
  try {
    const HOP = Math.floor(sampleRate * 0.01);
    const WIN_E = Math.floor(sampleRate * 0.05);
    const maxSamples = Math.min(mono.length, sampleRate * 60);
    const energies = [];

    for (let i = 0; i + WIN_E < maxSamples; i += HOP) {
      let e = 0;
      for (let j = i; j < i + WIN_E; j++) e += mono[j] * mono[j];
      energies.push(e / WIN_E);
    }

    const onset = energies.map((e, i) => i > 0 ? Math.max(0, e - energies[i - 1]) : 0);

    const hopsPerBeat60  = Math.floor(60 / (60  * HOP / sampleRate));
    const hopsPerBeat200 = Math.floor(60 / (200 * HOP / sampleRate));
    const acLen = Math.min(onset.length, 3000);

    let bestAC = 0;
    let bestLag = hopsPerBeat60;

    for (let lag = hopsPerBeat200; lag <= hopsPerBeat60; lag++) {
      let ac = 0;
      for (let i = 0; i < acLen - lag; i++) ac += onset[i] * onset[i + lag];
      if (ac > bestAC) { bestAC = ac; bestLag = lag; }
    }

    const lagSecs = bestLag * HOP / sampleRate;
    const raw = Math.round(60 / lagSecs);
    bpm = raw >= 60 && raw <= 200 ? raw : null;
  } catch {
    bpm = null;
  }

  onProgress?.(100);
  return { key: bestKey, mode: bestMode, bpm, chroma };
}

export function keyCompatibility(vocalKey, vocalMode, beatKey, beatMode) {
  const vi = NOTE_NAMES.indexOf(vocalKey);
  const bi = NOTE_NAMES.indexOf(beatKey);
  const diff = ((bi - vi) + 12) % 12;

  if (beatKey === vocalKey && beatMode === vocalMode) return 4;
  if (vocalMode === "minor" && beatMode === "major" && diff === 3) return 3;
  if (vocalMode === "major" && beatMode === "minor" && diff === 9) return 3;
  if (beatKey === vocalKey) return 2;
  if (diff === 7 || diff === 5) return 1;
  return 0;
}

export function commonProgressions(key, mode) {
  const idx = NOTE_NAMES.indexOf(key);
  const n = (offset) => NOTE_NAMES[(idx + offset) % 12];
  const m = (note, minor = false) => `${note}${minor ? "m" : ""}`;

  if (mode === "minor") {
    return [
      `${m(key, true)} - ${m(n(5), true)} - ${m(n(7))} - ${m(n(10))}`,
      `${m(key, true)} - ${m(n(7))} - ${m(n(10))} - ${m(n(5), true)}`,
      `${m(key, true)} - ${m(n(3))} - ${m(n(5), true)} - ${m(n(7))}`,
    ];
  }
  return [
    `${m(n(0))} - ${m(n(9), true)} - ${m(n(5), true)} - ${m(n(7))}`,
    `${m(n(0))} - ${m(n(5), true)} - ${m(n(7))} - ${m(n(4), true)}`,
    `${m(n(0))} - ${m(n(9), true)} - ${m(n(7))} - ${m(n(5), true)}`,
  ];
}

export function suggestGenres(bpm, mode) {
  if (bpm < 80 && mode === "minor")  return ["Neo Soul", "Lo-Fi", "Bedroom Pop"];
  if (bpm < 80 && mode === "major")  return ["Chill R&B", "Soul", "Bossa"];
  if (bpm < 100 && mode === "minor") return ["Afrotrap", "Dancehall", "R&B oscuro"];
  if (bpm < 100 && mode === "major") return ["Afrobeats", "Reggaeton", "Pop latino"];
  if (bpm < 120 && mode === "minor") return ["Melodic Trap", "Emo Rap", "Alt R&B"];
  if (bpm < 120 && mode === "major") return ["Pop", "Trap pop", "Electropop"];
  if (bpm < 145 && mode === "minor") return ["Trap", "Dark Trap", "Cloud Rap"];
  if (bpm < 145 && mode === "major") return ["Hip-Hop", "Bounce", "Plugg"];
  if (mode === "minor")              return ["Drill", "Rage Rap", "Trap Metal"];
  return ["Jersey Club", "UK Drill", "Grime"];
}