// Essentia.js Web Worker — BPM + Key detection
// Files served locally from /public/ — no CDN dependency

let essentiaReady = false;
let essentia;

async function init() {
  if (essentiaReady) return;

  // Load UMD bundles — importScripts sets globals on self
  importScripts('/essentia-wasm.umd.js');
  importScripts('/essentia.js-core.umd.js');

  // IMPORTANT: use self.EssentiaWASM — do NOT shadow with let/const
  const wasmModule = await self.EssentiaWASM();
  essentia = new self.Essentia(wasmModule);
  essentiaReady = true;
}

// Linear resampler — RhythmExtractor2013 requires 44100 Hz
function resampleTo44100(data, fromRate) {
  if (fromRate === 44100) return data;
  const ratio = fromRate / 44100;
  const outLen = Math.round(data.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio;
    const lo = Math.floor(src);
    const hi = Math.min(lo + 1, data.length - 1);
    const t = src - lo;
    out[i] = data[lo] * (1 - t) + data[hi] * t;
  }
  return out;
}

self.onmessage = async (e) => {
  const { type, audioData, sampleRate, id } = e.data;
  if (type !== 'analyze') return;

  try {
    await init();

    // Resample to 44100 Hz
    const resampled = resampleTo44100(audioData, sampleRate);
    const signal = essentia.arrayToVector(resampled);

    // ── BPM — RhythmExtractor2013 (multifeature, highest accuracy)
    // Signature: RhythmExtractor2013(signal, maxTempo, method, minTempo)
    // Returns: { bpm, confidence, ticks, estimates, bpmIntervals }
    let bpm = 140;
    try {
      const rhythm = essentia.RhythmExtractor2013(signal, 208, 'multifeature', 40);
      let raw = rhythm.bpm;
      if (raw && !isNaN(raw) && raw > 0) {
        while (raw < 70) raw *= 2;
        while (raw > 180) raw /= 2;
        bpm = Math.round(raw);
      }
    } catch (bpmErr) {
      self.postMessage({ id, bpm: null, key: null, error: 'BPM: ' + bpmErr.message });
      return;
    }

    // ── KEY — KeyExtractor with HPCP (professional grade)
    // Correct signature (from core_api.d.ts):
    // KeyExtractor(audio, averageDetuningCorrection, frameSize, hopSize,
    //   hpcpSize, maxFrequency, maximumSpectralPeaks, minFrequency,
    //   pcpThreshold, profileType, sampleRate, spectralPeaksThreshold,
    //   tuningFrequency, weightType, windowType)
    // Returns: { key, scale, strength }
    let key = null;
    try {
      const kr = essentia.KeyExtractor(
        signal,
        true,          // averageDetuningCorrection
        4096,          // frameSize
        4096,          // hopSize
        12,            // hpcpSize
        3500,          // maxFrequency
        60,            // maximumSpectralPeaks
        25,            // minFrequency
        0.2,           // pcpThreshold
        'temperley',   // profileType — best for modern/pop/trap
        44100,         // sampleRate
        0.0001,        // spectralPeaksThreshold
        440,           // tuningFrequency
        'cosine',      // weightType
        'hann'         // windowType
      );
      if (kr && kr.key && kr.scale) {
        const scale = kr.scale === 'major' ? 'Maj' : 'Min';
        key = `${kr.key} ${scale}`;
      }
    } catch (keyErr) {
      // Key failed but BPM ok — still return bpm
      self.postMessage({ id, bpm, key: null, error: 'Key: ' + keyErr.message });
      return;
    }

    self.postMessage({ id, bpm, key, error: null });

  } catch (err) {
    self.postMessage({ id, bpm: null, key: null, error: err.message });
  }
};
