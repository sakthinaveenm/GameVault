import React, { useRef } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Info,
  Star,
} from 'lucide-react';

interface HomeScreenProps {
  onSelectGame: (game: Game) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectGame }) => {
  const { games, toggleFavorite } = useLibraryStore();
  const { activeProfile } = useProfileStore();
  const { setCurrentTab } = useNavigationStore();

  const recentShelfRef = useRef<HTMLDivElement>(null);
  const allShelfRef = useRef<HTMLDivElement>(null);
  const favShelfRef = useRef<HTMLDivElement>(null);

  const scrollShelf = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -480 : 480;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const recentGames = React.useMemo(() => {
    return [...games]
      .filter((g) => g.lastPlayedAt || g.playtimeMinutes)
      .slice(0, 10);
  }, [games]);

  const favoriteGames = React.useMemo(() => {
    return games.filter((g) => g.isFavorite);
  }, [games]);

  const heroGame = recentGames[0] || games[0] || null;

  const totalHours = Math.round(
    games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0) / 60
  );

  return (
    <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-8 select-none bg-gradient-to-b from-[#0e1624] via-[#0b0f17] to-[#080c12]">
      {/* Hero Showcase (Steam Big Picture Spotlight) */}
      {heroGame ? (
        <div className="relative w-full h-96 rounded-3xl bg-[#090d15] border border-slate-700/60 overflow-hidden shadow-2xl flex items-end p-8 md:p-10 group">
          {/* Background Artwork with Steam Ambient Vignette */}
          {heroGame.bannerUrl || heroGame.coverUrl ? (
            <img
              src={heroGame.bannerUrl || heroGame.coverUrl}
              alt={heroGame.title}
              className="absolute inset-0 w-full h-full object-cover object-center opacity-45 group-hover:scale-103 transition-transform duration-1000"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-950" />
          )}

          {/* Steam Radial & Gradient Lighting Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d15] via-[#090d15]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d15] via-[#090d15]/40 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/25 border border-sky-400/40 text-sky-300 text-xs font-bold tracking-wide shadow-lg shadow-sky-500/20">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>READY TO PLAY</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-2xl leading-tight">
              {heroGame.title}
            </h1>

            <div className="flex items-center space-x-4 text-xs font-medium text-slate-300">
              <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-sky-400 uppercase font-black text-[10px] tracking-wider border border-slate-700">
                {heroGame.source.toUpperCase()}
              </span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                {heroGame.playtimeMinutes
                  ? `${(heroGame.playtimeMinutes / 60).toFixed(1)} hrs played`
                  : 'Never played'}
              </span>
              <span>•</span>
              <span className="capitalize">{heroGame.platform}</span>
            </div>

            <p className="text-xs text-slate-300/90 line-clamp-2 max-w-xl leading-relaxed">
              {heroGame.summary ||
                'Unified high-performance launcher session ready with verified local assets and automated cloud backups.'}
            </p>

            {/* Action Buttons (Big Picture Console Play Button) */}
            <div className="flex items-center space-x-3.5 pt-2">
              <button
                onClick={() => onSelectGame(heroGame)}
                className="flex items-center space-x-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-slate-950 font-black text-sm tracking-wide shadow-xl shadow-sky-500/40 hover:shadow-sky-500/60 transition-all hover:scale-105 active:scale-95 group"
              >
                <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>PLAY NOW</span>
                <span className="px-1.5 py-0.5 bg-slate-950/20 text-slate-900 rounded text-[10px] font-black">
                  A
                </span>
              </button>

              <button
                onClick={() => onSelectGame(heroGame)}
                className="flex items-center space-x-2 px-5 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-bold transition-all shadow-md"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Game Details</span>
                <span className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-bold">
                  X
                </span>
              </button>

              <button
                onClick={() => toggleFavorite(heroGame.id)}
                className={`p-3.5 rounded-2xl border transition-all ${
                  heroGame.isFavorite
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Favorite"
              >
                <Star className={`w-4 h-4 ${heroGame.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Showcase */
        <div className="w-full h-80 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-sky-400 shadow-inner">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Welcome to Steam Big Picture Hub</h2>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              No games detected yet. Click "Scan Folders" or "Add Game" below to discover your local PC titles and Steam library.
            </p>
          </div>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => setCurrentTab('library')}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 transition-all"
            >
              Browse Library
            </button>
          </div>
        </div>
      )}

      {/* Shelf 1: Recent Games (Steam Deck Horizontal Carousel) */}
      {recentGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Recent Games ({recentGames.length})
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollShelf(recentShelfRef, 'left')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollShelf(recentShelfRef, 'right')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentTab('library')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 ml-2"
              >
                View All
              </button>
            </div>
          </div>

          <div
            ref={recentShelfRef}
            onWheel={handleHorizontalWheel}
            className="flex items-center space-x-5 overflow-x-auto no-scrollbar py-3 px-1 scroll-smooth"
          >
            {recentGames.map((game) => (
              <div key={game.id} className="w-48 sm:w-52 shrink-0">
                <GameCard
                  game={game}
                  onSelect={onSelectGame}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shelf 2: All Installed Games (Horizontal Shelf) */}
      {games.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                All Games in Vault ({games.length})
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollShelf(allShelfRef, 'left')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollShelf(allShelfRef, 'right')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentTab('library')}
                className="text-xs font-bold text-sky-400 hover:text-sky-300 ml-2"
              >
                Grid View
              </button>
            </div>
          </div>

          <div
            ref={allShelfRef}
            onWheel={handleHorizontalWheel}
            className="flex items-center space-x-5 overflow-x-auto no-scrollbar py-3 px-1 scroll-smooth"
          >
            {games.map((game) => (
              <div key={game.id} className="w-48 sm:w-52 shrink-0">
                <GameCard
                  game={game}
                  onSelect={onSelectGame}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shelf 3: Favorites (if any) */}
      {favoriteGames.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Pinned Favorites ({favoriteGames.length})
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => scrollShelf(favShelfRef, 'left')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollShelf(favShelfRef, 'right')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={favShelfRef}
            onWheel={handleHorizontalWheel}
            className="flex items-center space-x-5 overflow-x-auto no-scrollbar py-3 px-1 scroll-smooth"
          >
            {favoriteGames.map((game) => (
              <div key={game.id} className="w-48 sm:w-52 shrink-0">
                <GameCard
                  game={game}
                  onSelect={onSelectGame}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
