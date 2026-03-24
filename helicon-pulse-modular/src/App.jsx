import React from 'react';
import { Play, Cpu, Save, FolderOpen, Zap } from 'lucide-react';
import { useSynth } from './audio/useSynth';
import { useSynthStore } from './store';
import { Knob } from './components/Knob';
import { ModuleCard } from './components/ModuleCard';
import { IsomorphicGrid } from './components/IsomorphicGrid';
import { SamplerModule } from './components/SamplerModule';

function App() {
  const { initAudio, isAudioEngineRunning, ctx } = useSynth();
  const { 
    osc1, osc2, filter, delay, master,
    setOsc1Param, setOsc2Param, setFilterParam, setDelayParam, setMasterVolume
  } = useSynthStore();

  return (
    <div className="min-h-screen relative flex flex-col p-4 md:p-8">
      
      {/* --- MASTER HEADER --- */}
      <header className="glass-panel w-full rounded-xl p-4 flex items-center justify-between mb-8 z-10 shrink-0 border-b-2 border-accent">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-accent/20 border border-accent flex items-center justify-center shadow-glow-violet animate-[pulse_3s_ease-in-out_infinite]">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="font-display font-bold font-heading text-2xl text-white tracking-widest">HELICON PULSE</h1>
            <p className="font-mono text-[10px] text-neon uppercase tracking-widest">Generative Audio Graph</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex bg-[#0B0F19] rounded-lg border border-white/10 p-1.5 gap-2">
           <button 
             onClick={initAudio}
             className={`px-6 py-2 rounded flex items-center gap-2 font-mono text-xs font-bold transition-all ${isAudioEngineRunning ? 'bg-active/20 text-active border border-active/50 shadow-glow-magenta' : 'bg-surface hover:bg-surface/80 text-white'}`}
           >
             <Cpu className="w-4 h-4" />
             {isAudioEngineRunning ? 'ENGINE ON' : 'START AUDIO'}
           </button>
        </div>

        <div className="flex gap-4">
           {/* Mock Load/Save */}
           <button className="flex items-center gap-2 text-muted hover:text-white font-mono text-[10px] uppercase transition-colors"><FolderOpen className="w-4 h-4" /> Load</button>
           <button className="flex items-center gap-2 text-muted hover:text-white font-mono text-[10px] uppercase transition-colors"><Save className="w-4 h-4" /> Export</button>
        </div>
      </header>

      {/* --- RACK (Grid) --- */}
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 z-10 relative">
        
        {/* Module 1: Dual Wavetable Osc */}
        <ModuleCard title="[1] DUAL WAVETABLE" color="violet">
           <div className="flex flex-col gap-8">
              {/* OSC 1 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 font-mono text-[10px] text-accent font-bold tracking-widest border-b border-accent/20 pb-1 -mt-2">OSC A (SAW)</div>
                <Knob label="OCT" value={osc1.octave} min={-2} max={2} onChange={v => setOsc1Param('octave', Math.round(v))} color="violet" />
                <Knob label="DETUNE" value={osc1.detune} min={-50} max={50} onChange={v => setOsc1Param('detune', v)} unit="c" color="violet" />
                <Knob label="LEVEL" value={osc1.volume} min={0} max={100} onChange={v => setOsc1Param('volume', v)} unit="%" color="violet" />
              </div>
              
              {/* OSC 2 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 font-mono text-[10px] text-neon font-bold tracking-widest border-b border-neon/20 pb-1">OSC B (SQR)</div>
                <Knob label="OCT" value={osc2.octave} min={-3} max={2} onChange={v => setOsc2Param('octave', Math.round(v))} color="cyan" />
                <Knob label="DETUNE" value={osc2.detune} min={-100} max={100} onChange={v => setOsc2Param('detune', v)} unit="c" color="cyan" />
                <Knob label="LEVEL" value={osc2.volume} min={0} max={100} onChange={v => setOsc2Param('volume', v)} unit="%" color="cyan" />
              </div>
           </div>
        </ModuleCard>

        {/* Module 2: Moog Filter */}
        <ModuleCard title="[2] LADDER VCF" color="magenta">
           <div className="h-full flex flex-col justify-between pt-4 pb-8">
              <div className="flex justify-center items-center mb-8">
                 {/* Big Cutoff Knob */}
                 <div className="scale-125 transform origin-center">
                    <Knob label="CUTOFF" value={filter.cutoff} min={20} max={15000} onChange={v => setFilterParam('cutoff', v)} unit="hz" size={80} color="magenta" />
                 </div>
              </div>
              
              <div className="flex justify-between px-4">
                 <Knob label="RES (Q)" value={filter.resonance} min={0} max={30} onChange={v => setFilterParam('resonance', v)} color="magenta" />
                 <Knob label="DRIVE" value={filter.drive} min={0} max={100} onChange={v => setFilterParam('drive', v)} unit="%" color="magenta" />
              </div>
           </div>
        </ModuleCard>

        {/* Module 3: Ping Pong Delay & Master */}
        <div className="flex flex-col gap-6">
          <ModuleCard title="[3] PING-PONG FX" color="cyan">
             <div className="grid grid-cols-3 gap-4 py-4">
                <Knob label="TIME" value={delay.time} min={0.05} max={1.5} onChange={v => setDelayParam('time', v)} unit="s" color="cyan" />
                <Knob label="FDBK" value={delay.feedback} min={0} max={95} onChange={v => setDelayParam('feedback', v)} unit="%" color="cyan" />
                <Knob label="MIX" value={delay.mix} min={0} max={100} onChange={v => setDelayParam('mix', v)} unit="%" color="cyan" />
             </div>
          </ModuleCard>

          {/* Master VCA (Small Module) */}
          <div className="glass-panel p-4 rounded-xl border border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-active rounded-full shadow-glow-magenta animate-pulse"></div>
               <span className="font-mono text-[10px] text-white font-bold tracking-widest">OUTPUT</span>
             </div>
             <Knob label="MASTER LEVEL" value={master.volume} min={0} max={100} onChange={v => setMasterVolume(v)} color="magenta" size={40} />
          </div>
        </div>

      </main>

      {/* --- SAMPLER MODULE --- */}
      <section className="mt-6 z-10 shrink-0">
        <SamplerModule audioCtx={ctx} />
      </section>

      {/* --- PERFORMANCE INTERFACE --- */}
      <footer className="mt-8 z-10 shrink-0">
         <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] text-muted tracking-widest">ISOMORPHIC KEYBOARD [4ths]</span>
            <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${isAudioEngineRunning ? 'bg-neon shadow-glow-cyan' : 'bg-surface'}`}></div>
               <span className="font-mono text-[9px] text-white">MIDI I/O</span>
            </div>
         </div>
         <IsomorphicGrid />
      </footer>

      {/* BACKGROUND SVG PATCH CORDS (Aesthetic Simulation) */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-40">
        <defs>
          <filter id="neon-glow-violet">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="neon-glow-cyan">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Draw a few aesthetic cables between rough screen positions */}
        <path d="M 30% 30% C 40% 50%, 50% 20%, 60% 40%" stroke="#8A2BE2" strokeWidth="4" fill="none" filter="url(#neon-glow-violet)" />
        <path d="M 65% 45% C 75% 60%, 80% 30%, 85% 40%" stroke="#00F0FF" strokeWidth="3" fill="none" filter="url(#neon-glow-cyan)" />
        
        {/* Connection points */}
        <circle cx="30%" cy="30%" r="5" fill="#8A2BE2" />
        <circle cx="60%" cy="40%" r="5" fill="#8A2BE2" />
        <circle cx="65%" cy="45%" r="5" fill="#00F0FF" />
        <circle cx="85%" cy="40%" r="5" fill="#00F0FF" />
      </svg>
    </div>
  );
}

export default App;
