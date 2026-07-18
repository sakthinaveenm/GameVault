import { useCallback, useEffect, useState } from "react";
import { LibraryPage } from "../pages/LibraryPage";
import { BootScreen } from "../components/BootScreen";
import type { Profile, LibraryState } from "../types/window";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

export function App() {
  const [booting, setBooting] = useState(true);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [library, setLibrary] = useState<LibraryState>({ games: [], collections: [] });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isBigPicture, setIsBigPicture] = useState(false);
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const [info, state, prof] = await Promise.all([
        window.gameVault.getAppInfo(),
        window.gameVault.getLibraryState(),
        window.gameVault.getProfile()
      ]);
      setAppInfo(info);
      setLibrary(state);
      setProfile(prof);
    } catch (err) {
      console.error("Failed to load initial application state:", err);
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  // Sync game status events from Main process
  useEffect(() => {
    const removeListener = window.gameVault.onGameStatus((data) => {
      if (data.status === "started") {
        setActiveGameId(data.gameId);
      } else {
        setActiveGameId(null);
        // Refresh library stats once game has exited (to fetch new playtimes)
        void window.gameVault.getLibraryState().then((state) => setLibrary(state));
      }
    });
    return () => removeListener();
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsBigPicture(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const setBigPicture = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (!enabled && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Failed to toggle fullscreen state:", err);
    }
  }, []);

  const handleUpdateProfile = async (name: string, avatarPath: string | null) => {
    await window.gameVault.updateProfile(name, avatarPath);
    const updated = await window.gameVault.getProfile();
    setProfile(updated);
  };

  const handleUpdateSettings = async (theme: string, accentColor: string, startInFullscreen: boolean) => {
    await window.gameVault.updateSettings(theme, accentColor, startInFullscreen);
    const updated = await window.gameVault.getProfile();
    setProfile(updated);
  };

  if (booting) {
    return <BootScreen onComplete={() => setBooting(false)} />;
  }

  // Determine system theme if 'system' is chosen
  const resolvedTheme = profile?.theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
    : (profile?.theme || "dark");

  return (
    <div className={`theme-${resolvedTheme} accent-${profile?.accentColor || "lime"} min-h-screen bg-zinc-950`}>
      <LibraryPage
        appInfo={appInfo}
        isBigPicture={isBigPicture}
        library={library}
        profile={profile}
        activeGameId={activeGameId}
        onBigPictureChange={setBigPicture}
        onLibraryUpdated={setLibrary}
        onUpdateProfile={handleUpdateProfile}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
