import { ipcMain } from "electron";
import type { Database } from "../database/database.js";

export function registerAppIpc(database: Database): void {
  ipcMain.handle("app:get-info", () => ({
    name: "GameVault",
    version: "0.1.0",
    databaseReady: database.isReady(),
  }));
}
