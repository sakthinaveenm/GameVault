import React from 'react';
import { useControllerStore } from '@/stores/controllerStore';

export const ControllerHints: React.FC = () => {
  const { showHints, activeController } = useControllerStore();

  if (!showHints) return null;

  const isPlayStation = activeController?.type === 'playstation';

  return (
    <footer className="h-10 px-8 bg-[#090d14]/95 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 select-none z-20 shrink-0">
      <div className="flex items-center space-x-6">
        {/* Confirm / Select */}
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/25 text-emerald-400 border border-emerald-500/50 text-[10px] font-black shadow-sm">
            {isPlayStation ? '✕' : 'A'}
          </span>
          <span className="text-slate-200 font-semibold tracking-wide">Select / Play</span>
        </div>

        {/* Back */}
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/25 text-rose-400 border border-rose-500/50 text-[10px] font-black shadow-sm">
            {isPlayStation ? '○' : 'B'}
          </span>
          <span className="text-slate-200 font-semibold tracking-wide">Back</span>
        </div>

        {/* Details / Action */}
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/25 text-sky-400 border border-sky-500/50 text-[10px] font-black shadow-sm">
            {isPlayStation ? '□' : 'X'}
          </span>
          <span className="text-slate-200 font-semibold tracking-wide">Details</span>
        </div>

        {/* Options / Search */}
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/25 text-amber-400 border border-amber-500/50 text-[10px] font-black shadow-sm">
            {isPlayStation ? '△' : 'Y'}
          </span>
          <span className="text-slate-200 font-semibold tracking-wide">Search (Y)</span>
        </div>

        {/* Switch Tab */}
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-black">
            LB / RB
          </span>
          <span className="text-slate-300 font-medium">Switch Tab</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-slate-400 text-[11px] font-mono">
        <span className="flex items-center space-x-1.5">
          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold text-[10px]">
            STEAM
          </span>
          <span>Quick Menu</span>
        </span>
        <span>•</span>
        <span>D-Pad / Left Stick Navigate</span>
      </div>
    </footer>
  );
};
