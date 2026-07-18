import { useCallback, useState } from "react";
import { useBigPictureControls } from "../hooks/useBigPictureControls";
import { useUiSounds } from "../hooks/useUiSounds";
import type { Game, LibraryState, Profile } from "../types/window";
import { GameDetailsPage } from "./GameDetailsPage";
import { CustomizationSettings } from "../components/CustomizationSettings";
import { ProfileModal } from "../components/ProfileModal";
import {
  Grid,
  List,
  SortAsc,
  Heart,
  FolderPlus,
  Search,
  Sparkles,
  User,
  Settings,
  Flame,
  Award,
  Library as LibIcon,
  Play,
  RefreshCw
} from "lucide-react";

type AppInfo = Awaited<ReturnType<typeof window.gameVault.getAppInfo>>;

interface LibraryPageProps {
  appInfo: AppInfo | null;
  isBigPicture: boolean;
  library: LibraryState;
  profile: Profile | null;
  activeGameId: number | null;
  onBigPictureChange: (enabled: boolean) => Promise<void>;
  onLibraryUpdated: (library: LibraryState) => void;
  onUpdateProfile: (name: string, avatarPath: string | null) => Promise<void>;
  onUpdateSettings: (theme: string, accentColor: string, startInFullscreen: boolean) => Promise<void>;
}

const navigation = ["Home", "Library", "Collections", "Settings"];

const platformLabels: Record<string, string> = {
  steam: "Steam",
  epic: "Epic Games",
  gog: "GOG Galaxy",
  local: "Local"
};

