import React, { useState } from 'react';
import { Game } from '@/types';
import { useLibraryStore } from '@/stores/libraryStore';
import { useNavigationStore } from '@/stores/navigationStore';
import {
  Play,
  Save,
  Clock,
  HardDrive,
  Calendar,
  Building,
  Star,
  Trash2,
  X,
  Sliders,
  Check,
  AlertCircle,
} from 'lucide-react';

interface GameDetailsModalProps {
  game: Game;
  onClose: () => void;
  onLaunch: (game: Game) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  onClose,
  onLaunch,
}) => {
  const { updateGame, removeGame, toggleFavorite } = useLibraryStore();
  const { setCurrentTab } = useNavigationStore();

  const [launchArgs, setLaunchArgs] = useState(game.launchArguments || '');
  const [isEditingArgs, setIsEditingArgs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSaveArgs = () => {
    updateGame(game.id, { launchArguments: launchArgs });
    setIsEditingArgs(false);
  };

  const handleDelete = () => {
    removeGame(game.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-6 select-none animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner Artwork Header */}
        <div className="relative h-64 w-full bg-slate-950 overflow-hidden shrink-0">
          {game.bannerUrl || game.coverUrl ? (
            <img
              src={game.bannerUrl || game.coverUrl}
              alt={game.title}
              className="w-full h-full object-cover object-top opacity-50"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-950" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close details"
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-slate-300 hover:text-white hover:bg-black/80 transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Floating Cover & Header Info */}
          <div className="absolute bottom-6 left-8 right-8 flex items-end space-x-6">
            <div className="w-32 aspect-[3/4] rounded-2xl bg-slate-950 border-2 border-slate-700 shadow-2xl overflow-hidden shrink-0 hidden sm:block">
              {game.coverUrl ? (
                <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600 font-bold text-xs">
                  Cover
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/40 text-xs font-bold uppercase tracking-wider">
                  {game.source}
                </span>
                <span className="text-xs text-slate-400 capitalize">{game.platform}</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight truncate drop-shadow-md">
                {game.title}
              </h1>
            </div>

            {/* Launch Action Button */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => onLaunch(game)}
                className="flex items-center space-x-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-base tracking-wide shadow-xl shadow-sky-500/30 transition-all transform hover:scale-105"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Launch</span>
              </button>

              <button
                onClick={() => toggleFavorite(game.id)}
                aria-label={game.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-3.5 rounded-2xl border transition-all ${
                  game.isFavorite
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Star className={`w-5 h-5 ${game.isFavorite ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Summary */}
          {game.summary && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{game.summary}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-sky-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Playtime</div>
                <div className="text-sm font-bold text-slate-200">
                  {game.playtimeMinutes ? `${Math.round(game.playtimeMinutes / 60)} hrs` : '0 min'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Release Date</div>
                <div className="text-sm font-bold text-slate-200">
                  {game.releaseDate || 'Unknown'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Developer</div>
                <div className="text-sm font-bold text-slate-200 truncate">
                  {game.developer || 'Unknown'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-500">Status</div>
                <div className="text-sm font-bold text-slate-200">
                  {game.installed ? 'Installed' : 'Cloud Library'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                onClose();
                setCurrentTab('saves');
              }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Save className="w-4 h-4 text-sky-400" />
              <span>Manage Save Backups</span>
            </button>

            <button
              onClick={() => setIsEditingArgs(!isEditingArgs)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Launch Arguments</span>
            </button>
          </div>

          {/* Custom Arguments Input Drawer */}
          {isEditingArgs && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300">
                Custom Launch Parameters (flags passed to executable)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={launchArgs}
                  onChange={(e) => setLaunchArgs(e.target.value)}
                  placeholder="-novid -fullscreen -dx11"
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={handleSaveArgs}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold"
                >
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}

          {/* Danger Zone: Remove Game */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Executable: <span className="font-mono text-slate-400">{game.executablePath || 'Managed by Store Client'}</span>
            </div>

            {confirmDelete ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-rose-400 font-semibold flex items-center">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  Remove from launcher? (Files won't be deleted)
                </span>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold"
                >
                  Yes, Remove
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-slate-500 hover:text-rose-400 transition-colors text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove From Launcher</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

