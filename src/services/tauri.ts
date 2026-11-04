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

export interface ProfileStatisticsDto {
  total_playtime_minutes: number;
  total_games: number;
  installed_games: number;
  favorite_games: number;
  platform_breakdown: Record<string, number>;
  top_played_games: Array<{
    id: string;
    title: string;
    playtime_minutes: number;
    cover_url?: string;
  }>;
}

export interface DownloadItemDto {
  id: string;
  title: string;
  source_url: string;
  destination_path: string;
  total_bytes: number;
  downloaded_bytes: number;
  status: string;
  checksum?: string;
  created_at: string;
}

export interface PkceSessionDto {
  code_verifier: string;
  code_challenge: string;
  state: string;
}

export interface SystemInfoDto {
  os: string;
  arch: string;
  appVersion: string;
  appDataDir: string;
}

export const api = {
  getSystemInfo: async (): Promise<SystemInfoDto> => {
    if (isTauriEnvironment()) {
      return await invoke('get_system_info');
    }
    const isWin = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('win');
    const isMac = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes('mac');
    return {
      os: isWin ? 'windows' : isMac ? 'macos' : 'linux',
      arch: 'x86_64',
      appVersion: '0.1.1',
      appDataDir: './data',
    };
  },


  getDefaultGameDirectories: async (): Promise<string[]> => {
    if (isTauriEnvironment()) {
      return await invoke<string[]>('get_default_game_directories');
    }
    return ['D:\\Games', 'C:\\Games'];
  },
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

  getProfileStatistics: async (profileId: string): Promise<ProfileStatisticsDto> => {
    if (isTauriEnvironment()) {
      return await invoke<ProfileStatisticsDto>('get_profile_statistics', { profileId });
    }
    return {
      total_playtime_minutes: 0,
      total_games: 0,
      installed_games: 0,
      favorite_games: 0,
      platform_breakdown: {},
      top_played_games: [],
    };
  },

  listDownloads: async (): Promise<DownloadItemDto[]> => {
    if (isTauriEnvironment()) {
      return await invoke<DownloadItemDto[]>('list_downloads');
    }
    return [];
  },

  queueDownload: async (
    title: string,
    sourceUrl: string,
    destinationPath: string,
    expectedChecksum?: string
  ): Promise<DownloadItemDto> => {
    if (isTauriEnvironment()) {
      return await invoke<DownloadItemDto>('queue_download', {
        title,
        sourceUrl,
        destinationPath,
        expectedChecksum: expectedChecksum || null,
      });
    }
    return {
      id: `dl-${Date.now()}`,
      title,
      source_url: sourceUrl,
      destination_path: destinationPath,
      total_bytes: 104857600,
      downloaded_bytes: 0,
      status: 'queued',
      checksum: expectedChecksum,
      created_at: new Date().toISOString(),
    };
  },

  executeDownloadedInstaller: async (
    filePath: string,
    userConfirmed: boolean
  ): Promise<number> => {
    if (isTauriEnvironment()) {
      return await invoke<number>('execute_downloaded_installer', {
        filePath,
        userConfirmed,
      });
    }
    console.log(`[Browser Sim] Installer execution confirmed: ${userConfirmed}`);
    return 9999;
  },

  generateOAuthPkce: async (): Promise<PkceSessionDto> => {
    if (isTauriEnvironment()) {
      return await invoke<PkceSessionDto>('generate_oauth_pkce');
    }
    return {
      code_verifier: 'simulated_pkce_verifier_string_abcdef123456',
      code_challenge: 'simulated_pkce_challenge_abcdef123456',
      state: 'simulated-state-uuid',
    };
  },
};
