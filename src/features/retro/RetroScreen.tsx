import React, { useState } from 'react';
import { useLibraryStore } from '@/stores/libraryStore';
import { Game, PlatformType } from '@/types';
import { GameCard } from '@/components/game-cards/GameCard';
import { ScanFoldersModal } from '@/components/dialogs/ScanFoldersModal';
import { AddGameModal } from '@/components/dialogs/AddGameModal';
import { Tv, FolderSearch, Gamepad2, PlusCircle } from 'lucide-react';

interface RetroScreenProps {
  onSelectGame: (game: Game) => void;
}

const RETRO_SYSTEMS: { id: PlatformType | 'all'; name: string; icon: string }[] = [
  { id: 'all', name: 'All Retro Systems', icon: '🎮' },
  { id: 'snes', name: 'Super Nintendo', icon: '🕹️' },
  { id: 'nes', name: 'NES', icon: '👾' },
  { id: 'genesis', name: 'Sega Genesis / MegaDrive', icon: '⚡' },
  { id: 'ps1', name: 'PlayStation 1', icon: '💿' },
  { id: 'ps2', name: 'PlayStation 2', icon: '📀' },
  { id: 'psp', name: 'PSP', icon: '📱' },
  { id: 'gamecube', name: 'GameCube', icon: '📦' },
  { id: 'arcade', name: 'MAME / Arcade', icon: '🕹️' },
];

export const RetroScreen: React.FC<RetroScreenProps> = ({ onSelectGame }) => {
  const { games, toggleFavorite } = useLibraryStore();
  const [selectedSystem, setSelectedSystem] = useState<PlatformType | 'all'>('all');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const retroGames = React.useMemo(() => {
    return games.filter((g) => {
      const isRetroSource = g.source === 'retro';
      const isRetroPlatform = [
        'snes',
        'nes',
        'genesis',
        'ps1',
        'ps2',
        'ps3',
        'psp',
        'gamecube',
        'wii',
        'n64',
        'arcade',
      ].includes(g.platform);
      if (!isRetroSource && !isRetroPlatform) return false;
      if (selectedSystem !== 'all' && g.platform !== selectedSystem) return false;
      return true;
    });
  }, [games, selectedSystem]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 select-none">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Retro Gaming</h1>
              <p className="text-xs text-slate-400">
                Configured emulators, ROM collections, and classic consoles.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-200 transition-all shadow-sm"
            >
              <FolderSearch className="w-4 h-4 text-amber-400" />
              <span>Scan ROM Directory</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add ROM</span>
            </button>
          </div>
        </div>

        {/* System Selectors Carousel */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {RETRO_SYSTEMS.map((sys) => (
            <button
              key={sys.id}
              onClick={() => setSelectedSystem(sys.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedSystem === sys.id
                  ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <span>{sys.icon}</span>
              <span>{sys.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6">
        {retroGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {retroGames.map((game) => (
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
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500/60 shadow-inner">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-200">No Retro Games Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Configure your emulator paths and scan your legal ROM folders to populate classic game libraries.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setIsScanModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700"
              >
                <FolderSearch className="w-3.5 h-3.5 text-amber-400" />
                <span>Scan ROM Folder</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-amber-500/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add ROM File</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ScanFoldersModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        initialSource="retro"
        initialPlatform={selectedSystem !== 'all' ? selectedSystem : 'snes'}
      />
    </div>
  );
};
