import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("gameVault", {
  getAppInfo: () => ipcRenderer.invoke("app:get-info"),
});
