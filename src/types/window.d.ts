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
    };
  }
}

type Game = {
  id: number;
  title: string;
  executablePath: string;
  installedAt: string;
  lastPlayedAt: string | null;
  playtimeSeconds: number;
  isFavorite: boolean;
};

type Collection = { id: number; name: string; gameCount: number };
type LibraryState = { games: Game[]; collections: Collection[] };
