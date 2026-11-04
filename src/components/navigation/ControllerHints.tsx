import React from 'react';
import { useControllerStore } from '@/stores/controllerStore';

export const ControllerHints: React.FC = () => {
  const { showHints, activeController } = useControllerStore();

  if (!showHints) return null;

  const isPlayStation = activeController?.type === 'playstation';

  return (
    <footer className="h-10 px-6 bg-[#080b11]/95 border-t border-slate-900/90 flex items-center justify-between text-xs text-slate-400 select-none z-20">
      <div className="flex items-center space-x-6">
        {/* Confirm */}
        <div className="flex items-center space-x-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
            {isPlayStation ? '✕' : 'A'}
          </span>
          <span className="text-slate-300 font-medium">Select</span>
        </div>

        {/* Back */}
        <div className="flex items-center space-x-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[11px] font-bold">
            {isPlayStation ? '○' : 'B'}
          </span>
          <span className="text-slate-300 font-medium">Back</span>
        </div>

        {/* Action */}
        <div className="flex items-center space-x-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 text-[11px] font-bold">
            {isPlayStation ? '□' : 'X'}
          </span>
          <span className="text-slate-300 font-medium">Favorite</span>
        </div>

        {/* Options */}
        <div className="flex items-center space-x-1.5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[11px] font-bold">
            {isPlayStation ? '△' : 'Y'}
          </span>
          <span className="text-slate-300 font-medium">Options</span>
        </div>

        {/* Switch Tab */}
        <div className="flex items-center space-x-1.5">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
            LB / RB
          </span>
          <span className="text-slate-400">Switch Tab (Q / E)</span>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-slate-500 text-[11px]">
        <span>Nav: D-Pad / Left Stick</span>
        <span>•</span>
        <span>Quick Menu: Start</span>
      </div>
    </footer>
  );
};

