import { create } from 'zustand';

// Default modular patch state
const DEFAULT_STATE = {
  osc1: {
    type: 'sawtooth',
    detune: 0,
    octave: 0,         // -2 to +2
    volume: 80,        // 0-100
  },
  osc2: {
    type: 'square',
    detune: 12,        // cents
    octave: -1,
    volume: 60,
  },
  filter: {
    cutoff: 2000,      // Hz
    resonance: 5,      // Q
    drive: 20,         // 0-100
  },
  delay: {
    time: 0.3,         // Seconds
    feedback: 40,      // 0-100
    mix: 30,           // 0-100
  },
  master: {
    volume: 80,
  },
  // We'll track active notes and connections here if we expand the patch matrix
  activeNotes: [],
  connections: [
    { from: 'osc1_out', to: 'filter_in' },
    { from: 'osc2_out', to: 'filter_in' },
    { from: 'filter_out', to: 'delay_in' },
    { from: 'delay_out', to: 'master_in' }
  ]
};

export const useSynthStore = create((set) => ({
  ...DEFAULT_STATE,
  
  // Setters for UI components to call
  setOsc1Param: (key, value) => set((state) => ({ osc1: { ...state.osc1, [key]: value } })),
  setOsc2Param: (key, value) => set((state) => ({ osc2: { ...state.osc2, [key]: value } })),
  setFilterParam: (key, value) => set((state) => ({ filter: { ...state.filter, [key]: value } })),
  setDelayParam: (key, value) => set((state) => ({ delay: { ...state.delay, [key]: value } })),
  setMasterVolume: (volume) => set((state) => ({ master: { ...state.master, volume } })),
  
  // Polyphony/Performance tracking
  noteOn: (noteInfo) => set((state) => ({ activeNotes: [...state.activeNotes, noteInfo] })),
  noteOff: (freq) => set((state) => ({ 
    activeNotes: state.activeNotes.filter(n => Math.abs(n.freq - freq) > 0.1) 
  })),
  
  // Audio Engine Lifecycle
  isAudioEngineRunning: false,
  setAudioEngineRunning: (status) => set({ isAudioEngineRunning: status }),
}));
