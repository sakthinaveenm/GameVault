import { dialog, ipcMain, app } from "electron";
import path from "node:path";
import type { Database } from "../database/database.js";
import { scanForGames } from "../services/game-scanner.js";
import { launchGame } from "../launcher/launcher.js";
import { scanSteamGames, scanEpicGames, scanGogGames, getMockPlatformGames, fetchFullMetadataForGame } from "../services/platform-scanner.js";

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
  ipcMain.handle("library:add-game", (_event, title: unknown, executablePath: unknown, platform: unknown, metadata: unknown) => {
    if (typeof title !== "string" || typeof executablePath !== "string") throw new Error("Invalid request.");
    return database.addGame(title, executablePath, typeof platform === "string" ? platform : "local", (metadata && typeof metadata === "object") ? metadata : {});
  });
  ipcMain.handle("library:delete-game", (_event, gameId: unknown) => {
    if (typeof gameId !== "number") throw new Error("Invalid request.");
    database.deleteGame(gameId);
  });
  ipcMain.handle("library:set-hidden", (_event, gameId: unknown, isHidden: unknown) => {
    if (typeof gameId !== "number" || typeof isHidden !== "boolean") throw new Error("Invalid request.");
    database.setGameHidden(gameId, isHidden);
  });
  ipcMain.handle("library:set-collection-favorite", (_event, collectionId: unknown, isFavorite: unknown) => {
    if (typeof collectionId !== "number" || typeof isFavorite !== "boolean") throw new Error("Invalid request.");
    database.setCollectionFavorite(collectionId, isFavorite);
  });
  ipcMain.handle("library:get-launch-history", (_event, gameId: unknown) => {
    if (typeof gameId !== "number") throw new Error("Invalid request.");
    return database.getLaunchHistory(gameId);
  });
  ipcMain.handle("library:update-collection-rules", (_event, collectionId: unknown, rules: unknown) => {
    if (typeof collectionId !== "number" || (rules !== null && typeof rules !== "string")) throw new Error("Invalid request.");
    database.updateCollectionRules(collectionId, rules);
  });
  ipcMain.handle("library:add-game-to-collection", (_event, collectionId: unknown, gameId: unknown) => {
    if (typeof collectionId !== "number" || typeof gameId !== "number") throw new Error("Invalid request.");
    database.addGameToCollection(collectionId, gameId);
  });
  ipcMain.handle("library:remove-game-from-collection", (_event, collectionId: unknown, gameId: unknown) => {
    if (typeof collectionId !== "number" || typeof gameId !== "number") throw new Error("Invalid request.");
    database.removeGameFromCollection(collectionId, gameId);
  });
  ipcMain.handle("library:get-collection-games", (_event, collectionId: unknown) => {
    if (typeof collectionId !== "number") throw new Error("Invalid request.");
    return database.getCollectionGames(collectionId);
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

  ipcMain.handle("profile:update-settings", (
    _event,
    theme: unknown,
    accentColor: unknown,
    startInFullscreen: unknown,
    libraryDirectory: unknown,
    steamDirectory: unknown,
    customBgPrimary: unknown,
    customBgSecondary: unknown,
    customTextPrimary: unknown,
    customAccent: unknown
  ) => {
    if (
      typeof theme !== "string" ||
      typeof accentColor !== "string" ||
      typeof startInFullscreen !== "boolean" ||
      (libraryDirectory !== null && typeof libraryDirectory !== "string") ||
      (steamDirectory !== null && typeof steamDirectory !== "string") ||
      (customBgPrimary !== undefined && typeof customBgPrimary !== "string") ||
      (customBgSecondary !== undefined && typeof customBgSecondary !== "string") ||
      (customTextPrimary !== undefined && typeof customTextPrimary !== "string") ||
      (customAccent !== undefined && typeof customAccent !== "string")
    ) {
      throw new Error("Invalid request.");
    }
    database.updateSettings(
      theme,
      accentColor,
      startInFullscreen,
      libraryDirectory,
      steamDirectory,
      customBgPrimary,
      customBgSecondary,
      customTextPrimary,
      customAccent
    );
  });

  // Launch Game Handler
  ipcMain.handle("library:launch-game", (_event, gameId: unknown) => {
    if (typeof gameId !== "number") throw new Error("Invalid request.");
    launchGame(database, gameId);
  });

  // Directory Selection Dialog and Scanner
  ipcMain.handle("library:select-directory", async () => {
    const selection = await dialog.showOpenDialog({
      title: "Select Game Library Folder",
      buttonLabel: "Select Folder",
      properties: ["openDirectory"],
    });
    if (selection.canceled || selection.filePaths.length === 0) return null;
    return selection.filePaths[0];
  });

  ipcMain.handle("library:scan-configured", async (_event, directory: unknown) => {
    if (typeof directory !== "string") throw new Error("Invalid request.");
    const games = await scanForGames(directory);
    return { count: database.importGames(games) };
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
    const profile = database.getProfile();
    const steamGames = await scanSteamGames(profile.steamDirectory);
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

  // Background metadata search
  ipcMain.handle("library:trigger-background-metadata", async () => {
    // Run asynchronously
    (async () => {
      try {
        const games = database.getGames();
        for (const game of games) {
          if (!game.description || !game.coverPath || !game.developer) {
            const meta = await fetchFullMetadataForGame(game.title);
            if (meta) {
              database.updateGameMetadata(game.id, {
                description: game.description || meta.description || null,
                coverPath: game.coverPath || meta.coverPath || null,
                developer: game.developer || meta.developer || null,
                publisher: game.publisher || meta.publisher || null,
                genres: game.genres || meta.genres || null,
                releaseDate: game.releaseDate || meta.releaseDate || null,
              });
            }
          }
        }
      } catch (err) {
        console.error("Background metadata sync error:", err);
      }
    })();
  });

  ipcMain.handle("library:trigger-single-game-metadata", async (_event, gameId: unknown, title: unknown) => {
    if (typeof gameId !== "number" || typeof title !== "string") throw new Error("Invalid request.");
    try {
      const meta = await fetchFullMetadataForGame(title);
      if (meta) {
        database.updateGameMetadata(gameId, {
          description: meta.description || null,
          coverPath: meta.coverPath || null,
          developer: meta.developer || null,
          publisher: meta.publisher || null,
          genres: meta.genres || null,
          releaseDate: meta.releaseDate || null,
        });
        return true;
      }
    } catch (err) {
      console.error("Single game metadata sync error:", err);
    }
    return false;
  });

  // Backups and Export Settings
  ipcMain.handle("backup:export-settings", async () => {
    const selection = await dialog.showSaveDialog({
      title: "Export Profile & Settings",
      defaultPath: "gamevault-settings.json",
      filters: [{ name: "JSON Files", extensions: ["json"] }]
    });
    if (selection.canceled || !selection.filePath) return false;
    try {
      const profile = database.getProfile();
      const collections = database.getCollections();
      const data = JSON.stringify({ profile, collections }, null, 2);
      const fs = await import("node:fs/promises");
      await fs.writeFile(selection.filePath, data, "utf-8");
      return true;
    } catch (err) {
      console.error("Failed to export settings:", err);
      return false;
    }
  });

  ipcMain.handle("backup:import-settings", async () => {
    const selection = await dialog.showOpenDialog({
      title: "Import Profile & Settings",
      properties: ["openFile"],
      filters: [{ name: "JSON Files", extensions: ["json"] }]
    });
    if (selection.canceled || selection.filePaths.length === 0) return false;
    try {
      const fs = await import("node:fs/promises");
      const content = await fs.readFile(selection.filePaths[0], "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.profile) {
        database.updateProfile(parsed.profile.displayName, parsed.profile.avatarPath);
        database.updateSettings(
          parsed.profile.theme,
          parsed.profile.accentColor,
          parsed.profile.startInFullscreen === 1 || parsed.profile.startInFullscreen === true,
          parsed.profile.libraryDirectory || null,
          parsed.profile.steamDirectory || null,
          parsed.profile.customBgPrimary || undefined,
          parsed.profile.customBgSecondary || undefined,
          parsed.profile.customTextPrimary || undefined,
          parsed.profile.customAccent || undefined
        );
      }
      if (Array.isArray(parsed.collections)) {
        for (const col of parsed.collections) {
          try {
            database.createCollection(col.name);
          } catch {}
        }
      }
      return true;
    } catch (err) {
      console.error("Failed to import settings:", err);
      return false;
    }
  });

  ipcMain.handle("backup:create-db-backup", async () => {
    const selection = await dialog.showSaveDialog({
      title: "Backup Database",
      defaultPath: "gamevault.db",
      filters: [{ name: "Database Files", extensions: ["db"] }]
    });
    if (selection.canceled || !selection.filePath) return false;
    try {
      const dbPath = path.join(app.getPath("userData"), "gamevault.db");
      const fs = await import("node:fs/promises");
      await fs.copyFile(dbPath, selection.filePath);
      return true;
    } catch (err) {
      console.error("Database backup failed:", err);
      return false;
    }
  });

  ipcMain.handle("backup:restore-db-backup", async () => {
    const selection = await dialog.showOpenDialog({
      title: "Restore Database Backup",
      properties: ["openFile"],
      filters: [{ name: "Database Files", extensions: ["db"] }]
    });
    if (selection.canceled || selection.filePaths.length === 0) return false;
    try {
      const dbPath = path.join(app.getPath("userData"), "gamevault.db");
      const fs = await import("node:fs/promises");
      database.close();
      await fs.copyFile(selection.filePaths[0], dbPath);
      app.relaunch();
      app.exit(0);
      return true;
    } catch (err) {
      console.error("Database restore failed:", err);
      return false;
    }
  });
}
