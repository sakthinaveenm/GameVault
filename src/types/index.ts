export type GameSource = 'steam' | 'epic' | 'gog' | 'local' | 'retro' | 'batocera';

export type PlatformType =
  | 'windows'
  | 'macos'
  | 'linux'
  | 'snes'
  | 'nes'
  | 'genesis'
  | 'ps1'
  | 'ps2'
  | 'ps3'
  | 'psp'
  | 'gamecube'
  | 'wii'
  | 'n64'
  | 'arcade'
  | 'other';

export interface Game {
  id: string;
  title: string;
  sortTitle?: string;
  summary?: string;
  developer?: string;
  publisher?: string;
  releaseDate?: string;
  source: GameSource;
  platform: PlatformType;
  storeId?: string;
  executablePath?: string;
  launchArguments?: string;
  workingDirectory?: string;
  coverUrl?: string;
  bannerUrl?: string;
  iconUrl?: string;
  installed: boolean;
  isFavorite?: boolean;
  playtimeMinutes?: number;
  lastPlayedAt?: string;
  customCategory?: string;
  rating?: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarPath?: string;
  isDefault: boolean;
  linkedGoogleEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Emulator {
  id: string;
  name: string;
  executablePath: string;
  systemId: string;
  supportedExtensions: string[];
  defaultArguments?: string;
  detected: boolean;
}

export interface SaveSnapshot {
  id: string;
  profileId: string;
  gameId: string;
  deviceId: string;
  snapshotHash: string;
  archivePath: string;
  compressedSize: number;
  cloudStatus: 'local_only' | 'synced' | 'pending_upload' | 'conflict';
  createdAt: string;
  fileCount?: number;
}

export interface SyncConflict {
  id: string;
  profileId: string;
  gameId: string;
  gameTitle: string;
  localSnapshot: {
    id: string;
    deviceId: string;
    timestamp: string;
    sizeBytes: number;
    fileCount: number;
  };
  cloudSnapshot: {
    id: string;
    deviceId: string;
    timestamp: string;
    sizeBytes: number;
    fileCount: number;
  };
  status: 'pending' | 'resolved';
}

export interface DownloadItem {
  id: string;
  title: string;
  sourceUrl: string;
  destinationPath: string;
  totalBytes: number;
  downloadedBytes: number;
  speedBytesPerSec: number;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
  checksum?: string;
  error?: string;
}

export interface ControllerInfo {
  index: number;
  id: string;
  connected: boolean;
  type: 'xbox' | 'playstation' | 'nintendo' | 'generic';
}

export type NavigationTab =
  | 'home'
  | 'store'
  | 'library'
  | 'retro'
  | 'emulators'
  | 'batocera'
  | 'saves'
  | 'cloud'
  | 'profiles'
  | 'statistics'
  | 'controllers'
  | 'downloads'
  | 'settings';
