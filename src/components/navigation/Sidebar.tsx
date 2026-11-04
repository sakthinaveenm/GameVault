import React from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useProfileStore } from '@/stores/profileStore';
import { NavigationTab } from '@/types';
import {
  LayoutDashboard,
  Store,
  Gamepad2,
  Tv,
  Cpu,
  Network,
  Save,
  Cloud,
  Users,
  BarChart2,
  Download,
  Settings,
  X,
  Power,
  Maximize2,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'store', label: 'Store & Catalog', icon: Store, badge: 'HOT' },
  { id: 'library', label: 'My Games', icon: Gamepad2 },
  { id: 'retro', label: 'Retro Consoles', icon: Tv },
  { id: 'emulators', label: 'Emulators', icon: Cpu },
  { id: 'batocera', label: 'Batocera Linux', icon: Network },
  { id: 'saves', label: 'Save Manager', icon: Save },
  { id: 'cloud', label: 'Cloud & Google Drive', icon: Cloud },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'statistics', label: 'Playtime & Stats', icon: BarChart2 },
  { id: 'controllers', label: 'Controller Setup', icon: Gamepad2 },
  { id: 'downloads', label: 'Download Tasks', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, sidebarExpanded, setSidebarExpanded, toggleFullscreen } =
    useNavigationStore();
  const { activeProfile } = useProfileStore();

  if (!sidebarExpanded) return null;

  return (
    <>
      {/* Dimmed Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 animate-fade-in"
        onClick={() => setSidebarExpanded(false)}
      />

      {/* Slide-out Steam Deck Quick Access Drawer */}
      <aside className="fixed inset-y-0 left-0 w-80 bg-[#0d141e]/98 border-r border-slate-700/80 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col z-50 select-none animate-slide-right">
        {/* Steam Brand Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center space-x-3.5">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 shadow-lg shadow-sky-500/30 text-white font-black text-xl shrink-0">
              GH
            </div>
            <div className="flex flex-col">
              <span className="text-base font-black tracking-wider text-slate-100 uppercase">
                STEAM MENU
              </span>
              <span className="text-[11px] text-sky-400 font-mono tracking-widest uppercase flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 inline-block" />
                {activeProfile?.displayName || 'Player 1'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setSidebarExpanded(false)}
            aria-label="Close menu"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-all border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setSidebarExpanded(false);
                }}
                className={`w-full flex items-center justify-between h-12 px-4 rounded-2xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/10 text-sky-300 font-bold border border-sky-500/40 shadow-inner'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-sm truncate tracking-wide text-left">{item.label}</span>
                </div>

                {item.badge && !isActive && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Quick Controls */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={() => {
              toggleFullscreen();
              setSidebarExpanded(false);
            }}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Fullscreen</span>
          </button>

          <span className="text-[11px] text-slate-500 font-mono">
            Universal Game Hub v0.1.2
          </span>
        </div>
      </aside>
    </>
  );
};
