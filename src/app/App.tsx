import { useCallback, useEffect, useState } from "react";
import { LibraryPage } from "../pages/LibraryPage";
import { BootScreen } from "../components/BootScreen";
import type { Profile, LibraryState } from "../types/window";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

export function App() {
  const [booting, setBooting] = useState(true);
  const [bpBooting, setBpBooting] = useState(false);
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

  useEffect(() => {
    if (isBigPicture && !booting) {
      setBpBooting(true);
    }
  }, [isBigPicture, booting]);

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

  const handleUpdateSettings = async (
    theme: string,
    accentColor: string,
    startInFullscreen: boolean,
    libraryDirectory: string | null,
    steamDirectory?: string | null,
    customBgPrimary?: string,
    customBgSecondary?: string,
    customTextPrimary?: string,
    customAccent?: string
  ) => {
    const resolvedSteamDir = steamDirectory !== undefined ? steamDirectory : (profile?.steamDirectory || null);
    await window.gameVault.updateSettings(
      theme,
      accentColor,
      startInFullscreen,
      libraryDirectory,
      resolvedSteamDir,
      customBgPrimary,
      customBgSecondary,
      customTextPrimary,
      customAccent
    );
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

  // Compute dynamic custom styles if 'custom' is selected
  const customThemeStyles = profile?.theme === "custom" ? {
    "--bg-primary": profile.customBgPrimary || "#09090b",
    "--bg-secondary": profile.customBgSecondary || "rgba(255, 255, 255, 0.02)",
    "--bg-sidebar": profile.customBgSecondary ? `${profile.customBgSecondary}a0` : "rgba(24, 24, 27, 0.4)",
    "--text-primary": profile.customTextPrimary || "#f4f4f5",
    "--text-secondary": profile.customTextPrimary ? `${profile.customTextPrimary}a0` : "#a1a1aa",
    "--border-color": profile.customTextPrimary ? `${profile.customTextPrimary}20` : "rgba(255, 255, 255, 0.08)",
    "--accent": profile.customAccent || "#a3e635",
    "--accent-hover": profile.customAccent || "#bef264",
    "--accent-glow": profile.customAccent ? `${profile.customAccent}20` : "rgba(163, 230, 53, 0.15)",
    "--accent-glow-strong": profile.customAccent ? `${profile.customAccent}60` : "rgba(163, 230, 53, 0.4)"
  } as React.CSSProperties : {};

  return (
    <div
      className={`theme-${resolvedTheme} accent-${profile?.accentColor || "lime"} min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]`}
      style={customThemeStyles}
    >
      {bpBooting ? (
        <BootScreen onComplete={() => setBpBooting(false)} />
      ) : (
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
      )}
    </div>
  );
}
