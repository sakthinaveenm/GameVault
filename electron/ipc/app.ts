import { dialog, ipcMain, app } from "electron";
import path from "node:path";
import { readdir } from "node:fs/promises";
import type { Database } from "../database/database.js";
import { scanForGames } from "../services/game-scanner.js";
import { launchGame } from "../launcher/launcher.js";
import {
  scanSteamGames,
  scanEpicGames,
  scanGogGames,
  getMockPlatformGames,
  fetchFullMetadataForGame,
  scanUbisoftGames,
  scanEaGames,
  scanXboxGames,
  scanBattlenetGames,
  scanAmazonGames,
  scanItchioGames
} from "../services/platform-scanner.js";

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
    const ubiGames = await scanUbisoftGames();
    const eaGames = await scanEaGames();
    const xboxGames = await scanXboxGames();
    const bnetGames = await scanBattlenetGames();
    const amzGames = await scanAmazonGames();
    const itchGames = await scanItchioGames();

    const allGames = [
      ...steamGames,
      ...epicGames,
      ...gogGames,
      ...ubiGames,
      ...eaGames,
      ...xboxGames,
      ...bnetGames,
      ...amzGames,
      ...itchGames
    ];
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

  // Emulators & ROMs Handlers
  ipcMain.handle("emulators:get", () => {
    return database.getEmulators();
  });

  ipcMain.handle("emulators:add", (_event, name: unknown, executablePath: unknown, platform: unknown, defaultArguments: unknown) => {
    if (typeof name !== "string" || typeof executablePath !== "string" || typeof platform !== "string" || typeof defaultArguments !== "string") {
      throw new Error("Invalid emulator details.");
    }
    return database.addEmulator(name, executablePath, platform, defaultArguments);
  });

  ipcMain.handle("emulators:delete", (_event, id: unknown) => {
    if (typeof id !== "number") throw new Error("Invalid emulator ID.");
    database.deleteEmulator(id);
    return true;
  });

  ipcMain.handle("emulators:scan-roms", async (_event, emulatorId: unknown, folderPath: unknown, extensions: unknown) => {
    if (typeof emulatorId !== "number" || typeof folderPath !== "string" || typeof extensions !== "string") {
      throw new Error("Invalid scan parameters.");
    }
    const extList = extensions.split(",").map((x) => x.trim().toLowerCase());
    const discovered = await scanForRoms(folderPath, extList);

    let count = 0;
    for (const rom of discovered) {
      const exists = database.getGames().some((g) => g.executablePath === rom.path && g.platform === "emulator");
      if (!exists) {
        database.addGame(rom.title, rom.path, "emulator", { platformGameId: String(emulatorId) });
        count++;
      }
    }
    return { count };
  });

  ipcMain.handle("achievements:get", (_event, gameId: unknown) => {
    return database.getAchievements(gameId !== undefined ? Number(gameId) : undefined);
  });

  ipcMain.handle("achievements:toggle-showcase", (_event, achievementId: unknown, showcased: unknown) => {
    if (typeof achievementId !== "number" || typeof showcased !== "boolean") throw new Error("Invalid request.");
    database.setAchievementShowcased(achievementId, showcased);
    return true;
  });

  ipcMain.handle("games:toggle-showcase", (_event, gameId: unknown, showcased: unknown) => {
    if (typeof gameId !== "number" || typeof showcased !== "boolean") throw new Error("Invalid request.");
    database.setGameShowcased(gameId, showcased);
    return true;
  });

  ipcMain.handle("games:toggle-completed", (_event, gameId: unknown, completed: unknown) => {
    if (typeof gameId !== "number" || typeof completed !== "boolean") throw new Error("Invalid request.");
    database.setGameCompleted(gameId, completed);
    return true;
  });

  ipcMain.handle("library:get-timeline", () => {
    return database.getLaunchTimeline();
  });

  ipcMain.handle("plugins:get", () => {
    return database.getInstalledPlugins();
  });

  ipcMain.handle("plugins:install", (_event, id: unknown, name: unknown, description: unknown, author: unknown, version: unknown, type: unknown, config: unknown, code: unknown) => {
    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof description !== "string" ||
      typeof author !== "string" ||
      typeof version !== "string" ||
      typeof type !== "string" ||
      typeof config !== "string" ||
      typeof code !== "string"
    ) {
      throw new Error("Invalid request.");
    }
    database.installPlugin(id, name, description, author, version, type, config, code);
    return true;
  });

  ipcMain.handle("plugins:uninstall", (_event, id: unknown) => {
    if (typeof id !== "string") throw new Error("Invalid request.");
    database.uninstallPlugin(id);
    return true;
  });

  ipcMain.handle("plugins:toggle", (_event, id: unknown, enabled: unknown) => {
    if (typeof id !== "string" || typeof enabled !== "boolean") throw new Error("Invalid request.");
    database.setPluginEnabled(id, enabled);
    return true;
  });

  ipcMain.handle("plugins:configure", (_event, id: unknown, config: unknown) => {
    if (typeof id !== "string" || typeof config !== "string") throw new Error("Invalid request.");
    database.updatePluginConfig(id, config);
    return true;
  });
}

async function scanForRoms(directory: string, extensionsList: string[]): Promise<Array<{ title: string; path: string }>> {
  const roms: Array<{ title: string; path: string }> = [];
  
  async function walk(dir: string) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensionsList.includes(ext)) {
            const title = path.basename(entry.name, ext).replace(/[._-]+/g, " ").trim();
            roms.push({ title, path: fullPath });
          }
        }
      }
    } catch (err) {
      console.error(`Error scanning rom directory ${dir}:`, err);
    }
  }

  await walk(directory);
  return roms;
}
