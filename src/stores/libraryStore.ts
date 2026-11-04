import { create } from 'zustand';
import { Game, GameSource, PlatformType } from '@/types';
import { api } from '@/services/tauri';

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
  loadGamesFromDb: (profileId: string) => Promise<void>;
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => Promise<void>;
  updateGame: (id: string, updates: Partial<Game>) => void;
  removeGame: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSourceFilter: (source: GameSource | 'all') => void;
  setPlatformFilter: (platform: PlatformType | 'all') => void;
  toggleOnlyInstalled: () => void;
  toggleOnlyFavorites: () => void;
  setSortBy: (sort: SortOption) => void;
  toggleFavorite: (id: string, profileId?: string) => Promise<void>;
  recordPlaytime: (id: string, minutes: number, profileId?: string) => Promise<void>;
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

  loadGamesFromDb: async (profileId: string) => {
    try {
      const list = await api.listGames(profileId);
      if (list && list.length > 0) {
        set({ games: list });
      }
    } catch (e) {
      console.warn('Could not load games from DB:', e);
    }
  },

  setGames: (games) => set({ games }),

  addGame: async (game) => {
    set((state) => ({ games: [...state.games, game] }));
    try {
      await api.upsertGame(game);
    } catch (e) {
      console.warn('Failed to upsert game to DB:', e);
    }
  },

  updateGame: (id, updates) =>
    set((state) => ({
      games: state.games.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  removeGame: async (id) => {
    set((state) => ({
      games: state.games.filter((g) => g.id !== id),
    }));
    try {
      await api.deleteGame(id);
    } catch (e) {
      console.warn('Failed to delete game from DB:', e);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSourceFilter: (source) => set({ sourceFilter: source }),

  setPlatformFilter: (platform) => set({ platformFilter: platform }),

  toggleOnlyInstalled: () => set((state) => ({ onlyInstalled: !state.onlyInstalled })),

  toggleOnlyFavorites: () => set((state) => ({ onlyFavorites: !state.onlyFavorites })),

  setSortBy: (sortBy) => set({ sortBy }),

  toggleFavorite: async (id, profileId) => {
    const { games } = get();
    const game = games.find((g) => g.id === id);
    if (game) {
      const newFav = !game.isFavorite;
      get().updateGame(id, { isFavorite: newFav });
      if (profileId) {
        try {
          await api.toggleFavorite(profileId, id, newFav);
        } catch (e) {
          console.warn('Failed to toggle favorite in DB:', e);
        }
      }
    }
  },

  recordPlaytime: async (id, minutes, profileId) => {
    const { games } = get();
    const game = games.find((g) => g.id === id);
    if (game) {
      const updatedTime = (game.playtimeMinutes || 0) + minutes;
      get().updateGame(id, {
        playtimeMinutes: updatedTime,
        lastPlayedAt: new Date().toISOString(),
      });
      if (profileId) {
        try {
          await api.recordPlaytime(profileId, id, minutes);
        } catch (e) {
          console.warn('Failed to record playtime in DB:', e);
        }
      }
    }
  },
}));
