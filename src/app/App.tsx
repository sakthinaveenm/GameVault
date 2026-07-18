import { useEffect, useState } from "react";
import { LibraryPage } from "../pages/LibraryPage";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [library, setLibrary] = useState<LibraryState>({ games: [], collections: [] });

  useEffect(() => {
    void Promise.all([window.gameVault.getAppInfo(), window.gameVault.getLibraryState()]).then(([info, state]) => {
      setAppInfo(info);
      setLibrary(state);
    });
  }, []);

  return <LibraryPage appInfo={appInfo} library={library} onLibraryUpdated={setLibrary} />;
}
