import { dialog, ipcMain } from "electron";
import type { Database } from "../database/database.js";
import { scanForGames } from "../services/game-scanner.js";

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
}
