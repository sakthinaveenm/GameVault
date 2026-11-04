import React from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { useControllerStore } from '@/stores/controllerStore';
import { useNavigationStore } from '@/stores/navigationStore';
import {
  Gamepad2,
  Maximize2,
  Minimize2,
  Search,
  Wifi,
  WifiOff,
  User,
  ShieldCheck,
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const { activeProfile } = useProfileStore();
  const { activeController } = useControllerStore();
  const { isFullscreen, toggleFullscreen, setCurrentTab, setQuickMenuOpen } = useNavigationStore();

  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="h-16 px-6 bg-[#0b0f17]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between select-none z-20">
      {/* Search Input Trigger */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        <button
          onClick={() => setCurrentTab('library')}
          className="w-full flex items-center h-10 px-3 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all text-sm group"
        >
          <Search className="w-4 h-4 mr-2 text-slate-500 group-hover:text-sky-400 transition-colors" />
          <span className="truncate">Search library, tags, platforms...</span>
          <kbd className="ml-auto px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded border border-slate-700">
            Y / /
          </kbd>
        </button>
      </div>

      {/* Right Controls & Indicators */}
      <div className="flex items-center space-x-4">
        {/* Network Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Offline Mode</span>
            </>
          )}
        </div>

        {/* Controller Status Indicator */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs transition-colors ${
            activeController
              ? 'bg-sky-950/40 border-sky-500/40 text-sky-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="capitalize font-mono">
            {activeController ? activeController.type : 'Keyboard'}
          </span>
        </div>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Profile Pill */}
        <button
          onClick={() => setCurrentTab('profiles')}
          className="flex items-center space-x-2.5 pl-2 pr-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
            {activeProfile?.displayName.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-200 leading-tight">
              {activeProfile?.displayName || 'Player 1'}
            </span>
            {activeProfile?.linkedGoogleEmail ? (
              <span className="text-[10px] text-emerald-400 flex items-center">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" /> Synced
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-mono">Local</span>
            )}
          </div>
        </button>
      </div>
    </header>
  );
};

