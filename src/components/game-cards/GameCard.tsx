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
        return { label: 'Steam', bg: 'bg-blue-600/90 text-blue-100 border-blue-400/50' };
      case 'epic':
        return { label: 'Epic', bg: 'bg-zinc-700/90 text-zinc-100 border-zinc-400/50' };
      case 'gog':
        return { label: 'GOG', bg: 'bg-purple-600/90 text-purple-100 border-purple-400/50' };
      case 'retro':
        return { label: 'Retro', bg: 'bg-amber-600/90 text-amber-100 border-amber-400/50' };
      case 'batocera':
        return { label: 'Batocera', bg: 'bg-teal-600/90 text-teal-100 border-teal-400/50' };
      default:
        return { label: 'Local PC', bg: 'bg-emerald-600/90 text-emerald-100 border-emerald-400/50' };
    }
  };

  const badge = getSourceBadge();
  const hoursPlayed = game.playtimeMinutes ? (game.playtimeMinutes / 60).toFixed(1) : null;

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
      className={`group relative flex flex-col rounded-2xl bg-[#111827] border transition-all duration-300 overflow-hidden text-left cursor-pointer select-none ${
        isFocused
          ? 'border-sky-400 ring-2 ring-sky-400/80 shadow-[0_12px_32px_rgba(56,189,248,0.4)] scale-105 -translate-y-1.5'
          : 'border-slate-800 hover:border-sky-400/80 hover:ring-2 hover:ring-sky-400/60 hover:scale-105 hover:-translate-y-1.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.9)]'
      }`}
    >
      {/* 2:3 Capsule Cover Container */}
      <div className="relative aspect-[2/3] w-full bg-slate-950 overflow-hidden">
        {game.coverUrl ? (
          <img
            src={game.coverUrl}
            alt={game.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-slate-500">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 group-hover:text-sky-400 group-hover:border-sky-500/40 transition-colors shadow-inner mb-3">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <span className="text-xs font-bold text-center text-slate-300 line-clamp-2 px-2">
              {game.title}
            </span>
          </div>
        )}

        {/* Source Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`px-2 py-0.5 text-[9px] font-black tracking-wider uppercase rounded-md border backdrop-blur-md shadow-md ${badge.bg}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Favorite Star Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(game.id);
          }}
          aria-label={game.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-md border transition-all ${
            game.isFavorite
              ? 'bg-amber-500/25 text-amber-400 border-amber-500/50 shadow-lg scale-110'
              : 'bg-black/50 text-slate-400 border-white/10 hover:text-white hover:bg-black/75'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${game.isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        {/* Full-bleed Vignette & Title Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-3.5">
          <h3 className="font-extrabold text-white text-sm leading-tight drop-shadow-md group-hover:text-sky-300 transition-colors line-clamp-2">
            {game.title}
          </h3>

          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{hoursPlayed ? `${hoursPlayed}h` : 'Ready to play'}</span>
            </div>
            <span className="uppercase tracking-wider text-slate-500 font-mono text-[9px]">
              {game.platform}
            </span>
          </div>
        </div>

        {/* Play Action Hover Glow Pill */}
        <div className="absolute inset-0 bg-sky-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xl shadow-sky-500/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
