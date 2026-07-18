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
      chooseAndImportGames: () => Promise<{ canceled: boolean; imported: number }>;
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
