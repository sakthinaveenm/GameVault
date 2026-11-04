import { invoke } from '@tauri-apps/api/core';
import { UserProfile, ControllerInfo, Game, Emulator, SaveSnapshot } from '@/types';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export interface ScannedCandidateDto {
  title: string;
  executable_path: string;
  platform: string;
  file_size_bytes: number;
}

export interface BatoceraNodeDto {
  host: string;
  port: number;
  is_online: boolean;
  latency_ms?: number;
}

export const api = {
  ping: async (): Promise<string> => {
    if (isTauriEnvironment()) {
      return await invoke<string>('ping');
    }
    return 'pong (web mode)';
  },

  listProfiles: async (): Promise<UserProfile[]> => {
    if (isTauriEnvironment()) {
      return await invoke<UserProfile[]>('list_profiles');
    }
    return [];
  },

  createProfile: async (
    displayName: string,
    avatarPath?: string
  ): Promise<UserProfile> => {
    if (isTauriEnvironment()) {
      return await invoke<UserProfile>('create_profile', {
        displayName,
        avatarPath: avatarPath || null,
      });
    }
    return {
      id: `prof-${Date.now()}`,
      displayName,
      avatarPath,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  deleteProfile: async (id: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('delete_profile', { id });
    }
  },

  listControllers: async (): Promise<ControllerInfo[]> => {
    if (isTauriEnvironment()) {
      return await invoke<ControllerInfo[]>('list_controllers');
    }
    return [];
  },

  scanDirectory: async (path: string, maxDepth?: number): Promise<ScannedCandidateDto[]> => {
    if (isTauriEnvironment()) {
      return await invoke<ScannedCandidateDto[]>('scan_directory_for_games', {
        path,
        maxDepth: maxDepth || 3,
      });
    }
    return [];
  },

  listGames: async (profileId: string): Promise<Game[]> => {
    if (isTauriEnvironment()) {
      return await invoke<Game[]>('list_games', { profileId });
    }
    return [];
  },

  upsertGame: async (game: Game): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('upsert_game', { game });
    }
  },

  toggleFavorite: async (profileId: string, gameId: string, isFavorite: boolean): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('toggle_game_favorite', { profileId, gameId, isFavorite });
    }
  },

  recordPlaytime: async (profileId: string, gameId: string, minutes: number): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('record_game_playtime', { profileId, gameId, minutes });
    }
  },

  deleteGame: async (gameId: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('delete_game', { gameId });
    }
  },

  launchGame: async (executablePath: string, args: string[]): Promise<number> => {
    if (isTauriEnvironment()) {
      return await invoke<number>('launch_game', { executablePath, args });
    }
    console.log(`[Browser Mode] Simulated launch of ${executablePath} with args:`, args);
    return 12345;
  },

  discoverStoreGames: async (): Promise<Game[]> => {
    if (isTauriEnvironment()) {
      return await invoke<Game[]>('discover_store_games');
    }
    return [];
  },

  createSaveSnapshot: async (
    profileId: string,
    gameId: string,
    saveDir: string
  ): Promise<SaveSnapshot> => {
    if (isTauriEnvironment()) {
      return await invoke<SaveSnapshot>('create_game_save_snapshot', {
        profileId,
        gameId,
        saveDir,
      });
    }
    return {
      id: `snap-${Date.now()}`,
      profileId,
      gameId,
      deviceId: 'Browser Simulator',
      snapshotHash: 'simulated-hash-sha256',
      archivePath: 'simulated/path.zip',
      compressedSize: 1048576,
      cloudStatus: 'local_only',
      createdAt: new Date().toISOString(),
      fileCount: 3,
    };
  },

  listSaveSnapshots: async (profileId: string, gameId: string): Promise<SaveSnapshot[]> => {
    if (isTauriEnvironment()) {
      return await invoke<SaveSnapshot[]>('list_save_snapshots', {
        profileId,
        gameId,
      });
    }
    return [];
  },

  restoreSaveSnapshot: async (snapshotId: string, targetSaveDir: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('restore_save_snapshot', {
        snapshotId,
        targetSaveDir,
      });
    }
  },

  getKnownEmulators: async (): Promise<Emulator[]> => {
    if (isTauriEnvironment()) {
      return await invoke<Emulator[]>('get_known_emulators');
    }
    return [];
  },

  launchRom: async (
    emulatorPath: string,
    customArgs: string | null,
    romPath: string
  ): Promise<number> => {
    if (isTauriEnvironment()) {
      return await invoke<number>('launch_rom', {
        emulatorPath,
        customArgs,
        romPath,
      });
    }
    return 12345;
  },

  pingBatoceraNode: async (host: string, port: number): Promise<BatoceraNodeDto> => {
    if (isTauriEnvironment()) {
      return await invoke<BatoceraNodeDto>('ping_batocera_node', { host, port });
    }
    return { host, port, is_online: true, latency_ms: 12 };
  },
};
