export {};

declare global {
  interface Window {
    gameVault: {
      getAppInfo: () => Promise<{
        name: string;
        version: string;
        databaseReady: boolean;
      }>;
      getGames: () => Promise<Game[]>;
      getLibraryState: () => Promise<LibraryState>;
      chooseAndImportGames: () => Promise<{ canceled: boolean; imported: number }>;
      setGameFavorite: (gameId: number, isFavorite: boolean) => Promise<void>;
      createCollection: (name: string) => Promise<Collection>;
      addGame: (title: string, executablePath: string, platform?: string, metadata?: any) => Promise<number>;
      deleteGame: (gameId: number) => Promise<void>;
      setGameHidden: (gameId: number, isHidden: boolean) => Promise<void>;
      setCollectionFavorite: (collectionId: number, isFavorite: boolean) => Promise<void>;
      getLaunchHistory: (gameId: number) => Promise<Array<{ id: number; gameId: number; launchedAt: string; durationSeconds: number }>>;
      updateCollectionRules: (collectionId: number, rules: string | null) => Promise<void>;
      addGameToCollection: (collectionId: number, gameId: number) => Promise<void>;
      removeGameFromCollection: (collectionId: number, gameId: number) => Promise<void>;
      getCollectionGames: (collectionId: number) => Promise<number[]>;
      triggerBackgroundMetadata: () => Promise<void>;
      triggerSingleGameMetadata: (gameId: number, title: string) => Promise<boolean>;
      exportSettings: () => Promise<boolean>;
      importSettings: () => Promise<boolean>;
      createDbBackup: () => Promise<boolean>;
      restoreDbBackup: () => Promise<boolean>;
      
      // Profile & Settings
      getProfile: () => Promise<Profile>;
      updateProfile: (name: string, avatarPath: string | null) => Promise<void>;
      updateSettings: (
        theme: string,
        accentColor: string,
        startInFullscreen: boolean,
        libraryDirectory: string | null,
        steamDirectory: string | null,
        customBgPrimary?: string,
        customBgSecondary?: string,
        customTextPrimary?: string,
        customAccent?: string
      ) => Promise<void>;
      toggleSandboxMode: (enabled: boolean) => Promise<void>;

      // Game Launcher & Metadata
      launchGame: (gameId: number) => Promise<void>;
      updateGameMetadata: (gameId: number, metadata: Partial<Game>) => Promise<void>;
      syncPlatforms: () => Promise<{ imported: number }>;
      selectDirectory: () => Promise<string | null>;
      scanConfiguredDirectory: (directory: string) => Promise<{ count: number }>;

      // Emulators & ROMs
      getEmulators: () => Promise<Emulator[]>;
      addEmulator: (name: string, executablePath: string, platform: string, defaultArguments: string) => Promise<number>;
      deleteEmulator: (id: number) => Promise<void>;
      scanRoms: (emulatorId: number, folderPath: string, extensions: string) => Promise<{ count: number }>;

      // Achievements & Showcases
      getAchievements: (gameId?: number) => Promise<Achievement[]>;
      toggleAchievementShowcase: (achievementId: number, showcased: boolean) => Promise<void>;
      toggleGameShowcase: (gameId: number, showcased: boolean) => Promise<void>;
      toggleGameCompleted: (gameId: number, completed: boolean) => Promise<void>;
      getLaunchTimeline: () => Promise<Array<{ id: number; gameTitle: string; platform: string; coverPath: string | null; launchedAt: string; durationSeconds: number }>>;

      // Plugins & Extensions
      getInstalledPlugins: () => Promise<GameVaultPlugin[]>;
      installPlugin: (id: string, name: string, description: string, author: string, version: string, type: string, config: string, code: string) => Promise<void>;
      uninstallPlugin: (id: string) => Promise<void>;
      setPluginEnabled: (id: string, enabled: boolean) => Promise<void>;
      updatePluginConfig: (id: string, config: string) => Promise<void>;

      // Events
      onGameStatus: (callback: (data: { gameId: number; status: "started" | "stopped" | "error"; sessionDuration?: number }) => void) => () => void;
    };
  }
}

export type Game = {
  id: number;
  title: string;
  executablePath: string;
  installedAt: string;
  lastPlayedAt: string | null;
  playtimeSeconds: number;
  isFavorite: boolean;
  description?: string | null;
  coverPath?: string | null;
  developer?: string | null;
  publisher?: string | null;
  genres?: string | null;
  releaseDate?: string | null;
  platform: string;
  platformGameId?: string | null;
  isCompleted: boolean;
  showcased: boolean;
};

export type Profile = {
  id: number;
  displayName: string;
  avatarPath: string | null;
  theme: string;
  accentColor: string;
  startInFullscreen: boolean;
  libraryDirectory?: string | null;
  steamDirectory?: string | null;
  customBgPrimary?: string;
  customBgSecondary?: string;
  customTextPrimary?: string;
  customAccent?: string;
};

export type Collection = { id: number; name: string; gameCount: number; rules?: string | null };
export type LibraryState = { games: Game[]; collections: Collection[] };

export type Emulator = {
  id: number;
  name: string;
  executablePath: string;
  platform: string;
  defaultArguments: string;
};

export type Achievement = {
  id: number;
  gameId: number;
  title: string;
  description: string;
  iconPath: string | null;
  unlocked: boolean;
  unlockedAt: string | null;
  showcased: boolean;
};

export type GameVaultPlugin = {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  type: string;
  enabled: boolean;
  config: string;
  code: string;
};
