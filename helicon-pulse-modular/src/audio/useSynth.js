import { useEffect, useRef, useState, useCallback } from 'react';
import { Engine } from 'helicon';
import { useSynthStore } from '../store';

/**
 * useSynth
 * Hooks React Zustand state directly to Helicon's virtual audio graph.
 */
export function useSynth() {
  const engineRef = useRef(null);
  const { 
    osc1, osc2, filter, delay, master, activeNotes, 
    isAudioEngineRunning, setAudioEngineRunning 
  } = useSynthStore();
  
  const [ctx, setCtx] = useState(null);

  // 1. Initialize Audio Context on user gesture
  const initAudio = useCallback(async () => {
    if (engineRef.current) return;
    
    // Create new web audio context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    setCtx(audioCtx);
    
    // Initialize Helicon engine
    engineRef.current = new Engine(audioCtx);
    
    // Start it and update global state
    await audioCtx.resume();
    setAudioEngineRunning(true);
  }, [setAudioEngineRunning]);

  // 2. Map State -> Virtual Graph
  useEffect(() => {
    if (!engineRef.current || !isAudioEngineRunning) return;

    const baseFreq = activeNotes.length > 0 ? activeNotes[activeNotes.length - 1].freq : 0;
    const isPlaying = activeNotes.length > 0;
    
    // We use a simple AR envelope for the global VCA right now based on note triggers
    const envelopeGain = isPlaying ? 1.0 : 0.0;
    // Map volume 0-100 to 0.0-1.0
    const mVol = master.volume / 100;

    // Helicon Virtual Graph Definition
    const graphDiff = {
      nodes: {
        // OSC 1 (Wavetable A)
        "osc_1": {
          type: "oscillator",
          params: {
            type: osc1.type,
            frequency: Math.max(10, baseFreq * Math.pow(2, osc1.octave)), // Avoid 0hz
            detune: osc1.detune
          }
        },
        "osc_1_gain": {
          type: "gain",
          params: { gain: (osc1.volume / 100) * 0.5 } // Balance mix
        },

        // OSC 2 (Wavetable B)
        "osc_2": {
          type: "oscillator",
          params: {
            type: osc2.type,
            frequency: Math.max(10, baseFreq * Math.pow(2, osc2.octave)), 
            detune: osc2.detune
          }
        },
        "osc_2_gain": {
          type: "gain",
          params: { gain: (osc2.volume / 100) * 0.5 }
        },

        // VCA / Envelope Mixer
        "vca_mix": {
          type: "gain",
          params: { gain: envelopeGain } // Main gate
        },

        // Moog Ladder Filter (Simulation via Biquad 24db/oct)
        "filter_lp1": {
          type: "biquadFilter",
          params: {
            type: "lowpass",
            frequency: filter.cutoff,
            Q: filter.resonance
          }
        },
        // Simulate steep slope by cascading or adding resonance.
        // For Helicon, standard 'biquadFilter' is fine. We could cascade two if needed.

        // Ping Pong Delay
        "delay_fx": {
          type: "delay",
          params: { delayTime: delay.time }
        },
        "delay_fb": {
          type: "gain",
          params: { gain: delay.feedback / 100 }
        },
        "delay_mix": {
          type: "gain",
          params: { gain: delay.mix / 100 }
        },

        // Master Out
        "master_compressor": {
          type: "dynamicsCompressor",
          params: { threshold: -12, knee: 10, ratio: 10, attack: 0.003, release: 0.25 }
        },
        "master_gain": {
          type: "gain",
          params: { gain: mVol }
        },
        "master": {
          type: "destination",
          params: {}
        }
      },
      
      connections: [
        // Routing Oscillators -> Mixer
        { from: "osc_1", to: "osc_1_gain" },
        { from: "osc_2", to: "osc_2_gain" },
        { from: "osc_1_gain", to: "vca_mix" },
        { from: "osc_2_gain", to: "vca_mix" },
        
        // Mixer -> Filter
        { from: "vca_mix", to: "filter_lp1" },

        // Filter -> Master (Dry signal)
        { from: "filter_lp1", to: "master_compressor" },

        // Filter -> Delay Chain (Wet Signal)
        { from: "filter_lp1", to: "delay_fx" },
        { from: "delay_fx", to: "delay_fb" },
        { from: "delay_fb", to: "delay_fx" }, // Feedback loop inside virtual graph allowed if engine supports, otherwise simplify.
        { from: "delay_fx", to: "delay_mix" },
        { from: "delay_mix", to: "master_compressor" },

        // Output Stage
        { from: "master_compressor", to: "master_gain" },
        { from: "master_gain", to: "master" }
      ]
    };

    // Helicon handles diffing automatically and sets .value / exponentialRampToValueAtTime
    engineRef.current.update(graphDiff);

  }, [osc1, osc2, filter, delay, master, activeNotes, isAudioEngineRunning]);

  return { initAudio, isAudioEngineRunning, ctx };
}
