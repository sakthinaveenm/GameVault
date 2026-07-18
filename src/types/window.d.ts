export {};

declare global {
  interface Window {
    gameVault: {
      getAppInfo: () => Promise<{
        name: string;
        version: string;
        databaseReady: boolean;
      }>;
    };
  }
}
