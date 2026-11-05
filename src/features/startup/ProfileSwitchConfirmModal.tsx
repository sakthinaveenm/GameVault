import React, { useEffect } from 'react';
import { useStartupStore } from '@/stores/startupStore';
import { useProfileStore } from '@/stores/profileStore';
import { LogOut, AlertCircle, Check, X, Gamepad2 } from 'lucide-react';

export const ProfileSwitchConfirmModal: React.FC = () => {
  const { isSwitchConfirmOpen, confirmProfileSwitch, cancelProfileSwitch } = useStartupStore();
  const { activeProfile } = useProfileStore();

  useEffect(() => {
    if (!isSwitchConfirmOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelProfileSwitch();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        confirmProfileSwitch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSwitchConfirmOpen, confirmProfileSwitch, cancelProfileSwitch]);

  if (!isSwitchConfirmOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Header Icon + Title */}
        <div className="flex items-center space-x-3.5 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <LogOut className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Switch Player Profile?
            </h2>
            <p className="text-xs text-slate-400">
              Current profile: <span className="text-sky-400 font-semibold">{activeProfile?.displayName || 'Player'}</span>
            </p>
          </div>
        </div>

        {/* Warning Body */}
        <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-start space-x-2.5 text-xs text-slate-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Switching profiles will cleanly close your current session and isolate all save data,
              favorites, and settings before returning to Profile Selection.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={cancelProfileSwitch}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all controller-focus-ring focus:outline-none"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
            <kbd className="ml-1 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-700 text-[10px] text-slate-400 font-mono">B</kbd>
          </button>

          <button
            type="button"
            autoFocus
            onClick={confirmProfileSwitch}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 controller-focus-ring focus:outline-none"
          >
            <Check className="w-4 h-4" />
            <span>Switch Profile</span>
            <kbd className="ml-1 px-1.5 py-0.5 bg-rose-700 rounded border border-rose-500 text-[10px] text-rose-100 font-mono">A</kbd>
          </button>
        </div>

        {/* Footer Hint */}
        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span className="flex items-center space-x-1.5">
            <Gamepad2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Gamepad Navigation Enabled</span>
          </span>
          <span>Esc / B to Dismiss</span>
        </div>
      </div>
    </div>
  );
};
