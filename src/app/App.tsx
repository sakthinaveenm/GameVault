import { useCallback, useEffect, useState } from "react";
import { LibraryPage } from "../pages/LibraryPage";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [library, setLibrary] = useState<LibraryState>({ games: [], collections: [] });
  const [isBigPicture, setIsBigPicture] = useState(false);

  useEffect(() => {
    void Promise.all([window.gameVault.getAppInfo(), window.gameVault.getLibraryState()]).then(([info, state]) => {
      setAppInfo(info);
      setLibrary(state);
    });
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsBigPicture(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const setBigPicture = useCallback(async (enabled: boolean) => {
    if (enabled) await document.documentElement.requestFullscreen();
    else if (document.fullscreenElement) await document.exitFullscreen();
  }, []);

  return <LibraryPage appInfo={appInfo} isBigPicture={isBigPicture} library={library} onBigPictureChange={setBigPicture} onLibraryUpdated={setLibrary} />;
}
