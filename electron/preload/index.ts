import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gameVault", {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getGames: () => ipcRenderer.invoke("library:get-games"),
  getLibraryState: () => ipcRenderer.invoke("library:get-state"),
  chooseAndImportGames: () => ipcRenderer.invoke("library:choose-and-import"),
  setGameFavorite: (gameId: number, isFavorite: boolean) => ipcRenderer.invoke("library:set-favorite", gameId, isFavorite),
  createCollection: (name: string) => ipcRenderer.invoke("library:create-collection", name),
});
