import { create } from 'zustand';
import { NavigationTab } from '@/types';

interface NavigationState {
  currentTab: NavigationTab;
  sidebarExpanded: boolean;
  isFullscreen: boolean;
  selectedGameId: string | null;
  quickMenuOpen: boolean;
  setCurrentTab: (tab: NavigationTab) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  toggleFullscreen: () => void;
  setSelectedGameId: (id: string | null) => void;
  setQuickMenuOpen: (open: boolean) => void;
  nextTab: () => void;
  prevTab: () => void;
}

const TABS: NavigationTab[] = [
  'home',
  'library',
  'retro',
  'emulators',
  'batocera',
  'saves',
  'cloud',
  'profiles',
  'statistics',
  'controllers',
  'downloads',
  'settings',
];

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentTab: 'home',
  sidebarExpanded: false,
  isFullscreen: false,
  selectedGameId: null,
  quickMenuOpen: false,

  setCurrentTab: (tab) => set({ currentTab: tab, selectedGameId: null }),

  toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

  toggleFullscreen: () => {
    const isFull = !get().isFullscreen;
    if (typeof document !== 'undefined') {
      if (isFull && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (!isFull && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
    set({ isFullscreen: isFull });
  },

  setSelectedGameId: (id) => set({ selectedGameId: id }),

  setQuickMenuOpen: (open) => set({ quickMenuOpen: open }),

  nextTab: () => {
    const cur = get().currentTab;
    const idx = TABS.indexOf(cur);
    const nextIdx = (idx + 1) % TABS.length;
    set({ currentTab: TABS[nextIdx] });
  },

  prevTab: () => {
    const cur = get().currentTab;
    const idx = TABS.indexOf(cur);
    const prevIdx = (idx - 1 + TABS.length) % TABS.length;
    set({ currentTab: TABS[prevIdx] });
  },
}));

