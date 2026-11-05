import React from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useStartupStore } from '@/stores/startupStore';
import {
  Gamepad2,
  Save,
  Cloud,
  Users,
  Settings,
  Maximize2,
  X,
  Play,
  LogOut,
} from 'lucide-react';

export const QuickMenuModal: React.FC = () => {
  const { quickMenuOpen, setQuickMenuOpen, setCurrentTab, toggleFullscreen } = useNavigationStore();
  const { switchProfileRequest } = useStartupStore();

  if (!quickMenuOpen) return null;

  const menuItems = [
    {
      label: 'Resume Game Hub',
      icon: Play,
      action: () => setQuickMenuOpen(false),
      highlight: true,
    },
    {
      label: 'Switch Player Profile',
      icon: LogOut,
      action: () => {
        setQuickMenuOpen(false);
        switchProfileRequest();
      },
    },
    {
      label: 'My Games Library',
      icon: Gamepad2,
      action: () => {
        setCurrentTab('library');
        setQuickMenuOpen(false);
      },
    },
    {
      label: 'Save Game Manager',
      icon: Save,
      action: () => {
        setCurrentTab('saves');
        setQuickMenuOpen(false);
      },
    },
    {
      label: 'Cloud & Google Drive Sync',
      icon: Cloud,
      action: () => {
        setCurrentTab('cloud');
        setQuickMenuOpen(false);
      },
    },
    {
      label: 'User Profiles & Settings',
      icon: Users,
      action: () => {
        setCurrentTab('profiles');
        setQuickMenuOpen(false);
      },
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => {
        setCurrentTab('settings');
        setQuickMenuOpen(false);
      },
    },
    {
      label: 'Toggle Fullscreen',
      icon: Maximize2,
      action: () => {
        toggleFullscreen();
        setQuickMenuOpen(false);
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
            <h2 className="font-bold text-slate-100 tracking-wide text-sm uppercase">Quick Menu</h2>
          </div>
          <button
            onClick={() => setQuickMenuOpen(false)}
            aria-label="Close menu"
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="p-3 space-y-1">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                autoFocus={idx === 0}
                onClick={item.action}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left font-medium text-sm transition-all ${
                  item.highlight
                    ? 'bg-sky-500 text-white font-semibold shadow-lg shadow-sky-500/20 hover:bg-sky-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Hint */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Navigate: D-Pad / Arrows</span>
          <span>Select: A / Enter</span>
        </div>
      </div>
    </div>
  );
};

