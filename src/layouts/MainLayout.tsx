import React, { useState } from 'react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useProfileStore } from '@/stores/profileStore';
import { useControllerNavigation } from '@/hooks/useControllerNavigation';
import { api } from '@/services/tauri';
import { Game } from '@/types';

import { Sidebar } from '@/components/navigation/Sidebar';
import { Topbar } from '@/components/navigation/Topbar';
import { ControllerHints } from '@/components/navigation/ControllerHints';
import { QuickMenuModal } from '@/components/dialogs/QuickMenuModal';
import { GameDetailsModal } from '@/features/game-details/GameDetailsModal';
import { AddGameModal } from '@/components/dialogs/AddGameModal';
import { ScanFoldersModal } from '@/components/dialogs/ScanFoldersModal';

import { HomeScreen } from '@/features/home/HomeScreen';
import { LibraryScreen } from '@/features/library/LibraryScreen';
import { RetroScreen } from '@/features/retro/RetroScreen';
import { EmulatorsScreen } from '@/features/emulators/EmulatorsScreen';
import { BatoceraScreen } from '@/features/batocera/BatoceraScreen';
import { SaveManagerScreen } from '@/features/save-manager/SaveManagerScreen';
import { CloudSyncScreen } from '@/features/cloud-sync/CloudSyncScreen';
import { ProfilesScreen } from '@/features/profiles/ProfilesScreen';
import { StatisticsScreen } from '@/features/statistics/StatisticsScreen';
import { ControllerSettingsScreen } from '@/features/controller/ControllerSettingsScreen';
import { DownloadsScreen } from '@/features/downloads/DownloadsScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

export const MainLayout: React.FC = () => {
  // Activate global controller + keyboard navigation hook
  useControllerNavigation();

  const { currentTab } = useNavigationStore();
  const { games, recordPlaytime, loadGamesFromDb } = useLibraryStore();
  const { activeProfile } = useProfileStore();

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  React.useEffect(() => {
    if (activeProfile?.id) {
      loadGamesFromDb(activeProfile.id);
    }
  }, [activeProfile?.id, loadGamesFromDb]);

  const handleLaunchGame = async (game: Game) => {
    if (game.executablePath) {
      try {
        const args = game.launchArguments
          ? game.launchArguments.split(' ').filter(Boolean)
          : [];
        await api.launchGame(game.executablePath, args);
        recordPlaytime(game.id, 5, activeProfile?.id);
      } catch (err: any) {
        alert(`Failed to launch ${game.title}: ${err?.message || err}`);
      }
    } else {
      alert(`Launching ${game.title} via official ${game.source.toUpperCase()} client protocol...`);
      recordPlaytime(game.id, 5, activeProfile?.id);
    }
  };

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen onSelectGame={(g) => setSelectedGame(g)} />;
      case 'library':
        return (
          <LibraryScreen
            onSelectGame={(g) => setSelectedGame(g)}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenScanModal={() => setIsScanModalOpen(true)}
          />
        );
      case 'retro':
        return <RetroScreen onSelectGame={(g) => setSelectedGame(g)} />;
      case 'emulators':
        return <EmulatorsScreen />;
      case 'batocera':
        return <BatoceraScreen />;
      case 'saves':
        return <SaveManagerScreen />;
      case 'cloud':
        return <CloudSyncScreen />;
      case 'profiles':
        return <ProfilesScreen />;
      case 'statistics':
        return <StatisticsScreen />;
      case 'controllers':
        return <ControllerSettingsScreen />;
      case 'downloads':
        return <DownloadsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen onSelectGame={(g) => setSelectedGame(g)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0e14] text-slate-100 font-sans">
      {/* Left Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar Navigation & Status */}
        <Topbar />

        {/* Dynamic Screen View */}
        <main className="flex-1 overflow-hidden flex flex-col relative">
          {renderActiveScreen()}
        </main>

        {/* Bottom Controller Button Hints */}
        <ControllerHints />
      </div>

      {/* Modals & Dialogs */}
      <QuickMenuModal />

      {selectedGame && (
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onLaunch={handleLaunchGame}
        />
      )}

      <AddGameModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ScanFoldersModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />
    </div>
  );
};

