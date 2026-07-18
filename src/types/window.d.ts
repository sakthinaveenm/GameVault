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
      
      // Profile & Settings
      getProfile: () => Promise<Profile>;
      updateProfile: (name: string, avatarPath: string | null) => Promise<void>;
      updateSettings: (theme: string, accentColor: string, startInFullscreen: boolean) => Promise<void>;
      toggleSandboxMode: (enabled: boolean) => Promise<void>;

      // Game Launcher & Metadata
      launchGame: (gameId: number) => Promise<void>;
      updateGameMetadata: (gameId: number, metadata: Partial<Game>) => Promise<void>;
      syncPlatforms: () => Promise<{ imported: number }>;

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
};

export type Profile = {
  id: number;
  displayName: string;
  avatarPath: string | null;
  theme: string;
  accentColor: string;
  startInFullscreen: boolean;
};

export type Collection = { id: number; name: string; gameCount: number };
export type LibraryState = { games: Game[]; collections: Collection[] };
