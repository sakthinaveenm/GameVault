import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gameVault", {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getGames: () => ipcRenderer.invoke("library:get-games"),
  getLibraryState: () => ipcRenderer.invoke("library:get-state"),
  chooseAndImportGames: () => ipcRenderer.invoke("library:choose-and-import"),
  setGameFavorite: (gameId: number, isFavorite: boolean) => ipcRenderer.invoke("library:set-favorite", gameId, isFavorite),
  createCollection: (name: string) => ipcRenderer.invoke("library:create-collection", name),
  
  // Profile & Settings
  getProfile: () => ipcRenderer.invoke("profile:get"),
  updateProfile: (name: string, avatarPath: string | null) => ipcRenderer.invoke("profile:update", name, avatarPath),
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
  ) => ipcRenderer.invoke(
    "profile:update-settings",
    theme,
    accentColor,
    startInFullscreen,
    libraryDirectory,
    steamDirectory,
    customBgPrimary,
    customBgSecondary,
    customTextPrimary,
    customAccent
  ),
  toggleSandboxMode: (enabled: boolean) => ipcRenderer.invoke("profile:toggle-sandbox", enabled),

  // Game Launcher & Metadata
  launchGame: (gameId: number) => ipcRenderer.invoke("library:launch-game", gameId),
  updateGameMetadata: (gameId: number, metadata: any) => ipcRenderer.invoke("library:update-metadata", gameId, metadata),
  syncPlatforms: () => ipcRenderer.invoke("library:sync-platforms"),
  selectDirectory: () => ipcRenderer.invoke("library:select-directory"),
  scanConfiguredDirectory: (directory: string) => ipcRenderer.invoke("library:scan-configured", directory),

  // Events
  onGameStatus: (callback: (data: { gameId: number; status: "started" | "stopped" | "error"; sessionDuration?: number }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on("library:game-status", listener);
    return () => {
      ipcRenderer.removeListener("library:game-status", listener);
    };
  },
});