export function LibraryPage({
  appInfo,
  isBigPicture,
  library,
  profile,
  activeGameId,
  onBigPictureChange,
  onLibraryUpdated,
  onUpdateProfile,
  onUpdateSettings
}: LibraryPageProps) {
  const [activeTab, setActiveTab] = useState<string>("Home");
  const [isImporting, setIsImporting] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [query, setQuery] = useState("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Settings & Profile overlays
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  // Layout & Sorting & Platforms
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"title" | "playtime" | "lastPlayed">("title");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const sounds = useUiSounds();
  const exitBigPicture = useCallback(() => { void onBigPictureChange(false); }, [onBigPictureChange]);
  useBigPictureControls(isBigPicture, exitBigPicture);

  const normalizedQuery = query.trim().toLocaleLowerCase();

  // Filter games based on search query, favorites, and platform filters
  const filteredGames = library.games.filter(
    (game) => (!favoritesOnly || game.isFavorite) &&
              (selectedPlatform === "all" || game.platform === selectedPlatform) &&
              (!normalizedQuery || game.title.toLocaleLowerCase().includes(normalizedQuery))
  );

  // Apply sorting
  const sortedGames = [...filteredGames].sort((a, b) => {
    if (sortBy === "playtime") {
      return b.playtimeSeconds - a.playtimeSeconds;
    }
    if (sortBy === "lastPlayed") {
      if (!a.lastPlayedAt) return 1;
      if (!b.lastPlayedAt) return -1;
      return new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime();
    }
    return a.title.localeCompare(b.title);
  });

  // Calculate Recently Played (Continue Playing)
  const recentlyPlayed = [...library.games]
    .filter((g) => g.lastPlayedAt !== null)
    .sort((a, b) => new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime())
    .slice(0, 4);

  // Compute overall stats
  const totalPlaytimeHours = (library.games.reduce((sum, g) => sum + g.playtimeSeconds, 0) / 3600).toFixed(1);
  const totalFavoritesCount = library.games.filter((g) => g.isFavorite).length;

  const focusProps = isBigPicture ? { "data-big-picture-focusable": "true" as const, onFocus: sounds.playFocus } : {};

  // Check if Sandbox Mode is currently active in the database
  const sandboxModeActive = library.games.some((g) => g.platform !== "local");

  async function refreshLibrary() {
    onLibraryUpdated(await window.gameVault.getLibraryState());
  }

  async function handleChooseFolder() {
    setIsImporting(true);
    setMessage(null);
    try {
      const result = await window.gameVault.chooseAndImportGames();
      if (!result.canceled) {
        await refreshLibrary();
        setMessage(result.imported ? `${result.imported} game${result.imported === 1 ? "" : "s"} imported.` : "No playable apps or executables were found.");
        sounds.playConfirm();
      }
    } catch {
      setMessage("The folder could not be scanned. Please try another location.");
    } finally {
      setIsImporting(false);
    }
  }

  async function handleFavorite(event: React.MouseEvent, game: Game) {
    event.stopPropagation(); // Avoid opening details modal
    await window.gameVault.setGameFavorite(game.id, !game.isFavorite);
    await refreshLibrary();
    sounds.playConfirm();
  }

  async function handleCreateCollection(event: React.FormEvent) {
    event.preventDefault();
    const name = collectionName.trim();
    if (!name) return;
    setIsCreatingCollection(true);
    setMessage(null);
    try {
      await window.gameVault.createCollection(name);
      setCollectionName("");
      await refreshLibrary();
      sounds.playConfirm();
    } catch {
      setMessage("Collection names must be unique and between 1 and 60 characters.");
    } finally {
      setIsCreatingCollection(false);
    }
  }

  async function handleLaunchGame(gameId: number) {
    try {
      await window.gameVault.launchGame(gameId);
    } catch (err: any) {
      alert(err.message || "Failed to launch game.");
    }
  }

  async function handleUpdateMetadata(gameId: number, data: Partial<Game>) {
    await window.gameVault.updateGameMetadata(gameId, data);
    await refreshLibrary();
  }

  async function handleSyncPlatforms() {
    setMessage("Scanning platform clients...");
    try {
      const res = await window.gameVault.syncPlatforms();
      await refreshLibrary();
      setMessage(
        res.imported > 0
          ? `Successfully synced platform launchers. Discovered/updated ${res.imported} games.`
          : "Scanning completed. No new launcher games found."
      );
      sounds.playConfirm();
    } catch (err: any) {
      setMessage("Failed to scan platform launcher libraries: " + (err.message || err));
    }
  }

  async function handleToggleSandbox(enabled: boolean) {
    setMessage(enabled ? "Enabling sandbox demo library..." : "Clearing sandbox platform entries...");
    try {
      await window.gameVault.toggleSandboxMode(enabled);
      await refreshLibrary();
      setMessage(
        enabled
          ? "Sandbox mode enabled. Check your dashboard/library for simulated Steam, Epic, and GOG titles!"
          : "Sandbox platform titles removed successfully."
      );
      sounds.playConfirm();
    } catch (err: any) {
      setMessage("Failed to toggle sandbox simulation: " + (err.message || err));
    }
  }

  // Preset avatar selection
  const avatarValue = profile?.avatarPath || "👾";

  return (
    <main className={`min-h-screen bg-zinc-950 text-zinc-100 ${isBigPicture ? "bg-[radial-gradient(circle_at_top,#1c2317,#09090b_60%)]" : ""}`}>
      <div className={`mx-auto grid min-h-screen max-w-[1600px] ${isBigPicture ? "grid-cols-[300px_1fr]" : "grid-cols-[240px_1fr]"}`}>
        
        {/* Sidebar Nav */}
        <aside className="border-r border-white/10 bg-zinc-900/30 px-5 py-7 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-[var(--accent)] font-black text-zinc-950 shadow-[0_0_15px_var(--accent-glow-strong)]">
                G
              </div>
              <div>
                <p className="font-semibold tracking-tight">GameVault</p>
                <p className="text-xs text-zinc-500">Your games. One vault.</p>
              </div>
            </div>

            <nav aria-label="Primary navigation" className="space-y-1">
              {navigation.map((item) => (
                <button
                  {...focusProps}
                  key={item}
                  onClick={() => {
                    setActiveTab(item);
                    sounds.playConfirm();
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)] ${
                    activeTab === item && selectedPlatform === "all"
                      ? "bg-white/10 font-bold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </nav>

            {/* Platforms Selector Section */}
            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Platforms</p>
              <ul className="space-y-1">
                {[
                  { id: "all", name: "All Library Games", count: library.games.length },
                  { id: "steam", name: "Steam Storefront", count: library.games.filter((g) => g.platform === "steam").length },
                  { id: "epic", name: "Epic Games", count: library.games.filter((g) => g.platform === "epic").length },
                  { id: "gog", name: "GOG Galaxy", count: library.games.filter((g) => g.platform === "gog").length },
                  { id: "local", name: "Local Executables", count: library.games.filter((g) => g.platform === "local").length }
                ].map((plat) => (
                  <li key={plat.id}>
                    <button
                      onClick={() => {
                        setSelectedPlatform(plat.id);
                        setActiveTab("Library");
                        sounds.playConfirm();
                      }}
                      className={`w-full flex justify-between items-center rounded-xl px-4 py-2 text-left text-xs transition ${
                        selectedPlatform === plat.id && activeTab === "Library"
                          ? "bg-white/10 font-bold text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                      type="button"
                    >
                      <span>{plat.name}</span>
                      <span className="rounded bg-zinc-950/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500">
                        {plat.count}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Collections</p>
              <form className="flex gap-2" onSubmit={handleCreateCollection}>
                <input
                  {...focusProps}
                  aria-label="New collection name"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none placeholder:text-zinc-600 focus:border-[var(--accent)]"
                  onChange={(event) => setCollectionName(event.target.value)}
                  placeholder="New collection"
                  value={collectionName}
                />
                <button
                  {...focusProps}
                  className="rounded-xl bg-white/10 px-3 text-sm hover:bg-white/15 disabled:opacity-50 font-bold animate-pulse-ring"
                  disabled={isCreatingCollection}
                  type="submit"
                >
                  +
                </button>
              </form>
              <ul className="space-y-1">
                {library.collections.map((collection) => (
                  <li className="flex justify-between rounded-lg px-3 py-1.5 text-sm text-zinc-400" key={collection.id}>
                    <span className="truncate">{collection.name}</span>
                    <span className="text-xs text-zinc-600">{collection.gameCount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* User Profile Panel at Bottom */}
          {profile && (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="mt-6 flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-3 text-left hover:bg-white/[0.07] transition"
              type="button"
            >
              <div className="grid size-10 place-items-center rounded-full bg-[var(--accent-glow)] text-2xl select-none">
                {avatarValue.startsWith("http") || avatarValue.includes("/") ? (
                  <img src={avatarValue} alt="Avatar" className="size-full rounded-full object-cover" />
                ) : (
                  avatarValue
                )}
              </div>
              <div className="truncate flex-1">
                <p className="text-sm font-bold truncate text-white">{profile.displayName}</p>
                <p className="text-[10px] text-[var(--accent)] uppercase tracking-widest font-bold">Player Stats</p>
              </div>
            </button>
          )}
        </aside>

        {/* Main Content Area */}
        <section className={`px-8 py-10 sm:px-12 flex flex-col justify-between overflow-y-auto ${isBigPicture ? "px-14 py-14" : ""}`}>
          <div className="space-y-10">
            {/* Header */}
            <header className="flex items-center justify-between gap-6 border-b border-white/5 pb-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
                  GAMEVAULT {isBigPicture ? "BIG PICTURE" : "1.0"}
                </p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
                  {activeTab === "Home" && `Welcome, ${profile?.displayName || "Player"}!`}
                  {activeTab === "Library" && (selectedPlatform === "all" ? "Your Library" : `${platformLabels[selectedPlatform]} Games`)}
                  {activeTab === "Collections" && "Custom Collections"}
                  {activeTab === "Settings" && "Application Settings"}
                </h1>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  {...focusProps}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 focus:outline-2 focus:outline-[var(--accent)] transition"
                  onClick={() => void onBigPictureChange(!isBigPicture)}
                  type="button"
                >
                  {isBigPicture ? "Exit Big Picture" : "Big Picture"}
                </button>
                <div className="rounded-full border border-white/10 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400">
                  {appInfo?.databaseReady ? "Vault connected" : "Connecting..."}
                </div>
              </div>
            </header>

            {message && (
              <div className="rounded-2xl bg-[var(--accent-glow)] border border-[var(--accent)]/20 p-4 text-sm text-zinc-200">
                {message}
              </div>
            )}

            {/* TAB CONTENT - HOME */}
            {activeTab === "Home" && (
              <div className="space-y-10">
                {/* Stats Widgets Row */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-zinc-900 text-zinc-400">
                      <LibIcon className="size-6 text-[var(--accent)]" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold uppercase">Total Games</p>
                      <p className="text-2xl font-black">{library.games.length}</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-zinc-900 text-zinc-400">
                      <Flame className="size-6 text-orange-500 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold uppercase">Time Logged</p>
                      <p className="text-2xl font-black">{totalPlaytimeHours} Hours</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-zinc-900 text-zinc-400">
                      <Award className="size-6 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 font-semibold uppercase">Favorites</p>
                      <p className="text-2xl font-black">{totalFavoritesCount}</p>
                    </div>
                  </div>
                </div>

                {/* Continue Playing Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="size-5 text-[var(--accent)]" /> Continue Playing
                  </h3>
                  {recentlyPlayed.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-zinc-500">
                      You haven't played any games yet. Launch a game from the Library to start tracking playtime!
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {recentlyPlayed.map((game) => (
                        <button
                          key={game.id}
                          onClick={() => setSelectedGameId(game.id)}
                          className="group relative h-48 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden text-left hover:scale-[1.03] focus:scale-[1.03] transition duration-200"
                          type="button"
                        >
                          {game.coverPath && game.coverPath.startsWith("http") || game.coverPath?.includes("/") ? (
                            <img src={game.coverPath} alt={game.title} className="absolute inset-0 size-full object-cover opacity-40 group-hover:opacity-60 transition" />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 opacity-50" />
                          )}
                          
                          {/* Platform pill indicator on home card */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider badge-${game.platform}`}>
                              {platformLabels[game.platform]}
                            </span>
                          </div>

                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                          
                          <div className="absolute bottom-4 left-4 right-4">
                            <h4 className="font-bold truncate text-white text-sm">{game.title}</h4>
                            <p className="text-xs text-zinc-400 mt-1">
                              Played: {formatPlaytime(game.playtimeSeconds)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT - LIBRARY */}
            {activeTab === "Library" && (
              <div className="space-y-6">
                {/* Search / Sort controls */}
                <section className="flex flex-wrap items-center gap-4 bg-zinc-900/20 border border-white/5 p-4 rounded-2xl">
                  {/* Search */}
                  <div className="relative flex-1 min-w-56">
                    <input
                      {...focusProps}
                      aria-label="Search games"
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search your library..."
                      value={query}
                    />
                    <Search className="absolute left-3.5 top-3.5 size-4 text-zinc-600" />
                  </div>

                  {/* Favorites Filter */}
                  <button
                    {...focusProps}
                    aria-pressed={favoritesOnly}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                      favoritesOnly
                        ? "bg-[var(--accent)] text-zinc-950"
                        : "border border-white/10 text-zinc-300 hover:bg-white/5"
                    }`}
                    onClick={() => setFavoritesOnly((current) => !current)}
                    type="button"
                  >
                    <Heart className={`size-4 ${favoritesOnly ? "fill-zinc-950" : ""}`} /> Favorites
                  </button>

                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1">
                    <SortAsc className="size-4 text-zinc-500" />
                    <select
                      className="bg-transparent text-sm py-1.5 outline-none text-zinc-300 font-semibold cursor-pointer border-none"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="title" className="bg-zinc-900">Alphabetical</option>
                      <option value="playtime" className="bg-zinc-900">Playtime</option>
                      <option value="lastPlayed" className="bg-zinc-900">Last Played</option>
                    </select>
                  </div>

                  {/* Grid/List View Toggles */}
                  <div className="flex border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2.5 transition ${viewMode === "grid" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"}`}
                      type="button"
                      title="Grid View"
                    >
                      <Grid className="size-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2.5 transition ${viewMode === "list" ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"}`}
                      type="button"
                      title="List View"
                    >
                      <List className="size-4" />
                    </button>
                  </div>

                  {/* Sync Platforms Button */}
                  <button
                    {...focusProps}
                    onClick={handleSyncPlatforms}
                    className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-800 text-zinc-300 transition"
                    type="button"
                  >
                    <RefreshCw className="size-4" /> Sync Clients
                  </button>

                  {/* Import Folder Button */}
                  <button
                    {...focusProps}
                    className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-black text-zinc-950 hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
                    disabled={isImporting}
                    onClick={handleChooseFolder}
                    type="button"
                  >
                    <FolderPlus className="size-4" /> {isImporting ? "Scanning…" : "Add Folder"}
                  </button>
                </section>

                {/* Games Render Layout */}
                {sortedGames.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-white/15 px-6 py-20 text-center text-zinc-500">
                    {library.games.length ? "No games match this filter." : "Add a game folder or sync launchers to build your library."}
                  </div>
                ) : viewMode === "grid" ? (
                  /* GRID VIEW */
                  <ul className={`grid gap-5 ${isBigPicture ? "grid-cols-4" : "grid-cols-3"}`}>
                    {sortedGames.map((game) => (
                      <li key={game.id}>
                        <button
                          {...focusProps}
                          className="w-full flex flex-col rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden text-left hover:scale-[1.03] focus:scale-[1.03] focus:border-[var(--accent)] focus:outline-none transition group relative"
                          onClick={() => setSelectedGameId(game.id)}
                          type="button"
                        >
                          {/* Platform Badge overlay */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider badge-${game.platform}`}>
                              {platformLabels[game.platform]}
                            </span>
                          </div>

                          {/* Card cover image */}
                          <div className="h-44 w-full bg-zinc-900 relative flex items-center justify-center text-4xl select-none">
                            {game.coverPath && game.coverPath.startsWith("http") || game.coverPath?.includes("/") ? (
                              <img src={game.coverPath} alt={game.title} className="size-full object-cover" />
                            ) : (
                              "🎮"
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 group-focus:opacity-100 flex items-center justify-center transition">
                              <div className="rounded-full bg-[var(--accent)] p-3 text-zinc-950 shadow-md">
                                <Play className="size-5 fill-zinc-950" />
                              </div>
                            </div>
                          </div>

                          {/* Card Text info */}
                          <div className="p-5 flex-1 flex flex-col justify-between">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-bold truncate text-white">{game.title}</p>
                              <button
                                onClick={(e) => handleFavorite(e, game)}
                                className={`text-sm ${game.isFavorite ? "text-[var(--accent)]" : "text-zinc-600 hover:text-zinc-400"}`}
                                type="button"
                              >
                                ★
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-zinc-500 font-medium">
                              Playtime: {formatPlaytime(game.playtimeSeconds)}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  /* LIST VIEW */
                  <ul className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 bg-white/[0.01]">
                    {sortedGames.map((game) => (
                      <li key={game.id}>
                        <button
                          {...focusProps}
                          onClick={() => setSelectedGameId(game.id)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.04] text-left transition"
                          type="button"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider badge-${game.platform} shrink-0`}>
                              {platformLabels[game.platform]}
                            </span>
                            <div className="truncate">
                              <p className="font-bold text-white truncate">{game.title}</p>
                              <p className="text-[10px] text-zinc-500 truncate">{game.executablePath}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 shrink-0">
                            <span className="text-xs text-zinc-400">
                              Playtime: <strong>{formatPlaytime(game.playtimeSeconds)}</strong>
                            </span>
                            <button
                              onClick={(e) => handleFavorite(e, game)}
                              className={`text-lg ${game.isFavorite ? "text-[var(--accent)]" : "text-zinc-600"}`}
                              type="button"
                            >
                              ★
                            </button>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* TAB CONTENT - COLLECTIONS */}
            {activeTab === "Collections" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold">Manage Collections</h3>
                <div className="grid grid-cols-3 gap-6">
                  {library.collections.length === 0 ? (
                    <div className="col-span-3 rounded-3xl border border-dashed border-white/10 p-12 text-center text-zinc-500">
                      No collections created yet. Use the sidebar input to create custom lists.
                    </div>
                  ) : (
                    library.collections.map((col) => (
                      <div key={col.id} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 space-y-2">
                        <h4 className="font-extrabold text-lg text-white">{col.name}</h4>
                        <p className="text-xs text-zinc-500 font-medium">{col.gameCount} games categorized</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT - SETTINGS */}
            {activeTab === "Settings" && profile && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Interface settings */}
                  <CustomizationSettings profile={profile} onUpdateSettings={onUpdateSettings} />

                  {/* Sandbox / Demo Modes Card */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="size-5 text-[var(--accent)] animate-pulse" /> Sandbox Simulator
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Enable Sandbox Mode to inject simulated GOG, Steam, and Epic games complete with covers and metadata. Allows verifying launcher protocol spawning, stats, and platform badges.
                    </p>
                    
                    <label className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950 p-4 cursor-pointer border border-white/5 hover:bg-zinc-900 transition">
                      <div>
                        <span className="text-sm font-semibold block">Demo / Sandbox Mode</span>
                        <span className="text-[10px] text-zinc-500">Injects mock launcher metadata into database.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={sandboxModeActive}
                        onChange={(e) => handleToggleSandbox(e.target.checked)}
                        className="accent-[var(--accent)] size-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Profile settings widget */}
                <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User className="size-5 text-[var(--accent)]" /> Player Profile
                  </h3>

                  <div className="flex items-center gap-4">
                    <div className="grid size-16 place-items-center rounded-full bg-[var(--accent-glow)] border-2 border-[var(--accent)] text-3xl select-none">
                      {avatarValue.startsWith("http") || avatarValue.includes("/") ? (
                        <img src={avatarValue} alt="Avatar" className="size-full rounded-full object-cover" />
                      ) : (
                        avatarValue
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-white">{profile.displayName}</h4>
                      <p className="text-xs text-zinc-500">Logged in player</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="w-full text-center rounded-xl bg-white/10 py-3 text-sm font-semibold hover:bg-white/15 transition"
                    type="button"
                  >
                    Edit Profile Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Engine versioning footer */}
          <footer className="mt-16 flex items-center justify-between text-xs text-zinc-600 border-t border-white/5 pt-6">
            <p>GameVault Desktop Core · Powered by Electron & SQLite</p>
            <p>{appInfo ? `v${appInfo.version}` : "Not connected"}</p>
          </footer>
        </section>
      </div>

      {/* Profile Editor Modal */}
      {isProfileOpen && profile && (
        <ProfileModal
          profile={profile}
          games={library.games}
          onClose={() => setIsProfileOpen(false)}
          onUpdate={onUpdateProfile}
        />
      )}

      {/* Game Details Overlay Page */}
      {selectedGameId !== null && (
        <GameDetailsPage
          game={library.games.find((g) => g.id === selectedGameId)!}
          isRunning={activeGameId === selectedGameId}
          onClose={() => setSelectedGameId(null)}
          onLaunch={handleLaunchGame}
          onUpdateMetadata={handleUpdateMetadata}
        />
      )}
    </main>
  );
}

// Utility playtime formats helper
function formatPlaytime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = (seconds / 3600).toFixed(1);
  return `${hrs}h`;
}
