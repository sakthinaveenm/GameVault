import React, { useState, useEffect } from 'react';
import { Game, GameSource, PlatformType } from '@/types';
import { useLibraryStore } from '@/stores/libraryStore';
import { api } from '@/services/tauri';
import { PlusCircle, X, FolderOpen, Gamepad2 } from 'lucide-react';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose }) => {
  const { addGame } = useLibraryStore();

  const [title, setTitle] = useState('');
  const [source, setSource] = useState<GameSource>('local');
  const [platform, setPlatform] = useState<PlatformType>('windows');
  const [executablePath, setExecutablePath] = useState('');
  const [developer, setDeveloper] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    api.getSystemInfo().then((info) => {
      const os = (info.os || 'windows').toLowerCase();
      if (os.includes('win')) {
        setPlatform('windows');
      } else if (os.includes('mac')) {
        setPlatform('macos');
      } else if (os.includes('linux')) {
        setPlatform('linux');
      }
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newGame: Game = {
      id: `game-${Date.now()}`,
      title: title.trim(),
      source,
      platform,
      executablePath: executablePath.trim() || undefined,
      developer: developer.trim() || undefined,
      summary: summary.trim() || undefined,
      installed: true,
      isFavorite: false,
      playtimeMinutes: 0,
    };

    addGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Add Custom Game</h3>
              <p className="text-xs text-slate-400">Register a local PC game, binary, or ROM.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Game Title *</label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hades II"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as GameSource)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="local">Local Executable</option>
                <option value="steam">Steam</option>
                <option value="epic">Epic Games</option>
                <option value="gog">GOG Galaxy</option>
                <option value="retro">Retro ROM</option>
                <option value="batocera">Batocera</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformType)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="macos">macOS (.app / binary)</option>
                <option value="windows">Windows (.exe)</option>
                <option value="linux">Linux (ELF)</option>
                <option value="snes">Super Nintendo (SNES)</option>
                <option value="ps1">PlayStation 1</option>
                <option value="ps2">PlayStation 2</option>
                <option value="gamecube">Nintendo GameCube</option>
                <option value="arcade">MAME / Arcade</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Executable or ROM Path</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={executablePath}
                onChange={(e) => setExecutablePath(e.target.value)}
                placeholder="/Applications/Game.app or ~/Games/game.exe"
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 text-slate-300"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Developer / Studio</label>
            <input
              type="text"
              value={developer}
              onChange={(e) => setDeveloper(e.target.value)}
              placeholder="e.g. Supergiant Games"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Short Summary</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of the game..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
          >
            Add to Library
          </button>
        </div>
      </form>
    </div>
  );
};

