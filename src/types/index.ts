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
  authenticationEnabled?: boolean;
  authType?: 'none' | 'pin' | 'password';
  themePreference?: string;
  preferredController?: string;
  syncProfileId?: string;
  linkedGoogleEmail?: string;
  lastPlayedGame?: string;
  lastPlayedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProfileInput {
  displayName: string;
  avatarPath?: string;
  authType?: 'none' | 'pin' | 'password';
  pin?: string;
  password?: string;
  themePreference?: string;
  preferredController?: string;
}

export interface UpdateProfileInput {
  id: string;
  displayName?: string;
  avatarPath?: string;
  authType?: string;
  newPin?: string;
  newPassword?: string;
  removeAuth?: boolean;
  themePreference?: string;
  preferredController?: string;
}

export interface AuthVerificationResult {
  success: boolean;
  remainingAttempts: number;
  lockedOut: boolean;
  message?: string;
}

export interface StartupDiagnostics {
  configReady: boolean;
  databaseReady: boolean;
  profilesCount: number;
  defaultProfileId?: string;
  connectedControllersCount: number;
  appVersion: string;
  appDataDir: string;
}

export interface CloudProfileSummary {
  syncProfileId: string;
  displayName: string;
  avatarPath?: string;
  lastSyncedAt: string;
  gameCount: number;
  backupSizeBytes: number;
  deviceName: string;
}

export type StartupState =
  | 'Initializing'
  | 'DatabaseReady'
  | 'LoadingProfiles'
  | 'ProfileSelection'
  | 'CreatingProfile'
  | 'AuthenticatingProfile'
  | 'LoadingProfile'
  | 'DashboardReady'
  | 'RecoveringProfile'
  | 'Error';

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

export interface TorrentTask {
  id: string;
  infoHash: string;
  name: string;
  magnetUri: string;
  savePath: string;
  totalBytes: number;
  downloadedBytes: number;
  uploadedBytes: number;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  peers: number;
  seeds: number;
  state: 'queued' | 'connecting' | 'downloading' | 'seeding' | 'paused' | 'completed' | 'error';
  trackersJson?: string;
  createdAt: string;
  updatedAt: string;
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
