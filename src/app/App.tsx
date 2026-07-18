import { useEffect, useState } from "react";
import { LibraryPage } from "../pages/LibraryPage";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    void Promise.all([window.gameVault.getAppInfo(), window.gameVault.getGames()]).then(([info, library]) => {
      setAppInfo(info);
      setGames(library);
    });
  }, []);

  return <LibraryPage appInfo={appInfo} games={games} onGamesImported={setGames} />;
}
