import React, { useState } from 'react';
import { useLibraryStore, SortOption } from '@/stores/libraryStore';
import { api } from '@/services/tauri';
import { Game, GameSource } from '@/types';
import { GameCard } from '@/components/game-cards/GameCard';
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  FolderSearch,
  CheckCircle2,
  Star,
  Gamepad2,
  RefreshCw,
} from 'lucide-react';

interface LibraryScreenProps {
  onSelectGame: (game: Game) => void;
  onOpenAddModal: () => void;
  onOpenScanModal: () => void;
}

const SOURCES: { id: GameSource | 'all'; label: string }[] = [
  { id: 'all', label: 'All Sources' },
  { id: 'steam', label: 'Steam' },
  { id: 'epic', label: 'Epic Games' },
  { id: 'gog', label: 'GOG' },
  { id: 'local', label: 'Local PC' },
  { id: 'retro', label: 'Retro' },
  { id: 'batocera', label: 'Batocera' },
];

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onSelectGame,
  onOpenAddModal,
  onOpenScanModal,
}) => {
  const {
    games,
    searchQuery,
    setSearchQuery,
    sourceFilter,
    setSourceFilter,
    onlyInstalled,
    toggleOnlyInstalled,
    onlyFavorites,
    toggleOnlyFavorites,
    sortBy,
    setSortBy,
    toggleFavorite,
  } = useLibraryStore();

  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [isSyncingStores, setIsSyncingStores] = useState(false);

  const handleSyncStores = async () => {
    setIsSyncingStores(true);
    try {
      const storeGames = await api.discoverStoreGames();
      if (storeGames && storeGames.length > 0) {
        for (const g of storeGames) {
          useLibraryStore.getState().addGame(g);
        }
        alert(`Discovered and synced ${storeGames.length} titles from Steam and Epic Games!`);
      } else {
        alert('Storefront discovery complete. Ensure Steam or Epic Games Launcher is installed.');
      }
    } catch (e: any) {
      alert(`Store discovery error: ${e?.message || e}`);
    } finally {
      setIsSyncingStores(false);
    }
  };

  const filteredGames = React.useMemo(() => {
    return games
      .filter((g) => {
        if (sourceFilter !== 'all' && g.source !== sourceFilter) return false;
        if (onlyInstalled && !g.installed) return false;
        if (onlyFavorites && !g.isFavorite) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = g.title.toLowerCase().includes(q);
          const matchDev = g.developer?.toLowerCase().includes(q) || false;
          const matchPlatform = g.platform.toLowerCase().includes(q);
          if (!matchTitle && !matchDev && !matchPlatform) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'playtime') return (b.playtimeMinutes || 0) - (a.playtimeMinutes || 0);
        if (sortBy === 'lastPlayed') {
          return new Date(b.lastPlayedAt || 0).getTime() - new Date(a.lastPlayedAt || 0).getTime();
        }
        return 0;
      });
  }, [games, sourceFilter, onlyInstalled, onlyFavorites, searchQuery, sortBy]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Library Top Filter Bar */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Game Library</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 font-mono text-xs font-semibold">
              {filteredGames.length}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSyncStores}
              disabled={isSyncingStores}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 text-sky-400 ${isSyncingStores ? 'animate-spin' : ''}`} />
              <span>{isSyncingStores ? 'Syncing...' : 'Sync Steam & Epic'}</span>
            </button>
            <button
              onClick={onOpenScanModal}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm"
            >
              <FolderSearch className="w-4 h-4 text-sky-400" />
              <span>Scan Folders</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-500/25"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Custom Game</span>
            </button>
          </div>
        </div>

        {/* Search, Sources & Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, developer, or platform..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Source Tabs */}
          <div className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 overflow-x-auto">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSourceFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  sourceFilter === s.id
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Quick Filter Toggles */}
          <button
            onClick={toggleOnlyInstalled}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyInstalled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Installed</span>
          </button>

          <button
            onClick={toggleOnlyFavorites}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              onlyFavorites
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Favorites</span>
          </button>

          {/* Sort Menu */}
          <div className="relative">
            <button
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:border-slate-700"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">Sort: {sortBy}</span>
            </button>

            {sortDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-1 z-30">
                {(['name', 'playtime', 'lastPlayed'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSortBy(opt);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs capitalize ${
                      sortBy === opt
                        ? 'bg-sky-500 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {opt === 'lastPlayed' ? 'Last Played' : opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Cards Grid View */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={onSelectGame}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-inner">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">No Games Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                {searchQuery || sourceFilter !== 'all' || onlyInstalled || onlyFavorites
                  ? 'No games match the current search filters. Try clearing your search.'
                  : 'Your library is empty. Click "Scan Folders" or "Add Custom Game" to get started.'}
              </p>
            </div>
            {(searchQuery || sourceFilter !== 'all' || onlyInstalled || onlyFavorites) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSourceFilter('all');
                  if (onlyInstalled) toggleOnlyInstalled();
                  if (onlyFavorites) toggleOnlyFavorites();
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

