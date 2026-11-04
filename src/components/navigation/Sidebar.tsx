import React from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { NavigationTab } from '@/types';
import {
  LayoutDashboard,
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: LayoutDashboard },
  { id: 'library', label: 'My Games', icon: Gamepad2 },
  { id: 'retro', label: 'Retro Games', icon: Tv },
  { id: 'emulators', label: 'Emulators', icon: Cpu },
  { id: 'batocera', label: 'Batocera', icon: Network },
  { id: 'saves', label: 'Save Manager', icon: Save },
  { id: 'cloud', label: 'Cloud & Sync', icon: Cloud },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'statistics', label: 'Statistics', icon: BarChart2 },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, sidebarExpanded, toggleSidebar } = useNavigationStore();

  return (
    <aside
      className={`relative flex flex-col bg-[#0d121c]/95 border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
        sidebarExpanded ? 'w-60' : 'w-20'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/60">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white font-bold text-lg shrink-0">
            GH
          </div>
          {sidebarExpanded && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wider text-slate-100 uppercase truncate">
                Game Hub
              </span>
              <span className="text-[10px] text-sky-400 font-mono tracking-widest uppercase">
                Universal
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          {sidebarExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center h-11 px-3 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-sky-500/15 text-sky-400 font-semibold shadow-inner border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-400'
                }`}
              />
              {sidebarExpanded && (
                <span className="ml-3 text-sm truncate tracking-wide text-left">{item.label}</span>
              )}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-sky-400 rounded-r shadow-[0_0_10px_#38bdf8]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Version Tag */}
      <div className="p-3 border-t border-slate-800/60 text-center">
        {sidebarExpanded ? (
          <span className="text-[11px] text-slate-500 font-mono">v0.1.0-alpha • Local First</span>
        ) : (
          <span className="text-[10px] text-slate-500 font-mono">v0.1</span>
        )}
      </div>
    </aside>
  );
};

