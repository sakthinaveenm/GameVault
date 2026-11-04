import React from 'react';
import { Game } from '@/types';
import { Star, Play, Clock, HardDrive, Gamepad2 } from 'lucide-react';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  onToggleFavorite?: (id: string) => void;
  isFocused?: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  onToggleFavorite,
  isFocused,
}) => {
  const getSourceBadge = () => {
    switch (game.source) {
      case 'steam':
        return { label: 'Steam', bg: 'bg-blue-600/80 text-blue-100 border-blue-500/50' };
      case 'epic':
        return { label: 'Epic', bg: 'bg-zinc-700/80 text-zinc-100 border-zinc-500/50' };
      case 'gog':
        return { label: 'GOG', bg: 'bg-purple-600/80 text-purple-100 border-purple-500/50' };
      case 'retro':
        return { label: 'Retro', bg: 'bg-amber-600/80 text-amber-100 border-amber-500/50' };
      case 'batocera':
        return { label: 'Batocera', bg: 'bg-teal-600/80 text-teal-100 border-teal-500/50' };
      default:
        return { label: 'Local', bg: 'bg-emerald-600/80 text-emerald-100 border-emerald-500/50' };
    }
  };

  const badge = getSourceBadge();

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onSelect(game)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(game);
        } else if (e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          onToggleFavorite?.(game.id);
        }
      }}
      className={`group relative flex flex-col rounded-2xl bg-slate-900/90 border transition-all duration-200 overflow-hidden text-left cursor-pointer select-none ${
        isFocused
          ? 'border-sky-400 ring-2 ring-sky-400/60 shadow-[0_0_25px_rgba(56,189,248,0.35)] scale-[1.02]'
          : 'border-slate-800/80 hover:border-slate-700 hover:scale-[1.02] hover:shadow-xl'
      }`}
    >
      {/* Cover Artwork Container */}
      <div className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-600">
            <Gamepad2 className="w-12 h-12 mb-2 text-slate-700 group-hover:text-sky-500 transition-colors" />
            <span className="text-xs font-semibold text-center text-slate-400 line-clamp-2">
              {game.title}
            </span>
          </div>
        )}

        {/* Source Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded-md border backdrop-blur-md shadow-md ${badge.bg}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(game.id);
          }}
          aria-label={game.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md border transition-all ${
            game.isFavorite
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg'
              : 'bg-black/40 text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Play Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <div className="flex items-center space-x-2 text-white">
            <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/40">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <span className="text-xs font-semibold tracking-wide">Details & Play</span>
          </div>
        </div>
      </div>

      {/* Game Details Footer */}
      <div className="p-3 bg-slate-900/90 flex flex-col flex-1 justify-between">
        <h3 className="font-semibold text-slate-100 text-sm truncate leading-tight group-hover:text-sky-300 transition-colors">
          {game.title}
        </h3>

        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{game.playtimeMinutes ? `${Math.round(game.playtimeMinutes / 60)}h` : '0h'}</span>
          </div>

          <div className="flex items-center space-x-1">
            <HardDrive className="w-3 h-3 text-slate-500" />
            <span className="capitalize">{game.platform}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

