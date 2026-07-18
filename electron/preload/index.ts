import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gameVault", {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
  getGames: () => ipcRenderer.invoke("library:get-games"),
  chooseAndImportGames: () => ipcRenderer.invoke("library:choose-and-import"),
});
