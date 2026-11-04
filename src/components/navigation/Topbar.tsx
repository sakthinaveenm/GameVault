import React, { useState, useEffect } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { useControllerStore } from '@/stores/controllerStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { NavigationTab } from '@/types';
import {
  Gamepad2,
  Maximize2,
  Minimize2,
  Search,
  Wifi,
  WifiOff,
  User,
  ShieldCheck,
  Power,
  Menu,
} from 'lucide-react';

interface PrimaryTab {
  id: NavigationTab;
  label: string;
}

const PRIMARY_TABS: PrimaryTab[] = [
  { id: 'home', label: 'Home' },
  { id: 'library', label: 'Library' },
  { id: 'retro', label: 'Retro' },
  { id: 'saves', label: 'Saves' },
  { id: 'cloud', label: 'Sync' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'settings', label: 'Settings' },
];

export const Topbar: React.FC = () => {
  const { activeProfile } = useProfileStore();
  const { activeController } = useControllerStore();
  const {
    currentTab,
    setCurrentTab,
    toggleSidebar,
    isFullscreen,
    toggleFullscreen,
    setQuickMenuOpen,
  } = useNavigationStore();

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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
    <header className="h-16 px-6 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between select-none z-20 shrink-0">
      {/* Left: Steam Menu Button + Primary Big Picture Tabs */}
      <div className="flex items-center space-x-4">
        {/* Steam Button */}
        <button
          onClick={toggleSidebar}
          className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-600/90 to-blue-700/90 hover:from-sky-500 hover:to-blue-600 border border-sky-400/40 text-white text-xs font-black tracking-wider transition-all shadow-md shadow-sky-500/20 active:scale-95 group"
          title="Open Steam Side Menu"
        >
          <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center font-bold text-[9px] group-hover:rotate-45 transition-transform">
            ⚙
          </div>
          <span>STEAM</span>
        </button>

        {/* Primary Big Picture Navigation Tabs */}
        <nav className="flex items-center space-x-1">
          <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hidden sm:inline-block">
            LB
          </span>

          <div className="flex items-center space-x-1 px-1">
            {PRIMARY_TABS.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? 'text-white drop-shadow-[0_0_12px_rgba(56,189,248,0.7)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-lg'
                  }`}
                >
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2.5 right-2.5 h-[3px] bg-gradient-to-r from-sky-400 to-blue-500 rounded-full shadow-[0_0_10px_#38bdf8]" />
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 hidden sm:inline-block">
            RB
          </span>
        </nav>
      </div>

      {/* Right: Search, Clock, Status Indicators, Profile, Power */}
      <div className="flex items-center space-x-3.5">
        {/* Search Trigger */}
        <button
          onClick={() => setCurrentTab('library')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-all group"
          title="Search Games (Y)"
        >
          <Search className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 transition-colors" />
          <span className="hidden md:inline text-[11px] font-medium">Search</span>
          <kbd className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-[10px] text-amber-400 font-bold">
            Y
          </kbd>
        </button>

        {/* Live Clock (Steam Deck Style) */}
        <div className="px-2.5 py-1 text-xs font-extrabold text-slate-200 font-mono tracking-wider">
          {currentTime || '12:00 PM'}
        </div>

        {/* Online / Offline Status */}
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          {isOnline ? (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          )}
        </div>

        {/* Gamepad Connection Badge */}
        <div
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg border text-xs ${
            activeController
              ? 'bg-sky-950/40 border-sky-500/40 text-sky-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
          title={activeController ? `Connected: ${activeController.type}` : 'Keyboard Controls'}
        >
          <Gamepad2 className="w-4 h-4" />
        </div>

        {/* Fullscreen F11 Button */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Enter Fullscreen (F11)'}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Profile Avatar & Name */}
        <button
          onClick={() => setCurrentTab('profiles')}
          className="flex items-center space-x-2 pl-1.5 pr-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
        >
          <div className="relative w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-black shadow-md">
            {activeProfile?.displayName ? activeProfile.displayName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <span className="text-xs font-bold text-slate-200 hidden sm:inline truncate max-w-[100px]">
            {activeProfile?.displayName || 'Player 1'}
          </span>
        </button>

        {/* Power / Quick Menu Action */}
        <button
          onClick={() => setQuickMenuOpen(true)}
          title="Quick Menu & Power Options"
          aria-label="Power and quick menu"
          className="p-2 text-slate-400 hover:text-rose-400 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-colors"
        >
          <Power className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
