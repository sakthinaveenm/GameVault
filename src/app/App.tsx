import { useEffect, useState } from "react";
import { LibraryPage } from "../pages/LibraryPage";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

export function App() {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void window.gameVault.getAppInfo().then(setAppInfo);
  }, []);

  return <LibraryPage appInfo={appInfo} />;
}
