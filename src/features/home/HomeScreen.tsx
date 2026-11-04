import React from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { useProfileStore } from '@/stores/profileStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { Game } from '@/types';
import { GameCard } from '@/components/game-cards/GameCard';
import {
  Play,
  Clock,
  Sparkles,
  Gamepad2,
  Cloud,
  FolderSearch,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';

interface HomeScreenProps {
  onSelectGame: (game: Game) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectGame }) => {
  const { games, toggleFavorite } = useLibraryStore();
  const { activeProfile } = useProfileStore();
  const { setCurrentTab } = useNavigationStore();

  const recentGames = React.useMemo(() => {
    return [...games]
      .filter((g) => g.lastPlayedAt || g.playtimeMinutes)
      .slice(0, 6);
  }, [games]);

  const favoriteGames = React.useMemo(() => {
    return games.filter((g) => g.isFavorite).slice(0, 6);
  }, [games]);

  const heroGame = recentGames[0] || games[0] || null;

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 select-none">
      {/* Welcome & Profile Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight flex items-center">
            Welcome back,{' '}
            <span className="text-sky-400 ml-2">
              {activeProfile?.displayName || 'Player 1'}
            </span>
            <Sparkles className="w-5 h-5 ml-2 text-amber-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Universal Game Hub is ready. {games.length} games available offline.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setCurrentTab('library')}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-md"
          >
            <FolderSearch className="w-4 h-4 text-sky-400" />
            <span>Scan Folders</span>
          </button>
          <button
            onClick={() => setCurrentTab('library')}
            className="flex items-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/25"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Game</span>
          </button>
        </div>
      </div>

      {/* Hero Showcase (Continue Playing) */}
      {heroGame ? (
        <div className="relative w-full h-80 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl flex items-end p-8 group">
          {heroGame.bannerUrl || heroGame.coverUrl ? (
            <img
              src={heroGame.bannerUrl || heroGame.coverUrl}
              alt={heroGame.title}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-40 group-hover:scale-105 transition-transform duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-semibold">
              <Play className="w-3 h-3 fill-sky-400 text-sky-400" />
              <span>Continue Playing</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {heroGame.title}
            </h2>

            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
              {heroGame.summary || 'Ready to launch with high-performance desktop execution.'}
            </p>

            <div className="flex items-center space-x-4 pt-2">
              <button
                onClick={() => onSelectGame(heroGame)}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-sky-500/30 transition-all transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play Now</span>
              </button>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{heroGame.playtimeMinutes ? `${Math.round(heroGame.playtimeMinutes / 60)} hrs played` : 'Not played yet'}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Showcase */
        <div className="w-full h-64 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-sky-400 shadow-md">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">Your Unified Library is Ready</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Scan your PC, connect your Steam/Epic/GOG accounts, or configure retro emulators to begin building your console library.
          </p>
          <button
            onClick={() => setCurrentTab('library')}
            className="mt-2 px-4 py-2 bg-sky-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-sky-400 transition-all"
          >
            Go to My Games
          </button>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-100">{games.length}</div>
            <div className="text-xs text-slate-400">Total Games</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-100">
              {games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0)}m
            </div>
            <div className="text-xs text-slate-400">Total Playtime</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-100">Local-First</div>
            <div className="text-xs text-slate-400">Cloud Save Ready</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-100">{favoriteGames.length}</div>
            <div className="text-xs text-slate-400">Favorites</div>
          </div>
        </div>
      </div>

      {/* Recently Played Section */}
      {recentGames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Recently Played</h3>
            <button
              onClick={() => setCurrentTab('library')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300"
            >
              View All ({games.length})
            </button>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {recentGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={onSelectGame}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {favoriteGames.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Favorites</h3>
          </div>

          <div className="grid grid-cols-6 gap-4">
            {favoriteGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onSelect={onSelectGame}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

