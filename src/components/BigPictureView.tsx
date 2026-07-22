import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Search,
  Settings,
  Heart,
  Clock,
  User,
  LogOut,
  Wifi,
  Battery,
  ChevronRight,
  Gamepad,
  Award,
  Flame,
  Library as LibIcon,
  X,
  RefreshCw
} from "lucide-react";
import type { Game, LibraryState, Profile } from "../types/window";
import { useBigPictureControls } from "../hooks/useBigPictureControls";
import { useUiSounds } from "../hooks/useUiSounds";
import { GameDetailsPage } from "../pages/GameDetailsPage";
import { CustomizationSettings } from "./CustomizationSettings";

interface BigPictureViewProps {
  library: LibraryState;
  profile: Profile | null;
  activeGameId: number | null;
  onBigPictureChange: (enabled: boolean) => Promise<void>;
  onLibraryUpdated: (library: LibraryState) => void;
  onUpdateProfile: (name: string, avatarPath: string | null) => Promise<void>;
  onUpdateSettings: (
    theme: string,
    accentColor: string,
    startInFullscreen: boolean,
    libraryDirectory: string | null
  ) => Promise<void>;
}

export function BigPictureView({
  library,
  profile,
  activeGameId,
  onBigPictureChange,
  onLibraryUpdated,
  onUpdateProfile,
  onUpdateSettings
}: BigPictureViewProps) {
  const [activeTab, setActiveTab] = useState<"Home" | "Library" | "Collections" | "Settings">("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [focusedGameCover, setFocusedGameCover] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Time clock state
  const [timeStr, setTimeStr] = useState("");

  const sounds = useUiSounds();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setTimeStr(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExitBigPicture = useCallback(async () => {
    sounds.playConfirm();
    await onBigPictureChange(false);
  }, [onBigPictureChange, sounds]);

  const toggleMenu = useCallback(() => {
    sounds.playConfirm();
    setMenuOpen((prev) => !prev);
  }, [sounds]);

  const handleBackAction = useCallback(() => {
    if (selectedGameId !== null) {
      sounds.playConfirm();
      setSelectedGameId(null);
    } else if (menuOpen) {
      sounds.playConfirm();
      setMenuOpen(false);
    } else if (activeTab !== "Home") {
      sounds.playConfirm();
      setActiveTab("Home");
    }
  }, [selectedGameId, menuOpen, activeTab, sounds]);

  // Hook up spatial directional navigation and controller listener
  useBigPictureControls(true, handleExitBigPicture, toggleMenu, handleBackAction);

  // Search input focus helper
  const focusSearchInput = () => {
    sounds.playConfirm();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Keyboard shortcut listener for big picture views (X key focuses search, Y key goes to settings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement) return;
      if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        setActiveTab("Library");
        setTimeout(focusSearchInput, 50);
      }
      if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        sounds.playConfirm();
        setActiveTab("Settings");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sounds]);

  // Platform filters
  const platformLabels: Record<string, string> = {
    all: "All Games",
    steam: "Steam",
    epic: "Epic Games",
    gog: "GOG Galaxy",
    local: "Local"
  };

  const filteredGames = library.games.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = selectedPlatform === "all" || game.platform === selectedPlatform;
    const matchesFavorites = !favoritesOnly || game.isFavorite;
    return matchesSearch && matchesPlatform && matchesFavorites;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    // Sort recently played first in BP mode for quick access
    if (a.lastPlayedAt && b.lastPlayedAt) {
      return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
    }
    if (a.lastPlayedAt) return -1;
    if (b.lastPlayedAt) return 1;
    return a.title.localeCompare(b.title);
  });

  // Calculate Recently Played (Continue Playing)
  const recentlyPlayed = [...library.games]
    .filter((g) => g.lastPlayedAt !== null)
    .sort((a, b) => new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime())
    .slice(0, 5);

  // Overall statistics
  const totalPlaytimeHours = (library.games.reduce((sum, g) => sum + g.playtimeSeconds, 0) / 3600).toFixed(1);
  const totalGamesCount = library.games.length;
  const favoritesCount = library.games.filter((g) => g.isFavorite).length;

  const refreshLibrary = async () => {
    onLibraryUpdated(await window.gameVault.getLibraryState());
  };

  const handleLaunchGame = async (gameId: number) => {
    try {
      sounds.playConfirm();
      await window.gameVault.launchGame(gameId);
    } catch (err: any) {
      alert(err.message || "Failed to launch game.");
    }
  };

  const handleUpdateMetadata = async (gameId: number, data: Partial<Game>) => {
    await window.gameVault.updateGameMetadata(gameId, data);
    await refreshLibrary();
  };

  const handleSyncPlatforms = async () => {
    sounds.playConfirm();
    setIsSyncing(true);
    setMessage("Syncing launcher platforms...");
    try {
      const res = await window.gameVault.syncPlatforms();
      await refreshLibrary();
      setMessage(
        res.imported > 0
          ? `Sync complete! Found ${res.imported} new/updated games.`
          : "Sync complete! No new games discovered."
      );
    } catch (err: any) {
      setMessage("Sync failed: " + (err.message || err));
    } finally {
      setIsSyncing(false);
    }
  };

  const focusProps = {
    "data-big-picture-focusable": "true" as const,
    onFocus: (e: React.FocusEvent<HTMLElement>) => {
      sounds.playFocus();
      const coverUrl = e.currentTarget.getAttribute("data-game-cover");
      if (coverUrl) {
        setFocusedGameCover(coverUrl);
      } else {
        setFocusedGameCover(null);
      }
    }
  };

  const formatPlaytime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-100 select-none">
      
      {/* Blurred artwork crossfader background */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-zinc-950 to-zinc-950 z-0 pointer-events-none" />
      <AnimatePresence mode="popLayout">
        {focusedGameCover ? (
          <motion.div
            key={focusedGameCover}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-cover bg-center blur-[110px] scale-110 pointer-events-none z-0"
            style={{ backgroundImage: `url(${focusedGameCover})` }}
          />
        ) : (
          <motion.div
            key="default-glow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--accent-glow-strong),transparent_65%)] pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      {/* Grid of decorative glowing accent vectors */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0" />

      {/* Header bar */}
      <header className="relative z-10 flex h-20 items-center justify-between px-10 border-b border-white/5 bg-zinc-950/40 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button
            {...focusProps}
            onClick={toggleMenu}
            className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 hover:bg-white/10 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 transition duration-150"
            type="button"
          >
            <div className="grid size-7 place-items-center rounded-lg bg-[var(--accent)] text-zinc-950 font-black text-xs shadow-[0_0_10px_var(--accent-glow-strong)]">
              GV
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-zinc-300">Menu</span>
          </button>

          <nav className="flex items-center gap-2">
            {(["Home", "Library", "Collections", "Settings"] as const).map((tab) => (
              <button
                {...focusProps}
                key={tab}
                onClick={() => {
                  sounds.playConfirm();
                  setActiveTab(tab);
                }}
                className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                  activeTab === tab
                    ? "bg-[var(--accent)] text-zinc-950 shadow-[0_0_12px_var(--accent-glow-strong)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
                type="button"
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Right side clock and widgets */}
        <div className="flex items-center gap-6 text-zinc-400">
          <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-4 py-1.5 rounded-full text-xs">
            <Gamepad className="size-4 text-[var(--accent)] animate-pulse" />
            <span className="font-semibold text-zinc-300">Gamepad Connected</span>
          </div>

          <div className="flex items-center gap-2">
            <Wifi className="size-4" />
            <Battery className="size-4" />
            <span className="text-sm font-black text-zinc-200 font-mono tracking-wider ml-1">{timeStr}</span>
          </div>

          {profile && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <span className="text-xs font-bold text-zinc-200">{profile.displayName}</span>
              <div className="size-8 rounded-full bg-[var(--accent-glow)] border border-[var(--accent)]/30 flex items-center justify-center text-sm">
                {profile.avatarPath ? (
                  <img src={profile.avatarPath} alt="Avatar" className="size-full rounded-full object-cover" />
                ) : (
                  "👾"
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main body viewport */}
      <main className="relative z-10 h-[calc(100vh-140px)] overflow-y-auto px-10 py-8">
        
        {message && (
          <div className="mx-auto max-w-4xl mb-6 rounded-2xl bg-zinc-900 border border-white/10 px-5 py-3.5 flex items-center justify-between text-sm text-zinc-200">
            <span>{message}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-xs font-bold text-zinc-500 hover:text-white"
              type="button"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: HOME (Steam Big Picture dashboard style) */}
        {activeTab === "Home" && (
          <div className="space-y-10">
            {/* Carousel / Recent Games Horizontal Grid */}
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Clock className="size-4 text-[var(--accent)]" /> Continue Playing
              </h2>

              {recentlyPlayed.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-zinc-900/20 backdrop-blur-sm p-16 text-center text-zinc-500">
                  <p className="text-sm font-medium">Your recently played games will appear here.</p>
                  <p className="text-xs mt-1 text-zinc-600">Navigate to Library to select and play games.</p>
                  <button
                    {...focusProps}
                    onClick={() => setActiveTab("Library")}
                    className="mt-4 rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
                    type="button"
                  >
                    Browse Library
                  </button>
                </div>
              ) : (
                <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scroll-smooth">
                  {recentlyPlayed.map((game, index) => {
                    const isFirst = index === 0;
                    return (
                      <button
                        {...focusProps}
                        data-game-cover={game.coverPath || ""}
                        key={game.id}
                        onClick={() => setSelectedGameId(game.id)}
                        className={`snap-start relative flex-shrink-0 rounded-2xl overflow-hidden text-left transition duration-200 focus:outline-none focus:scale-105 focus:ring-4 focus:ring-[var(--accent)]/50 focus:shadow-[0_0_20px_var(--accent-glow-strong)] ${
                          isFirst ? "w-[380px] h-[220px]" : "w-[240px] h-[220px]"
                        }`}
                        type="button"
                      >
                        {game.coverPath ? (
                          <img
                            src={game.coverPath}
                            alt={game.title}
                            className={`absolute inset-0 size-full object-cover transition duration-300 ${
                              isFirst ? "opacity-60" : "opacity-45 hover:opacity-60"
                            }`}
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 opacity-60" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        
                        {/* Platform tag overlay */}
                        <div className="absolute top-3.5 left-3.5 z-10">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider badge-${game.platform}`}>
                            {game.platform === "local" ? "Local" : game.platform}
                          </span>
                        </div>

                        {/* Text info block */}
                        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col justify-end">
                          <h3 className={`font-black tracking-tight text-white truncate ${isFirst ? "text-lg" : "text-sm"}`}>
                            {game.title}
                          </h3>
                          <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1.5">
                            <Clock className="size-3 text-[var(--accent)]" />
                            <span>Logged: {formatPlaytime(game.playtimeSeconds)}</span>
                          </p>
                        </div>

                        {/* Interactive Play prompt for the primary recently played item */}
                        {isFirst && (
                          <div className="absolute top-3.5 right-3.5 z-10 rounded-full bg-[var(--accent)] p-2 text-zinc-950 shadow-lg">
                            <Play className="size-4 fill-zinc-950" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Platform Quick Links (Direct Filter Shortcuts) */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { id: "steam", name: "Steam Storefront", style: "from-blue-950/80 to-blue-900/40 border-blue-500/20" },
                { id: "epic", name: "Epic Games Store", style: "from-zinc-900/80 to-zinc-800/40 border-zinc-500/20" },
                { id: "gog", name: "GOG Galaxy Library", style: "from-purple-950/80 to-purple-900/40 border-purple-500/20" },
                { id: "local", name: "Local Files", style: "from-emerald-950/80 to-emerald-900/40 border-emerald-500/20" }
              ].map((plat) => (
                <button
                  {...focusProps}
                  key={plat.id}
                  onClick={() => {
                    sounds.playConfirm();
                    setSelectedPlatform(plat.id);
                    setActiveTab("Library");
                  }}
                  className={`flex flex-col justify-between rounded-2xl bg-gradient-to-br ${plat.style} border p-5 text-left transition duration-200 focus:scale-[1.03] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30`}
                  type="button"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Launchers</span>
                  <div className="mt-4 flex items-center justify-between w-full">
                    <span className="text-sm font-black tracking-tight text-white">{plat.name}</span>
                    <ChevronRight className="size-4 text-zinc-500" />
                  </div>
                </button>
              ))}
            </div>

            {/* Premium Stat Widgets Grid */}
            <div className="grid grid-cols-3 gap-5">
              <div className="rounded-2xl border border-white/5 bg-zinc-900/25 backdrop-blur-sm p-6 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-xl bg-zinc-950 text-[var(--accent)]">
                  <LibIcon className="size-6 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Games</p>
                  <p className="text-xl font-black text-white">{totalGamesCount}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900/25 backdrop-blur-sm p-6 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-xl bg-zinc-950 text-orange-500">
                  <Flame className="size-6 text-orange-500 animate-pulse" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Playtime Logged</p>
                  <p className="text-xl font-black text-white">{totalPlaytimeHours} Hours</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/5 bg-zinc-900/25 backdrop-blur-sm p-6 flex items-center gap-4">
                <div className="grid size-12 place-items-center rounded-xl bg-zinc-950 text-yellow-400">
                  <Award className="size-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Favorites</p>
                  <p className="text-xl font-black text-white">{favoritesCount} Titles</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: LIBRARY (Grid of Games with Horizontal Filter Nav) */}
        {activeTab === "Library" && (
          <div className="space-y-6">
            
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-900/10 backdrop-blur-sm border border-white/5 p-3.5 rounded-2xl">
              
              {/* Horizontal platform filters */}
              <div className="flex gap-1">
                {(["all", "steam", "epic", "gog", "local"] as const).map((plat) => (
                  <button
                    {...focusProps}
                    key={plat}
                    onClick={() => {
                      sounds.playConfirm();
                      setSelectedPlatform(plat);
                    }}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                      selectedPlatform === plat
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                    type="button"
                  >
                    {platformLabels[plat]}
                  </button>
                ))}
              </div>

              {/* Favorites & Sync Buttons */}
              <div className="flex items-center gap-2">
                <button
                  {...focusProps}
                  onClick={() => {
                    sounds.playConfirm();
                    setFavoritesOnly((prev) => !prev);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                    favoritesOnly ? "bg-red-950/40 text-red-400 border border-red-500/20" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                  type="button"
                >
                  <Heart className={`size-3.5 ${favoritesOnly ? "fill-red-400" : ""}`} />
                  <span>Favorites</span>
                </button>

                <button
                  {...focusProps}
                  onClick={handleSyncPlatforms}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 px-3.5 py-1.5 text-xs font-bold disabled:opacity-50"
                  type="button"
                >
                  <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>Sync Clients</span>
                </button>
              </div>

              {/* Search input bar */}
              <div className="relative min-w-[280px]">
                <input
                  ref={searchInputRef}
                  {...focusProps}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles... (Press X)"
                  className="w-full rounded-xl border border-white/10 bg-zinc-950/60 px-4 py-2 pl-9 text-xs outline-none focus:border-[var(--accent)]"
                />
                <Search className="absolute left-3 top-2.5 size-3.5 text-zinc-500" />
              </div>
            </div>

            {/* Grid of covers */}
            {sortedGames.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-20 text-center text-zinc-500 bg-zinc-900/10">
                No games matching active filters found.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5 pb-10">
                {sortedGames.map((game) => (
                  <button
                    {...focusProps}
                    data-game-cover={game.coverPath || ""}
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className="group relative aspect-[3/4] rounded-2xl border border-white/5 bg-zinc-900 overflow-hidden text-left focus:outline-none focus:scale-105 focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/45 focus:shadow-[0_0_15px_var(--accent-glow-strong)] transition duration-200"
                    type="button"
                  >
                    {game.coverPath ? (
                      <img src={game.coverPath} alt={game.title} className="size-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex flex-col justify-center items-center p-4">
                        <span className="text-4xl select-none mb-2">🎮</span>
                        <span className="text-xs text-center font-bold truncate w-full text-zinc-400">{game.title}</span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 opacity-0 group-focus:opacity-100 group-hover:opacity-100 transition duration-150">
                      <p className="font-bold text-xs truncate text-white">{game.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Played: {formatPlaytime(game.playtimeSeconds)}</p>
                    </div>

                    <div className="absolute top-2 left-2">
                      <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase badge-${game.platform}`}>
                        {game.platform}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: COLLECTIONS */}
        {activeTab === "Collections" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <Award className="size-5 text-[var(--accent)]" /> Your Collections
            </h2>

            {library.collections.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-16 text-center text-zinc-500 bg-zinc-900/10">
                Create collections on the desktop interface to categorize your vault.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {library.collections.map((col) => (
                  <div
                    key={col.id}
                    className="rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-sm p-6 space-y-2"
                  >
                    <h3 className="font-extrabold text-base text-zinc-200">{col.name}</h3>
                    <p className="text-xs text-zinc-500">{col.gameCount} Games</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: SETTINGS (Large, clean grid configurations) */}
        {activeTab === "Settings" && profile && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
            <CustomizationSettings profile={profile} onUpdateSettings={onUpdateSettings} />

            <div className="space-y-6">
              {/* Profile Card */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <User className="size-5 text-[var(--accent)]" /> Player Profile
                </h3>

                <div className="flex items-center gap-4">
                  <div className="grid size-14 place-items-center rounded-full bg-[var(--accent-glow)] border border-[var(--accent)] text-2xl">
                    {profile.avatarPath ? (
                      <img src={profile.avatarPath} alt="Avatar" className="size-full rounded-full object-cover" />
                    ) : (
                      "👾"
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{profile.displayName}</h4>
                    <p className="text-xs text-zinc-500">Big Picture Player Profile</p>
                  </div>
                </div>
              </div>

              {/* Launcher Sync */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <RefreshCw className="size-5 text-[var(--accent)]" /> Platform Synchronization
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Trigger a library scan on installed game store launchers. This will sync Steam, Epic, and GOG client game states.
                </p>
                <button
                  {...focusProps}
                  onClick={handleSyncPlatforms}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-xs font-bold hover:bg-white/15 transition disabled:opacity-50"
                  type="button"
                >
                  <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Storefront Platforms"}
                </button>
              </div>

              {/* Steam Directory Card */}
              <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="size-5 text-[var(--accent)]" /> Steam Directory
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Configure custom Steam directory (containing 'steamapps') if not auto-detected.
                </p>

                <div className="rounded-2xl bg-zinc-950/60 p-4 border border-white/5 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profile.steamDirectory || "Default Steam Directory"}
                      className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs outline-none truncate text-zinc-500 font-mono"
                    />
                    <button
                      {...focusProps}
                      onClick={async () => {
                        try {
                          const selected = await window.gameVault.selectDirectory();
                          if (selected) {
                            await onUpdateSettings(
                              profile.theme,
                              profile.accentColor,
                              profile.startInFullscreen,
                              profile.libraryDirectory || null,
                              selected
                            );
                            sounds.playConfirm();
                          }
                        } catch (err: any) {
                          setMessage("Failed to select Steam folder: " + (err.message || err));
                        }
                      }}
                      className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15 transition text-white"
                      type="button"
                    >
                      Browse
                    </button>
                  </div>

                  {profile.steamDirectory && (
                    <button
                      {...focusProps}
                      onClick={async () => {
                        try {
                          await onUpdateSettings(
                            profile.theme,
                            profile.accentColor,
                            profile.startInFullscreen,
                            profile.libraryDirectory || null,
                            null
                          );
                          sounds.playConfirm();
                        } catch (err: any) {
                          setMessage("Failed to clear Steam folder: " + (err.message || err));
                        }
                      }}
                      className="w-full rounded-xl bg-red-950/40 border border-red-500/20 py-2.5 text-xs font-bold hover:bg-red-950 transition text-red-200"
                      type="button"
                    >
                      Clear Custom Steam Path
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Slide-out Steam Flyout Drawer Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Dark background overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Menu container */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28 }}
              className="fixed inset-y-0 left-0 w-80 bg-zinc-950 border-r border-white/10 shadow-[5px_0_30px_rgba(0,0,0,0.8)] z-50 px-6 py-8 flex flex-col justify-between"
            >
              <div className="space-y-8">
                {/* Logo & title header */}
                <div className="flex items-center gap-3 pb-6 border-b border-white/5">
                  <div className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] font-black text-zinc-950">
                    GV
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">GameVault Menu</h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Big Picture View</p>
                  </div>
                </div>

                {/* Focusable navigation options */}
                <nav className="flex flex-col gap-2">
                  {[
                    { id: "Home", label: "Dashboard" },
                    { id: "Library", label: "Library Grid" },
                    { id: "Collections", label: "Collections" },
                    { id: "Settings", label: "System Settings" }
                  ].map((item) => (
                    <button
                      {...focusProps}
                      key={item.id}
                      onClick={() => {
                        sounds.playConfirm();
                        setActiveTab(item.id as any);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left rounded-xl px-4 py-3 text-sm font-extrabold transition focus:outline-none focus:bg-[var(--accent-glow)] focus:text-[var(--accent)] focus:border-[var(--accent)] border border-transparent ${
                        activeTab === item.id ? "bg-white/5 text-white" : "text-zinc-400 hover:text-white"
                      }`}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Footer controls inside drawer */}
              <div className="space-y-4">
                <button
                  {...focusProps}
                  onClick={handleExitBigPicture}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-950/30 border border-red-500/25 py-3.5 text-xs font-bold text-red-200 hover:bg-red-950 transition focus:outline-none focus:ring-2 focus:ring-red-500/40"
                  type="button"
                >
                  <LogOut className="size-4" /> Exit Big Picture Mode
                </button>

                <p className="text-[10px] text-center text-zinc-600 font-bold uppercase">
                  Press B / ESC to close menu
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Console bottom button guide bar */}
      <footer className="relative z-10 h-14 bg-zinc-950/80 border-t border-white/5 flex items-center justify-between px-10 text-xs font-black tracking-wider text-zinc-400 uppercase">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-zinc-800 text-zinc-200 px-1.5 py-0.5 border border-white/5">DPad/Arrows</span>
            <span>Navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-zinc-800 text-zinc-200 px-1.5 py-0.5 border border-white/5">A / Enter</span>
            <span>Select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-zinc-800 text-zinc-200 px-1.5 py-0.5 border border-white/5">B / Backsp / Esc</span>
            <span>Back / Menu</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-[var(--accent)] text-zinc-950 px-1.5 py-0.5 shadow-sm">X</span>
            <span>Search</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-[var(--accent)] text-zinc-950 px-1.5 py-0.5 shadow-sm">Y</span>
            <span>Settings</span>
          </div>
        </div>
      </footer>

      {/* Render selected Game Details modal */}
      {selectedGameId !== null && (
        <GameDetailsPage
          game={library.games.find((g) => g.id === selectedGameId)!}
          isRunning={activeGameId === selectedGameId}
          onClose={() => setSelectedGameId(null)}
          onLaunch={handleLaunchGame}
          onUpdateMetadata={handleUpdateMetadata}
        />
      )}
    </div>
  );
}
