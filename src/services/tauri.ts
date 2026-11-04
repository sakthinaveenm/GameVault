import { invoke } from '@tauri-apps/api/core';
import { UserProfile, ControllerInfo, Game } from '@/types';

export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export interface ScannedCandidateDto {
  title: string;
  executable_path: string;
  platform: string;
  file_size_bytes: number;
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
};
