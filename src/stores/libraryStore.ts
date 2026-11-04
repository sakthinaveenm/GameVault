import { create } from 'zustand';
import { Game, GameSource, PlatformType } from '@/types';

export type SortOption = 'name' | 'playtime' | 'lastPlayed' | 'releaseDate';

interface LibraryState {
  games: Game[];
  isLoading: boolean;
  searchQuery: string;
  sourceFilter: GameSource | 'all';
  platformFilter: PlatformType | 'all';
  onlyInstalled: boolean;
  onlyFavorites: boolean;
  sortBy: SortOption;
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => void;
  updateGame: (id: string, updates: Partial<Game>) => void;
  removeGame: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSourceFilter: (source: GameSource | 'all') => void;
  setPlatformFilter: (platform: PlatformType | 'all') => void;
  toggleOnlyInstalled: () => void;
  toggleOnlyFavorites: () => void;
  setSortBy: (sort: SortOption) => void;
  toggleFavorite: (id: string) => void;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  games: [],
  isLoading: false,
  searchQuery: '',
  sourceFilter: 'all',
  platformFilter: 'all',
  onlyInstalled: false,
  onlyFavorites: false,
  sortBy: 'name',

  setGames: (games) => set({ games }),

  addGame: (game) => set((state) => ({ games: [...state.games, game] })),

  updateGame: (id, updates) =>
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  removeGame: (id) =>
    set((state) => ({
      games: state.games.filter((g) => g.id !== id),
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSourceFilter: (source) => set({ sourceFilter: source }),

  setPlatformFilter: (platform) => set({ platformFilter: platform }),

  toggleOnlyInstalled: () => set((state) => ({ onlyInstalled: !state.onlyInstalled })),

  toggleOnlyFavorites: () => set((state) => ({ onlyFavorites: !state.onlyFavorites })),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleFavorite: (id) => {
    const { games } = get();
    const game = games.find((g) => g.id === id);
    if (game) {
      get().updateGame(id, { isFavorite: !game.isFavorite });
    }
  },
}));

