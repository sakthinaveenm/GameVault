import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import {
  UserProfile,
  ControllerInfo,
  Game,
  Emulator,
  SaveSnapshot,
  CreateProfileInput,
  UpdateProfileInput,
  AuthVerificationResult,
  StartupDiagnostics,
  CloudProfileSummary,
  TorrentTask,
} from '@/types';

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

export interface TorrentTaskDto {
  id: string;
  info_hash: string;
  name: string;
  magnet_uri: string;
  save_path: string;
  total_bytes: number;
  downloaded_bytes: number;
  uploaded_bytes: number;
  download_speed: number;
  upload_speed: number;
  progress: number;
  peers: number;
  seeds: number;
  state: 'queued' | 'connecting' | 'downloading' | 'seeding' | 'paused' | 'completed' | 'error';
  trackers_json?: string;
  created_at: string;
  updated_at: string;
}

export function mapTorrentTask(dto: TorrentTaskDto): TorrentTask {
  return {
    id: dto.id,
    infoHash: dto.info_hash,
    name: dto.name,
    magnetUri: dto.magnet_uri,
    savePath: dto.save_path,
    totalBytes: dto.total_bytes,
    downloadedBytes: dto.downloaded_bytes,
    uploadedBytes: dto.uploaded_bytes,
    downloadSpeed: dto.download_speed,
    uploadSpeed: dto.upload_speed,
    progress: dto.progress,
    peers: dto.peers,
    seeds: dto.seeds,
    state: dto.state,
    trackersJson: dto.trackers_json,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
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

  initStartupDiagnostics: async (): Promise<StartupDiagnostics> => {
    if (isTauriEnvironment()) {
      return await invoke<StartupDiagnostics>('init_startup_diagnostics');
    }
    return {
      configReady: true,
      databaseReady: true,
      profilesCount: 1,
      defaultProfileId: 'default-profile-uuid',
      connectedControllersCount: 0,
      appVersion: '0.1.2',
      appDataDir: './data',
    };
  },

  verifyProfileCredentials: async (
    profileId: string,
    secret: string
  ): Promise<AuthVerificationResult> => {
    if (isTauriEnvironment()) {
      return await invoke<AuthVerificationResult>('verify_profile_credentials', {
        profileId,
        secret,
      });
    }
    const ok = secret === '1234' || secret.length >= 4;
    return {
      success: ok,
      remainingAttempts: ok ? 5 : 3,
      lockedOut: false,
      message: ok ? undefined : 'Incorrect credentials.',
    };
  },

  createFullProfile: async (
    input: CreateProfileInput
  ): Promise<UserProfile> => {
    if (isTauriEnvironment()) {
      return await invoke<UserProfile>('create_full_profile', { input });
    }
    return {
      id: `prof-${Date.now()}`,
      displayName: input.displayName,
      avatarPath: input.avatarPath,
      isDefault: false,
      authenticationEnabled: input.authType !== 'none',
      authType: (input.authType || 'none') as 'none' | 'pin' | 'password',
      themePreference: input.themePreference || 'dark',
      preferredController: input.preferredController,
      syncProfileId: `sync-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  updateUserProfile: async (
    input: UpdateProfileInput
  ): Promise<UserProfile> => {
    if (isTauriEnvironment()) {
      return await invoke<UserProfile>('update_user_profile', { input });
    }
    return {
      id: input.id,
      displayName: input.displayName || 'Player',
      avatarPath: input.avatarPath,
      isDefault: false,
      authenticationEnabled: !input.removeAuth,
      authType: (input.authType || 'none') as 'none' | 'pin' | 'password',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  setDefaultProfile: async (id: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('set_default_profile', { id });
    }
  },

  linkGoogleAccount: async (
    profileId: string,
    googleAccountId: string,
    googleEmail: string
  ): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('link_google_account', {
        profileId,
        googleAccountId,
        googleEmail,
      });
    }
  },

  unlinkGoogleAccount: async (profileId: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('unlink_google_account', { profileId });
    }
  },

  listCloudProfiles: async (googleEmail: string): Promise<CloudProfileSummary[]> => {
    if (isTauriEnvironment()) {
      return await invoke<CloudProfileSummary[]>('list_cloud_profiles', {
        googleEmail,
      });
    }
    return [
      {
        syncProfileId: 'sync-browser-profile-1',
        displayName: `${googleEmail.split('@')[0]} (Cloud Profile)`,
        avatarPath: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
        lastSyncedAt: new Date().toISOString(),
        gameCount: 6,
        backupSizeBytes: 32_450_000,
        deviceName: 'Cloud Gaming Node',
      },
    ];
  },

  recoverCloudProfile: async (
    cloudProfileId: string,
    localDisplayName: string,
    googleEmail: string
  ): Promise<UserProfile> => {
    if (isTauriEnvironment()) {
      return await invoke<UserProfile>('recover_cloud_profile', {
        cloudProfileId,
        localDisplayName,
        googleEmail,
      });
    }
    return {
      id: `prof-${Date.now()}`,
      displayName: localDisplayName,
      avatarPath: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      isDefault: true,
      linkedGoogleEmail: googleEmail,
      syncProfileId: cloudProfileId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  exitApplication: async (): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('exit_application');
    } else {
      console.log('[Browser Mode] Exit application simulated.');
    }
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

  addTorrentTask: async (
    magnetUri: string,
    customName?: string,
    savePath?: string,
    totalBytes?: number
  ): Promise<TorrentTask> => {
    if (isTauriEnvironment()) {
      const dto = await invoke<TorrentTaskDto>('add_torrent_task', {
        magnetUri,
        customName: customName || null,
        savePath: savePath || null,
        totalBytes: totalBytes || null,
      });
      return mapTorrentTask(dto);
    }
    const safeName = customName || 'Torrent Download';
    return {
      id: `sim-torrent-${Date.now()}`,
      infoHash: '5ea0f2bb95a2f71f1f7b433045bcb43d3ef7cd4b',
      name: safeName,
      magnetUri,
      savePath: `~/Downloads/UniversalGameHub/Torrents/${safeName}`,
      totalBytes: totalBytes || 21474836480,
      downloadedBytes: 104857600,
      uploadedBytes: 20971520,
      downloadSpeed: 15728640,
      uploadSpeed: 1048576,
      progress: 0.5,
      peers: 28,
      seeds: 64,
      state: 'downloading',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  listTorrentTasks: async (): Promise<TorrentTask[]> => {
    if (isTauriEnvironment()) {
      const list = await invoke<TorrentTaskDto[]>('list_torrent_tasks');
      return list.map(mapTorrentTask);
    }
    return [];
  },

  pauseTorrentTask: async (id: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('pause_torrent_task', { id });
    }
  },

  resumeTorrentTask: async (id: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('resume_torrent_task', { id });
    }
  },

  deleteTorrentTask: async (id: string, deleteFiles: boolean): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('delete_torrent_task', { id, deleteFiles });
    }
  },

  updateTorrentTaskProgress: async (
    id: string,
    downloadedBytes: number,
    totalBytes: number,
    downloadSpeed: number,
    uploadSpeed: number,
    seeds: number,
    peers: number
  ): Promise<TorrentTask> => {
    if (isTauriEnvironment()) {
      const dto = await invoke<TorrentTaskDto>('update_torrent_task_progress', {
        id,
        downloadedBytes,
        totalBytes,
        downloadSpeed,
        uploadSpeed,
        seeds,
        peers,
      });
      return mapTorrentTask(dto);
    }
    return {
      id,
      infoHash: 'simulated_hash',
      name: 'Simulated Update',
      magnetUri: '',
      savePath: '',
      totalBytes,
      downloadedBytes,
      uploadedBytes: 0,
      downloadSpeed,
      uploadSpeed,
      progress: (downloadedBytes / totalBytes) * 100,
      peers,
      seeds,
      state: downloadedBytes >= totalBytes ? 'completed' : 'downloading',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  openInExternalTorrentClient: async (magnetUri: string): Promise<void> => {
    const trimmed = magnetUri.trim();
    if (!trimmed) return;

    if (isTauriEnvironment()) {
      try {
        await openUrl(trimmed);
        return;
      } catch (err) {
        console.warn('plugin-opener openUrl failed, attempting direct command invoke:', err);
      }
      try {
        await invoke('open_in_external_torrent_client', { magnetUri: trimmed });
        return;
      } catch (err) {
        console.warn('invoke open_in_external_torrent_client failed:', err);
      }
    }

    // Browser / WebView standard protocol handler dispatch
    try {
      const link = document.createElement('a');
      link.href = trimmed;
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = trimmed;
    }
  },

  openTorrentFolder: async (path: string): Promise<void> => {
    if (isTauriEnvironment()) {
      await invoke('open_torrent_folder', { path });
    }
  },
};
