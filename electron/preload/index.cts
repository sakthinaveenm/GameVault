import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gameVault", {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getGames: () => ipcRenderer.invoke("library:get-games"),
  getLibraryState: () => ipcRenderer.invoke("library:get-state"),
  chooseAndImportGames: () => ipcRenderer.invoke("library:choose-and-import"),
  setGameFavorite: (gameId: number, isFavorite: boolean) => ipcRenderer.invoke("library:set-favorite", gameId, isFavorite),
  createCollection: (name: string) => ipcRenderer.invoke("library:create-collection", name),
  addGame: (title: string, executablePath: string, platform?: string, metadata?: any) => ipcRenderer.invoke("library:add-game", title, executablePath, platform, metadata),
  deleteGame: (gameId: number) => ipcRenderer.invoke("library:delete-game", gameId),
  setGameHidden: (gameId: number, isHidden: boolean) => ipcRenderer.invoke("library:set-hidden", gameId, isHidden),
  setCollectionFavorite: (collectionId: number, isFavorite: boolean) => ipcRenderer.invoke("library:set-collection-favorite", collectionId, isFavorite),
  getLaunchHistory: (gameId: number) => ipcRenderer.invoke("library:get-launch-history", gameId),
  updateCollectionRules: (collectionId: number, rules: string | null) => ipcRenderer.invoke("library:update-collection-rules", collectionId, rules),
  addGameToCollection: (collectionId: number, gameId: number) => ipcRenderer.invoke("library:add-game-to-collection", collectionId, gameId),
  removeGameFromCollection: (collectionId: number, gameId: number) => ipcRenderer.invoke("library:remove-game-from-collection", collectionId, gameId),
  getCollectionGames: (collectionId: number) => ipcRenderer.invoke("library:get-collection-games", collectionId),
  triggerBackgroundMetadata: () => ipcRenderer.invoke("library:trigger-background-metadata"),
  triggerSingleGameMetadata: (gameId: number, title: string) => ipcRenderer.invoke("library:trigger-single-game-metadata", gameId, title),
  exportSettings: () => ipcRenderer.invoke("backup:export-settings"),
  importSettings: () => ipcRenderer.invoke("backup:import-settings"),
  createDbBackup: () => ipcRenderer.invoke("backup:create-db-backup"),
  restoreDbBackup: () => ipcRenderer.invoke("backup:restore-db-backup"),
  
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

  // Emulators & ROMs
  getEmulators: () => ipcRenderer.invoke("emulators:get"),
  addEmulator: (name: string, executablePath: string, platform: string, defaultArguments: string) =>
    ipcRenderer.invoke("emulators:add", name, executablePath, platform, defaultArguments),
  deleteEmulator: (id: number) => ipcRenderer.invoke("emulators:delete", id),
  scanRoms: (emulatorId: number, folderPath: string, extensions: string) =>
    ipcRenderer.invoke("emulators:scan-roms", emulatorId, folderPath, extensions),

  // Achievements & Showcases
  getAchievements: (gameId?: number) => ipcRenderer.invoke("achievements:get", gameId),
  toggleAchievementShowcase: (achievementId: number, showcased: boolean) => ipcRenderer.invoke("achievements:toggle-showcase", achievementId, showcased),
  toggleGameShowcase: (gameId: number, showcased: boolean) => ipcRenderer.invoke("games:toggle-showcase", gameId, showcased),
  toggleGameCompleted: (gameId: number, completed: boolean) => ipcRenderer.invoke("games:toggle-completed", gameId, completed),
  getLaunchTimeline: () => ipcRenderer.invoke("library:get-timeline"),

  // Plugins & Extensions
  getInstalledPlugins: () => ipcRenderer.invoke("plugins:get"),
  installPlugin: (id: string, name: string, description: string, author: string, version: string, type: string, config: string, code: string) =>
    ipcRenderer.invoke("plugins:install", id, name, description, author, version, type, config, code),
  uninstallPlugin: (id: string) => ipcRenderer.invoke("plugins:uninstall", id),
  setPluginEnabled: (id: string, enabled: boolean) => ipcRenderer.invoke("plugins:toggle", id, enabled),
  updatePluginConfig: (id: string, config: string) => ipcRenderer.invoke("plugins:configure", id, config),

  // GameVault Hub v2.0
  cloudSync: () => ipcRenderer.invoke("cloud:sync"),
  verifyGameFiles: (gameId: number) => ipcRenderer.invoke("games:verify-files", gameId),
  saveGameScripts: (gameId: number, preLaunch: string | null, postClose: string | null) =>
    ipcRenderer.invoke("games:save-scripts", gameId, preLaunch, postClose),
  updateCloudAccount: (email: string | null, lastSyncAt: string | null) =>
    ipcRenderer.invoke("profile:update-cloud", email, lastSyncAt),

  // GameVault Future Vision v2.1
  aiRecommend: () => ipcRenderer.invoke("ai:recommend"),
  aiEnhanceMetadata: (gameId: number) => ipcRenderer.invoke("ai:enhance-metadata", gameId),
  updatePortableMode: (enabled: boolean) => ipcRenderer.invoke("profile:update-portable", enabled),
  updateDeckMode: (enabled: boolean) => ipcRenderer.invoke("profile:update-deck", enabled),

  // Events
  onGameStatus: (callback: (data: { gameId: number; status: "started" | "stopped" | "error"; sessionDuration?: number }) => void) => {
    const listener = (_event: any, data: any) => callback(data);
    ipcRenderer.on("library:game-status", listener);
    return () => {
      ipcRenderer.removeListener("library:game-status", listener);
    };
  },
});
