import { dialog, ipcMain } from "electron";
import type { Database } from "../database/database.js";
import { scanForGames } from "../services/game-scanner.js";
import { launchGame } from "../launcher/launcher.js";
import { scanSteamGames, scanEpicGames, scanGogGames, getMockPlatformGames } from "../services/platform-scanner.js";

export function registerAppIpc(database: Database): void {
  ipcMain.handle("app:get-info", () => ({
    name: "GameVault",
    version: "0.1.0",
    databaseReady: database.isReady(),
  }));

  ipcMain.handle("library:get-games", () => database.getGames());
  ipcMain.handle("library:get-state", () => ({ games: database.getGames(), collections: database.getCollections() }));
  ipcMain.handle("library:set-favorite", (_event, gameId: unknown, isFavorite: unknown) => {
    if (typeof gameId !== "number" || typeof isFavorite !== "boolean") throw new Error("Invalid request.");
    database.setGameFavorite(gameId, isFavorite);
  });
  ipcMain.handle("library:create-collection", (_event, name: unknown) => {
    if (typeof name !== "string") throw new Error("Invalid request.");
    return database.createCollection(name);
  });

  ipcMain.handle("library:choose-and-import", async () => {
    const selection = await dialog.showOpenDialog({
      title: "Choose a game folder",
      buttonLabel: "Scan folder",
      properties: ["openDirectory"],
    });
    if (selection.canceled || selection.filePaths.length === 0) return { canceled: true, imported: 0 };

    const games = await scanForGames(selection.filePaths[0]);
    return { canceled: false, imported: database.importGames(games) };
  });

  // Profile IPC Handlers
  ipcMain.handle("profile:get", () => {
    return database.getProfile();
  });

  ipcMain.handle("profile:update", (_event, name: unknown, avatarPath: unknown) => {
    if (typeof name !== "string" || (avatarPath !== null && typeof avatarPath !== "string")) {
      throw new Error("Invalid request.");
    }
    database.updateProfile(name, avatarPath);
  });

  ipcMain.handle("profile:update-settings", (_event, theme: unknown, accentColor: unknown, startInFullscreen: unknown) => {
    if (typeof theme !== "string" || typeof accentColor !== "string" || typeof startInFullscreen !== "boolean") {
      throw new Error("Invalid request.");
    }
    database.updateSettings(theme, accentColor, startInFullscreen);
  });

  // Launch Game Handler
  ipcMain.handle("library:launch-game", (_event, gameId: unknown) => {
    if (typeof gameId !== "number") throw new Error("Invalid request.");
    launchGame(database, gameId);
  });

  // Metadata Updates
  ipcMain.handle("library:update-metadata", (_event, gameId: unknown, metadata: unknown) => {
    if (typeof gameId !== "number" || typeof metadata !== "object" || metadata === null) {
      throw new Error("Invalid request.");
    }
    database.updateGameMetadata(gameId, metadata as any);
  });

  // Sync Platforms Handlers
  ipcMain.handle("library:sync-platforms", async () => {
    const steamGames = await scanSteamGames();
    const epicGames = await scanEpicGames();
    const gogGames = await scanGogGames();

    const allGames = [...steamGames, ...epicGames, ...gogGames];
    let imported = 0;
    if (allGames.length > 0) {
      imported = database.importPlatformGames(allGames);
    }
    return { imported };
  });

  // Toggle Sandbox Mode Handler
  ipcMain.handle("profile:toggle-sandbox", (_event, enabled: unknown) => {
    if (typeof enabled !== "boolean") throw new Error("Invalid request.");
    if (enabled) {
      const mockGames = getMockPlatformGames();
      database.importPlatformGames(mockGames);
    } else {
      database.clearPlatformGames();
    }
  });
}
