import React, { useEffect } from 'react';
import { useStartupStore } from '@/stores/startupStore';
import { Sparkles, Gamepad2, ShieldCheck, Database, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const {
    startupState,
    currentTaskMessage,
    progressPercent,
    errorMessage,
    runStartupSequence,
  } = useStartupStore();

  useEffect(() => {
    if (startupState === 'Initializing') {
      runStartupSequence();
    }
  }, [startupState, runStartupSequence]);

  return (
    <div className="relative min-h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col items-center justify-between p-12 select-none overflow-hidden font-sans">
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[4000ms]" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[350px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Version Info */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-500 font-mono z-10">
        <div className="flex items-center space-x-2">
          <Gamepad2 className="w-4 h-4 text-sky-400" />
          <span className="tracking-widest uppercase">UNIVERSAL GAME HUB</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>v0.1.2 DESKTOP CORE</span>
        </div>
      </div>

      {/* Center Branding Showcase */}
      <div className="flex flex-col items-center justify-center text-center space-y-6 z-10 max-w-lg my-auto">
        {/* Animated Brand Emblem */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 animate-pulse" />
          <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0f1d] border-2 border-sky-400/40 shadow-2xl flex items-center justify-center">
            <span className="text-4xl font-black tracking-tighter bg-gradient-to-tr from-sky-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              GH
            </span>
          </div>
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md flex items-center justify-center">
            Universal Game Hub
          </h1>
          <p className="text-base font-medium text-sky-400/90 tracking-wide flex items-center justify-center space-x-2">
            <span>Your games. Your world.</span>
            <Sparkles className="w-4 h-4 text-amber-400 ml-1 inline" />
          </p>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center space-x-3 pt-2 text-[11px] text-slate-400 font-medium">
          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 flex items-center space-x-1">
            <Database className="w-3 h-3 text-sky-400" />
            <span>Offline-First SQLite</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>Controller Engine</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Local Profiles</span>
          </span>
        </div>
      </div>

      {/* Bottom Progress Bar or Error Display */}
      <div className="w-full max-w-md space-y-3 z-10">
        {startupState === 'Error' ? (
          <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 space-y-3">
            <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Initialization Failed</span>
            </div>
            <p className="text-[11px] text-rose-200/90 font-mono">
              {errorMessage || 'Unknown startup error occurred.'}
            </p>
            <button
              onClick={() => runStartupSequence()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Startup</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium tracking-wide truncate max-w-[320px]">
                {currentTaskMessage}
              </span>
              <span className="text-sky-400 font-mono font-bold">{progressPercent}%</span>
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-900/90 border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400 transition-all duration-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 text-center font-mono">
              System verification & controller polling active
            </p>
          </>
        )}
      </div>
    </div>
  );
};
