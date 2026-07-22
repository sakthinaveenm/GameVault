import { useCallback, useState } from "react";
import { useBigPictureControls } from "../hooks/useBigPictureControls";
import { useUiSounds } from "../hooks/useUiSounds";
import type { Game, LibraryState, Profile, Achievement } from "../types/window";
import { GameDetailsPage } from "./GameDetailsPage";
import { CustomizationSettings } from "../components/CustomizationSettings";
import { ProfileModal } from "../components/ProfileModal";
import { BigPictureView } from "../components/BigPictureView";
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
  RefreshCw,
  Clock,
  Tag,
  Save,
  FileText
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
  onUpdateSettings: (
    theme: string,
    accentColor: string,
    startInFullscreen: boolean,
    libraryDirectory: string | null,
    customBgPrimary?: string,
    customBgSecondary?: string,
    customTextPrimary?: string,
    customAccent?: string
  ) => Promise<void>;
}

const navigation = ["Home", "Library", "Collections", "Plugins", "Settings"];

const platformLabels: Record<string, string> = {
  steam: "Steam",
  epic: "Epic Games",
  gog: "GOG Galaxy",
  ubisoft: "Ubisoft",
  ea: "EA App",
  xbox: "Xbox App",
  battlenet: "Battle.net",
  amazon: "Amazon Games",
  itchio: "itch.io",
  emulator: "ROM / Emulator",
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

  // Manual game creation, Drag & Drop, Duplicate detection state
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualPath, setManualPath] = useState("");
  const [manualDev, setManualDev] = useState("");
  const [manualPub, setManualPub] = useState("");
  const [manualGenres, setManualGenres] = useState("");
  const [manualRelDate, setManualRelDate] = useState("");
  const [manualCover, setManualCover] = useState("");

  const [dragOver, setDragOver] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState<Game | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    title: string;
    path: string;
    developer?: string;
    publisher?: string;
    genres?: string;
    releaseDate?: string;
    coverPath?: string;
    description?: string;
  } | null>(null);

  const [showHiddenGames, setShowHiddenGames] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [collectionGameIds, setCollectionGameIds] = useState<number[]>([]);
  const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
  const [smartGenre, setSmartGenre] = useState("");
  const [smartPlatform, setSmartPlatform] = useState("all");
  const [smartDeveloper, setSmartDeveloper] = useState("");

  const sounds = useUiSounds();
  const exitBigPicture = useCallback(() => { void onBigPictureChange(false); }, [onBigPictureChange]);
  useBigPictureControls(isBigPicture, exitBigPicture);

  const normalizedQuery = query.trim().toLocaleLowerCase();

  // Virtual list state
  const [renderedCount, setRenderedCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Keyboard navigation index state
  const [focusedGameIndex, setFocusedGameIndex] = useState<number | null>(null);

  // Custom Toast System state
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "info" | "success" | "warning" }>>([]);

  const showToast = (message: string, type: "info" | "success" | "warning" = "info") => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Undo/Redo settings history state
  const [settingsHistory, setSettingsHistory] = useState<Array<{ theme: string; accentColor: string; startInFullscreen: boolean }>>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Emulator & Roms management state
  const [emulators, setEmulators] = useState<any[]>([]);
  const [newEmuName, setNewEmuName] = useState("");
  const [newEmuPath, setNewEmuPath] = useState("");
  const [newEmuPlatform, setNewEmuPlatform] = useState("snes");
  const [newEmuArgs, setNewEmuArgs] = useState('"[romPath]"');
  const [scanEmuId, setScanEmuId] = useState<number | null>(null);
  const [scanFolder, setScanFolder] = useState("");
  const [scanExtensions, setScanExtensions] = useState(".sfc,.smc");

  // Achievements & Timeline state
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);

  const refreshAchievements = useCallback(async () => {
    try {
      const list = await window.gameVault.getAchievements();
      setAchievements(list);
    } catch (err) {
      console.error("Failed to load achievements:", err);
    }
  }, []);

  const refreshTimeline = useCallback(async () => {
    try {
      const list = await window.gameVault.getLaunchTimeline();
      setTimeline(list);
    } catch (err) {
      console.error("Failed to load timeline:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void refreshAchievements();
    void refreshTimeline();
  }, [refreshAchievements, refreshTimeline]);

  // Plugins state
  const [plugins, setPlugins] = useState<GameVaultPlugin[]>([]);
  const [marketplaceCatalog, setMarketplaceCatalog] = useState<any[]>([
    {
      id: "hltb",
      name: "HowLongToBeat Statistics",
      description: "Displays average completion hours data on game details pages.",
      author: "HLTB Community",
      version: "2.1.0",
      type: "widget",
      config: "{}",
      code: ""
    },
    {
      id: "pro-metrics",
      name: "Gameplay Metrics Card",
      description: "Adds a detailed stats card (speedrun records, completion metrics) to the Home screen.",
      author: "Speedrun Guild",
      version: "1.5.4",
      type: "widget",
      config: "{}",
      code: ""
    }
  ]);

  const refreshPlugins = useCallback(async () => {
    try {
      const list = await window.gameVault.getInstalledPlugins();
      setPlugins(list);
    } catch (err) {
      console.error("Failed to load installed plugins:", err);
    }
  }, []);

  useEffect(() => {
    void refreshPlugins();
  }, [refreshPlugins]);

  // Theme API Dynamic Styles Override
  useEffect(() => {
    const activeTheme = plugins.find((p) => p.enabled && p.type === "theme");
    if (activeTheme) {
      try {
        const config = JSON.parse(activeTheme.config);
        const root = document.documentElement;
        if (config.primary) root.style.setProperty("--bg-primary", config.primary);
        if (config.secondary) root.style.setProperty("--bg-secondary", config.secondary);
        if (config.accent) root.style.setProperty("--accent", config.accent);
        if (config.accentHover) root.style.setProperty("--accent-hover", config.accentHover);
        if (config.text) root.style.setProperty("--text-primary", config.text);
      } catch (err) {
        console.error("Failed to parse theme variables:", err);
      }
    } else {
      if (profile) {
        const root = document.documentElement;
        root.style.setProperty("--bg-primary", profile.customBgPrimary || "#09090b");
        root.style.setProperty("--bg-secondary", profile.customBgSecondary || "#18181b");
        root.style.setProperty("--accent", profile.customAccent || "#a3e635");
        root.style.setProperty("--text-primary", profile.customTextPrimary || "#f4f4f5");
      }
    }
  }, [plugins, profile]);

  const refreshEmulators = useCallback(async () => {
    try {
      const list = await window.gameVault.getEmulators();
      setEmulators(list);
      if (list.length > 0 && scanEmuId === null) {
        setScanEmuId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to load emulators:", err);
    }
  }, [scanEmuId]);

  useEffect(() => {
    if (activeTab === "Settings") {
      void refreshEmulators();
    }
  }, [activeTab, refreshEmulators]);

  // Advanced Filtering state
  const [playtimeFilter, setPlaytimeFilter] = useState<"all" | "short" | "medium" | "long">("all");
  const [selectedGenreFilter, setSelectedGenreFilter] = useState<string>("all");

  // Multi-select state
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);

  // Initialize settings history
  useEffect(() => {
    if (profile) {
      const currentConfig = {
        theme: profile.theme,
        accentColor: profile.accentColor,
        startInFullscreen: profile.startInFullscreen
      };
      if (settingsHistory.length === 0) {
        setSettingsHistory([currentConfig]);
        setHistoryPointer(0);
      }
    }
  }, [profile]);

  const recordSettingsChange = (theme: string, accentColor: string, startInFullscreen: boolean) => {
    const nextConfig = { theme, accentColor, startInFullscreen };
    const truncatedHistory = settingsHistory.slice(0, historyPointer + 1);
    setSettingsHistory([...truncatedHistory, nextConfig]);
    setHistoryPointer(truncatedHistory.length);
  };

  const handleUpdateSettingsWithHistory = async (
    theme: string,
    accentColor: string,
    startInFullscreen: boolean,
    libraryDir: string | null,
    steamDir: string | null
  ) => {
    recordSettingsChange(theme, accentColor, startInFullscreen);
    await onUpdateSettings(theme, accentColor, startInFullscreen, libraryDir, steamDir);
    showToast("Settings updated", "success");
  };

  // Keyboard navigation & resets
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search with '/'
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder="Search your library..."]') as HTMLInputElement;
        searchInput?.focus();
        return;
      }

      // Escape key resets
      if (e.key === "Escape") {
        setQuery("");
        setSelectedCollectionId(null);
        setFavoritesOnly(false);
        setSelectedPlatform("all");
        setPlaytimeFilter("all");
        setSelectedGenreFilter("all");
        setFocusedGameIndex(null);
        setSelectedGameIds([]);
        setIsManualAddOpen(false);
        setIsProfileOpen(false);
        setEditingCollectionId(null);
        return;
      }

      // Arrow navigation
      if (!isProfileOpen && !isManualAddOpen && !selectedGameId && editingCollectionId === null && sortedGames.length > 0) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setFocusedGameIndex((prev) => (prev === null ? 0 : Math.min(prev + 1, sortedGames.length - 1)));
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setFocusedGameIndex((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedGameIndex((prev) => (prev === null ? 0 : Math.min(prev + 4, sortedGames.length - 1)));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setFocusedGameIndex((prev) => (prev === null ? 0 : Math.max(prev - 4, 0)));
        } else if (e.key === "Enter" && focusedGameIndex !== null) {
          e.preventDefault();
          setSelectedGameId(sortedGames[focusedGameIndex].id);
        }
      }

      // Undo settings: Cmd+Z or Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (historyPointer > 0) {
          const prevIndex = historyPointer - 1;
          setHistoryPointer(prevIndex);
          const config = settingsHistory[prevIndex];
          void onUpdateSettings(
            config.theme,
            config.accentColor,
            config.startInFullscreen,
            profile?.libraryDirectory || null,
            profile?.steamDirectory || null
          );
          showToast("Undone settings change", "info");
        }
      }

      // Redo settings: Cmd+Shift+Z or Ctrl+Shift+Z or Cmd+Y or Ctrl+Y
      if (((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) || ((e.metaKey || e.ctrlKey) && e.key === "y")) {
        e.preventDefault();
        if (historyPointer < settingsHistory.length - 1) {
          const nextIndex = historyPointer + 1;
          setHistoryPointer(nextIndex);
          const config = settingsHistory[nextIndex];
          void onUpdateSettings(
            config.theme,
            config.accentColor,
            config.startInFullscreen,
            profile?.libraryDirectory || null,
            profile?.steamDirectory || null
          );
          showToast("Redone settings change", "info");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sortedGames, focusedGameIndex, isProfileOpen, isManualAddOpen, selectedGameId, editingCollectionId, settingsHistory, historyPointer, profile]);

  // Virtual list pagination effect
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRenderedCount((prev) => Math.min(prev + 24, sortedGames.length));
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [sortedGames.length]);

  // Reset pagination on changes
  useEffect(() => {
    setRenderedCount(24);
    setFocusedGameIndex(null);
  }, [query, selectedPlatform, selectedCollectionId, sortBy, favoritesOnly, playtimeFilter, selectedGenreFilter]);

  const handleCollectionClick = async (collectionId: number) => {
    setSelectedCollectionId(collectionId);
    setSelectedPlatform("all");
    setActiveTab("Library");
    sounds.playConfirm();

    const collection = library.collections.find((c) => c.id === collectionId);
    if (collection && !collection.rules) {
      const ids = await window.gameVault.getCollectionGames(collectionId);
      setCollectionGameIds(ids);
    }
  };

  const matchSmartRules = (game: Game, rulesStr?: string | null): boolean => {
    if (!rulesStr) return true;
    try {
      const rules = JSON.parse(rulesStr);
      if (!Array.isArray(rules) || rules.length === 0) return true;
      for (const rule of rules) {
        const { field, value } = rule;
        if (!value) continue;
        const gameValue = (game as any)[field];
        if (!gameValue) return false;
        if (!gameValue.toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
      }
      return true;
    } catch {
      return true;
    }
  };

  const checkDuplicate = (title: string, path: string) => {
    const duplicate = library.games.find(
      (g) =>
        (path && g.executablePath === path) ||
        g.title.toLowerCase() === title.toLowerCase()
    );
    return duplicate;
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = manualTitle.trim();
    if (!title) return;

    const path = manualPath.trim() || `manual://game-${Date.now()}`;

    const newGame = {
      title,
      path,
      developer: manualDev.trim(),
      publisher: manualPub.trim(),
      genres: manualGenres.trim(),
      releaseDate: manualRelDate.trim(),
      coverPath: manualCover.trim(),
      description: ""
    };

    const duplicate = checkDuplicate(title, manualPath.trim());
    if (duplicate) {
      setPendingImport(newGame);
      setDuplicateConfirm(duplicate);
    } else {
      await window.gameVault.addGame(title, path, "local", {
        developer: manualDev.trim(),
        publisher: manualPub.trim(),
        genres: manualGenres.trim(),
        releaseDate: manualRelDate.trim(),
        coverPath: manualCover.trim()
      });
      await refreshLibrary();
      setManualTitle("");
      setManualPath("");
      setManualDev("");
      setManualPub("");
      setManualGenres("");
      setManualRelDate("");
      setManualCover("");
      setIsManualAddOpen(false);
      sounds.playConfirm();
      setMessage(`Added "${title}" to library.`);
    }
  };

  const handleRemoveGame = async (gameId: number) => {
    await window.gameVault.deleteGame(gameId);
    await refreshLibrary();
    setSelectedGameId(null);
    sounds.playConfirm();
    setMessage("Game removed from library.");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const path = file.path;
    const name = file.name.replace(/\.[^/.]+$/, "");

    const newGame = {
      title: name,
      path: path,
      developer: "",
      publisher: "",
      genres: "",
      releaseDate: "",
      coverPath: "",
      description: ""
    };

    const duplicate = checkDuplicate(name, path);
    if (duplicate) {
      setPendingImport(newGame);
      setDuplicateConfirm(duplicate);
    } else {
      await window.gameVault.addGame(name, path, "local", {});
      await refreshLibrary();
      sounds.playConfirm();
      setMessage(`Imported "${name}" successfully.`);
    }
  };

  const allGenres = Array.from(
    new Set(
      library.games
        .map((g) => g.genres)
        .filter(Boolean)
        .flatMap((g) => g!.split(",").map((x) => x.trim()))
    )
  ).sort();

  // Filter games based on search query, favorites, platform filters, hidden status, collections, playtime, and genre filters
  const filteredGames = library.games.filter((game) => {
    if (favoritesOnly && !game.isFavorite) return false;
    if (selectedPlatform !== "all" && game.platform !== selectedPlatform) return false;
    
    // Fuzzy token matching search
    if (normalizedQuery) {
      const tokens = normalizedQuery.split(/\s+/);
      const searchString = `${game.title} ${game.developer || ""} ${game.publisher || ""} ${game.genres || ""}`.toLowerCase();
      const matchesAll = tokens.every((token) => searchString.includes(token));
      if (!matchesAll) return false;
    }

    if (!showHiddenGames && game.isHidden) return false;
    
    // Playtime filtering
    if (playtimeFilter !== "all") {
      const hrs = game.playtimeSeconds / 3600;
      if (playtimeFilter === "short" && hrs >= 10) return false;
      if (playtimeFilter === "medium" && (hrs < 10 || hrs > 100)) return false;
      if (playtimeFilter === "long" && hrs <= 100) return false;
    }

    // Genre filtering
    if (selectedGenreFilter !== "all") {
      if (!game.genres || !game.genres.toLowerCase().includes(selectedGenreFilter.toLowerCase())) return false;
    }

    if (selectedCollectionId !== null) {
      const collection = library.collections.find((c) => c.id === selectedCollectionId);
      if (collection) {
        if (collection.rules) {
          return matchSmartRules(game, collection.rules);
        } else {
          return collectionGameIds.includes(game.id);
        }
      }
    }
    return true;
  });

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

  const visibleGames = sortedGames.slice(0, renderedCount);

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
    void refreshAchievements();
    void refreshTimeline();
    void refreshPlugins();
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

  async function handleSelectLibraryDirectory() {
    try {
      const selected = await window.gameVault.selectDirectory();
      if (selected) {
        await onUpdateSettings(profile!.theme, profile!.accentColor, profile!.startInFullscreen, selected);
        setMessage(`Default library directory set to: ${selected}`);
        sounds.playConfirm();
      }
    } catch (err: any) {
      setMessage("Failed to select folder: " + (err.message || err));
    }
  }

  async function handleClearLibraryDirectory() {
    try {
      await onUpdateSettings(profile!.theme, profile!.accentColor, profile!.startInFullscreen, null);
      setMessage("Default library directory cleared.");
      sounds.playConfirm();
    } catch (err: any) {
      setMessage("Failed to clear folder: " + (err.message || err));
    }
  }

  async function handleScanConfiguredDirectory() {
    if (!profile?.libraryDirectory) return;
    setMessage(`Scanning library folder: ${profile.libraryDirectory}...`);
    try {
      const res = await window.gameVault.scanConfiguredDirectory(profile.libraryDirectory);
      await refreshLibrary();
      setMessage(
        res.count > 0
          ? `Scanning completed. Discovered and imported ${res.count} new local games.`
          : "Scanning completed. No new local games found."
      );
      sounds.playConfirm();
    } catch (err: any) {
      setMessage("Failed to scan directory: " + (err.message || err));
    }
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

  if (isBigPicture) {
    return (
      <BigPictureView
        library={library}
        profile={profile}
        activeGameId={activeGameId}
        onBigPictureChange={onBigPictureChange}
        onLibraryUpdated={onLibraryUpdated}
        onUpdateProfile={onUpdateProfile}
        onUpdateSettings={onUpdateSettings}
      />
    );
  }

  return (
    <main
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen bg-zinc-950 text-zinc-100 relative ${isBigPicture ? "bg-[radial-gradient(circle_at_top,#1c2317,#09090b_60%)]" : ""}`}
    >
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
                    setSelectedCollectionId(null);
                    sounds.playConfirm();
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm transition focus:outline-2 focus:outline-offset-2 focus:outline-[var(--accent)] ${
                    activeTab === item && selectedPlatform === "all" && selectedCollectionId === null
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
                  { id: "ubisoft", name: "Ubisoft Connect", count: library.games.filter((g) => g.platform === "ubisoft").length },
                  { id: "ea", name: "EA App", count: library.games.filter((g) => g.platform === "ea").length },
                  { id: "xbox", name: "Xbox App", count: library.games.filter((g) => g.platform === "xbox").length },
                  { id: "battlenet", name: "Battle.net", count: library.games.filter((g) => g.platform === "battlenet").length },
                  { id: "amazon", name: "Amazon Games", count: library.games.filter((g) => g.platform === "amazon").length },
                  { id: "itchio", name: "itch.io", count: library.games.filter((g) => g.platform === "itchio").length },
                  { id: "emulator", name: "ROMs / Emulated", count: library.games.filter((g) => g.platform === "emulator").length },
                  { id: "local", name: "Local Executables", count: library.games.filter((g) => g.platform === "local").length }
                ].map((plat) => (
                  <li key={plat.id}>
                    <button
                      onClick={() => {
                        setSelectedPlatform(plat.id);
                        setActiveTab("Library");
                        setSelectedCollectionId(null);
                        sounds.playConfirm();
                      }}
                      className={`w-full flex justify-between items-center rounded-xl px-4 py-2 text-left text-xs transition ${
                        selectedPlatform === plat.id && activeTab === "Library" && selectedCollectionId === null
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
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none placeholder:text-zinc-600 focus:border-[var(--accent)] text-white"
                  onChange={(event) => setCollectionName(event.target.value)}
                  placeholder="New collection"
                  value={collectionName}
                />
                <button
                  {...focusProps}
                  className="rounded-xl bg-white/10 px-3 text-sm hover:bg-white/15 disabled:opacity-50 font-bold text-white"
                  disabled={isCreatingCollection}
                  type="submit"
                >
                  +
                </button>
              </form>
              <ul className="space-y-1">
                {[...library.collections]
                  .sort((a, b) => {
                    if (a.isFavorite && !b.isFavorite) return -1;
                    if (!a.isFavorite && b.isFavorite) return 1;
                    return a.name.localeCompare(b.name);
                  })
                  .map((collection) => (
                    <li
                      className={`flex justify-between items-center rounded-xl px-3 py-1.5 text-xs transition ${
                        selectedCollectionId === collection.id && activeTab === "Library"
                          ? "bg-white/10 font-bold text-white"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      }`}
                      key={collection.id}
                    >
                      <div className="flex items-center gap-2 truncate flex-1">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await window.gameVault.setCollectionFavorite(collection.id, !collection.isFavorite);
                            await refreshLibrary();
                            sounds.playConfirm();
                          }}
                          className={`text-sm leading-none focus:outline-none transition-colors ${
                            collection.isFavorite ? "text-[var(--accent)]" : "text-zinc-600 hover:text-zinc-400"
                          }`}
                        >
                          ★
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCollectionClick(collection.id)}
                          className="truncate text-left flex-1"
                        >
                          {collection.name}
                          {collection.rules && (
                            <span className="ml-1 rounded bg-[var(--accent-glow)] px-1 py-0.5 text-[8px] text-[var(--accent)] font-bold">Smart</span>
                          )}
                        </button>
                      </div>
                      <span className="rounded bg-zinc-950/60 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 shrink-0">
                        {collection.gameCount}
                      </span>
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

                {/* Showcase Widget */}
                <div className="grid grid-cols-2 gap-8">
                  {/* Pinned Games Showcase */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Heart className="size-4 text-[var(--accent)]" /> Pinned Games Showcase
                    </h3>
                    {library.games.filter((g) => g.showcased).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/5 py-12 text-center text-zinc-500 text-xs">
                        No games pinned. Click "Showcase Game" inside game details to feature titles here!
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {library.games.filter((g) => g.showcased).map((game) => (
                          <div key={game.id} className="relative rounded-xl overflow-hidden bg-zinc-950 border border-white/5 aspect-[3/4] group">
                            {game.coverPath ? (
                              <img src={game.coverPath} alt={game.title} className="size-full object-cover" />
                            ) : (
                              <div className="size-full flex items-center justify-center text-2xl">🎮</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-2 opacity-0 group-hover:opacity-100 transition">
                              <span className="text-[10px] font-bold text-white block truncate">{game.title}</span>
                              <span className="text-[8px] text-[var(--accent)] font-mono">{formatPlaytime(game.playtimeSeconds)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pinned Achievements Showcase */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Award className="size-4 text-[var(--accent)]" /> Pinned Trophies Showcase
                    </h3>
                    {achievements.filter((a) => a.showcased).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/5 py-12 text-center text-zinc-500 text-xs">
                        No trophies pinned. Pin unlocked achievements to show them off!
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {achievements.filter((a) => a.showcased).map((ach) => (
                          <div key={ach.id} className="rounded-xl bg-zinc-950 border border-white/5 p-3 flex flex-col items-center justify-center text-center space-y-1">
                            <span className="text-2xl">🏆</span>
                            <span className="text-[9px] font-bold text-white block truncate w-full">{ach.title}</span>
                            <span className="text-[8px] text-zinc-500 block truncate w-full">{ach.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics & Yearly Gaming Recap */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Genre Stats */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-300">Top Genres</h3>
                    <div className="space-y-2">
                      {Array.from(
                        new Set(
                          library.games
                            .map((g) => g.genres)
                            .filter(Boolean)
                            .flatMap((g) => g!.split(",").map((x) => x.trim()))
                        )
                      )
                        .slice(0, 4)
                        .map((genre) => {
                          const count = library.games.filter((g) => g.genres && g.genres.includes(genre)).length;
                          const pct = Math.round((count / Math.max(library.games.length, 1)) * 100);
                          return (
                            <div key={genre} className="space-y-1">
                              <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                                <span>{genre}</span>
                                <span>{count} game{count === 1 ? "" : "s"}</span>
                              </div>
                              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Platform Stats */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-300">Platforms Ratio</h3>
                    <div className="space-y-2">
                      {["steam", "epic", "gog", "local", "emulator"].map((plat) => {
                        const count = library.games.filter((g) => g.platform === plat).length;
                        if (count === 0) return null;
                        const pct = Math.round((count / library.games.length) * 100);
                        return (
                          <div key={plat} className="space-y-1">
                            <div className="flex justify-between text-[10px] text-zinc-400 font-bold">
                              <span>{platformLabels[plat] || plat}</span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Trophies completion summary */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-zinc-300">Achievements Progress</h3>
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 grid place-items-center bg-zinc-950 border border-white/5 rounded-full">
                        <span className="text-xs font-black text-white">
                          {Math.round(
                            (achievements.filter((a) => a.unlocked).length / Math.max(achievements.length, 1)) * 100
                          )}%
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="text-zinc-400">Total Unlocked: <strong>{achievements.filter((a) => a.unlocked).length}</strong></p>
                        <p className="text-zinc-500">Locked: <strong>{achievements.filter((a) => !a.unlocked).length}</strong></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dynamic Widget API Injected Component: Pro Metrics Widget */}
                {plugins.some((p) => p.id === "pro-metrics" && p.enabled) && (
                  <div className="rounded-3xl border border-[var(--accent)]/20 bg-[var(--accent-glow)] p-6 space-y-4">
                    <h3 className="text-base font-bold flex items-center gap-2">
                      <Sparkles className="size-5 text-[var(--accent)]" /> Pro Gaming Metrics Hub (Active Extension)
                    </h3>
                    <div className="grid grid-cols-4 gap-4 text-xs">
                      <div className="bg-zinc-950 p-4 rounded-xl space-y-1">
                        <span className="text-zinc-500 uppercase font-bold text-[9px]">Speedruns Completed</span>
                        <p className="text-lg font-black text-white">12 Runs</p>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl space-y-1">
                        <span className="text-zinc-500 uppercase font-bold text-[9px]">Completion Rate</span>
                        <p className="text-lg font-black text-green-400">89.4%</p>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl space-y-1">
                        <span className="text-zinc-500 uppercase font-bold text-[9px]">Total Trophies Earned</span>
                        <p className="text-lg font-black text-yellow-400">32 Gold</p>
                      </div>
                      <div className="bg-zinc-950 p-4 rounded-xl space-y-1">
                        <span className="text-zinc-500 uppercase font-bold text-[9px]">Rank Status</span>
                        <p className="text-lg font-black text-[var(--accent)]">Grandmaster</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Gaming timeline feed log */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <Clock className="size-4 text-[var(--accent)]" /> Gaming Timeline History
                  </h3>
                  {timeline.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-white/10 p-12 text-center text-zinc-500 text-xs">
                      No gaming session logs. Launch any game from your library to start tracking logs!
                    </div>
                  ) : (
                    <div className="border-l border-white/10 ml-3 pl-6 space-y-6">
                      {timeline.slice(0, 8).map((log, idx) => (
                        <div key={log.id} className="relative">
                          {/* Timeline dot */}
                          <div className="absolute -left-[30px] top-1.5 size-2 rounded-full bg-[var(--accent)] border border-zinc-950 shadow-md animate-pulse" />
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <span className="text-xs font-bold text-white block">{log.gameTitle}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(log.launchedAt).toLocaleString()}</span>
                            </div>
                            <span className="text-xs font-semibold text-zinc-400 font-mono">
                              Played: {formatPlaytime(log.durationSeconds)}
                            </span>
                          </div>
                        </div>
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

                  {/* Playtime Filter */}
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1">
                    <Clock className="size-4 text-zinc-500" />
                    <select
                      className="bg-transparent text-sm py-1.5 outline-none text-zinc-300 font-semibold cursor-pointer border-none"
                      value={playtimeFilter}
                      onChange={(e) => setPlaytimeFilter(e.target.value as any)}
                    >
                      <option value="all" className="bg-zinc-900">All Playtimes</option>
                      <option value="short" className="bg-zinc-900">&lt; 10 Hours</option>
                      <option value="medium" className="bg-zinc-900">10 - 100 Hours</option>
                      <option value="long" className="bg-zinc-900">&gt; 100 Hours</option>
                    </select>
                  </div>

                  {/* Genre Filter */}
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900 px-3 py-1">
                    <Tag className="size-4 text-zinc-500" />
                    <select
                      className="bg-transparent text-sm py-1.5 outline-none text-zinc-300 font-semibold cursor-pointer border-none"
                      value={selectedGenreFilter}
                      onChange={(e) => setSelectedGenreFilter(e.target.value)}
                    >
                      <option value="all" className="bg-zinc-900">All Genres</option>
                      {allGenres.map((genre) => (
                        <option key={genre} value={genre} className="bg-zinc-900">{genre}</option>
                      ))}
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

                  {/* Add Game Manually Button */}
                  <button
                    {...focusProps}
                    className="flex items-center gap-2 rounded-xl bg-zinc-900 border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-zinc-800 text-zinc-300 transition"
                    onClick={() => setIsManualAddOpen(true)}
                    type="button"
                  >
                    <FolderPlus className="size-4" /> Add Game
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
                  <div className="space-y-6">
                    <ul className={`grid gap-5 ${isBigPicture ? "grid-cols-4" : "grid-cols-3"}`}>
                      {visibleGames.map((game, idx) => (
                        <li key={game.id}>
                          <button
                            {...focusProps}
                            className={`w-full flex flex-col rounded-3xl border overflow-hidden text-left hover:scale-[1.03] focus:scale-[1.03] focus:outline-none transition group relative ${
                              focusedGameIndex === idx
                                ? "border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-white/[0.04]"
                                : "border-white/10 bg-white/[0.02] hover:border-[var(--accent)]"
                            }`}
                            onClick={() => {
                              if (selectedGameIds.length > 0) {
                                // In selection mode, clicking toggles selection rather than details
                                if (selectedGameIds.includes(game.id)) {
                                  setSelectedGameIds((prev) => prev.filter((id) => id !== game.id));
                                } else {
                                  setSelectedGameIds((prev) => [...prev, game.id]);
                                }
                              } else {
                                setSelectedGameId(game.id);
                              }
                            }}
                            type="button"
                          >
                            {/* Platform Badge overlay */}
                            <div className="absolute top-3 left-3 z-10">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider badge-${game.platform}`}>
                                {platformLabels[game.platform]}
                              </span>
                            </div>

                            {/* Multi-select checkmark */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={`absolute top-3 right-3 z-20 transition-opacity duration-200 ${
                                selectedGameIds.length > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedGameIds.includes(game.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGameIds((prev) => [...prev, game.id]);
                                  } else {
                                    setSelectedGameIds((prev) => prev.filter((id) => id !== game.id));
                                  }
                                }}
                                className="size-4 cursor-pointer accent-[var(--accent)]"
                              />
                            </div>

                            {/* Card cover image */}
                            <div className="h-44 w-full bg-zinc-900 relative flex items-center justify-center text-4xl select-none">
                              {game.coverPath && (game.coverPath.startsWith("http") || game.coverPath.includes("/")) ? (
                                <img src={game.coverPath} alt={game.title} loading="lazy" className="size-full object-cover" />
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
                    <div ref={sentinelRef} className="h-10 w-full flex items-center justify-center text-xs text-zinc-600 font-medium">
                      {renderedCount < sortedGames.length ? "Loading more games..." : `Showing all ${sortedGames.length} games`}
                    </div>
                  </div>
                ) : (
                  /* LIST VIEW */
                  <div className="space-y-6">
                    <ul className="border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/10 bg-white/[0.01]">
                      {visibleGames.map((game, idx) => (
                        <li key={game.id}>
                          <div
                            className={`w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.04] text-left transition ${
                              focusedGameIndex === idx ? "bg-white/[0.06] border-l-4 border-l-[var(--accent)]" : "border-l-4 border-l-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedGameIds.includes(game.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedGameIds((prev) => [...prev, game.id]);
                                  } else {
                                    setSelectedGameIds((prev) => prev.filter((id) => id !== game.id));
                                  }
                                }}
                                className="size-4 cursor-pointer accent-[var(--accent)] shrink-0 mr-1"
                              />
                              <button
                                onClick={() => {
                                  if (selectedGameIds.length > 0) {
                                    if (selectedGameIds.includes(game.id)) {
                                      setSelectedGameIds((prev) => prev.filter((id) => id !== game.id));
                                    } else {
                                      setSelectedGameIds((prev) => [...prev, game.id]);
                                    }
                                  } else {
                                    setSelectedGameId(game.id);
                                  }
                                }}
                                className="flex items-center gap-4 min-w-0 text-left flex-1"
                              >
                                <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider badge-${game.platform} shrink-0`}>
                                  {platformLabels[game.platform]}
                                </span>
                                <div className="truncate">
                                  <p className="font-bold text-white truncate">{game.title}</p>
                                  <p className="text-[10px] text-zinc-500 truncate">{game.executablePath}</p>
                                </div>
                              </button>
                            </div>

                            <div className="flex items-center gap-6 shrink-0">
                              <span className="text-xs text-zinc-400 font-mono">
                                Playtime: <strong>{formatPlaytime(game.playtimeSeconds)}</strong>
                              </span>
                              <button
                                onClick={(e) => handleFavorite(e, game)}
                                className={`text-lg ${game.isFavorite ? "text-[var(--accent)]" : "text-zinc-600 hover:text-zinc-400"}`}
                                type="button"
                              >
                                ★
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div ref={sentinelRef} className="h-10 w-full flex items-center justify-center text-xs text-zinc-600 font-medium">
                      {renderedCount < sortedGames.length ? "Loading more games..." : `Showing all ${sortedGames.length} games`}
                    </div>
                  </div>
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
                    library.collections.map((col) => {
                      let parsedRules = [];
                      if (col.rules) {
                        try {
                          parsedRules = JSON.parse(col.rules);
                        } catch {}
                      }

                      return (
                        <div key={col.id} className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-extrabold text-lg text-white">{col.name}</h4>
                              <button
                                type="button"
                                onClick={async () => {
                                  await window.gameVault.setCollectionFavorite(col.id, !col.isFavorite);
                                  await refreshLibrary();
                                  sounds.playConfirm();
                                }}
                                className={`text-sm leading-none focus:outline-none transition-colors ${
                                  col.isFavorite ? "text-[var(--accent)]" : "text-zinc-600 hover:text-zinc-400"
                                }`}
                              >
                                ★
                              </button>
                            </div>
                            <p className="text-xs text-zinc-500 font-medium">{col.gameCount} games categorized</p>
                            {parsedRules.length > 0 && (
                              <div className="mt-2 space-y-1">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Smart Rules:</p>
                                <div className="flex flex-wrap gap-1">
                                  {parsedRules.map((rule: any, idx: number) => (
                                    <span key={idx} className="rounded bg-zinc-900 border border-white/5 px-2 py-0.5 text-[9px] text-zinc-400">
                                      {rule.field === "genres" ? "Genre" : rule.field === "platform" ? "Platform" : "Dev"}: {rule.value}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleCollectionClick(col.id)}
                              className="flex-1 text-center rounded-xl bg-white/5 py-2 text-xs font-semibold hover:bg-white/10 text-white transition"
                            >
                              View Games
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCollectionId(col.id);
                                let genreVal = "";
                                let platVal = "all";
                                let devVal = "";
                                if (col.rules) {
                                  try {
                                    const rules = JSON.parse(col.rules);
                                    for (const r of rules) {
                                      if (r.field === "genres") genreVal = r.value;
                                      if (r.field === "platform") platVal = r.value;
                                      if (r.field === "developer") devVal = r.value;
                                    }
                                  } catch {}
                                }
                                setSmartGenre(genreVal);
                                setSmartPlatform(platVal);
                                setSmartDeveloper(devVal);
                                sounds.playConfirm();
                              }}
                              className="text-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 py-2 px-3 text-xs font-semibold hover:bg-[var(--accent)]/20 text-[var(--accent)] transition"
                            >
                              Edit Rules
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT - SETTINGS */}
            {activeTab === "Settings" && profile && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Interface settings */}
                  <CustomizationSettings profile={profile} onUpdateSettings={handleUpdateSettingsWithHistory} />

                  {/* Library Preferences Card */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <LibIcon className="size-5 text-[var(--accent)]" /> Library Preferences
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Configure visibility and options for your local games library.
                    </p>
                    
                    <label className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950 p-4 cursor-pointer border border-white/5 hover:bg-zinc-900 transition">
                      <div>
                        <span className="text-sm font-semibold block">Show Hidden Games</span>
                        <span className="text-[10px] text-zinc-500">Display games marked as hidden in your library pages.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={showHiddenGames}
                        onChange={(e) => setShowHiddenGames(e.target.checked)}
                        className="accent-[var(--accent)] size-4 cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Library Backup & Restoration Card */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Save className="size-5 text-[var(--accent)]" /> Backup & Restoration
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Export configurations or perform full database backups to prevent data loss.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={async () => {
                          const res = await window.gameVault.exportSettings();
                          if (res) showToast("Configurations exported", "success");
                        }}
                        className="rounded-xl bg-zinc-950 border border-white/5 p-3 hover:bg-zinc-900 text-left transition"
                        type="button"
                      >
                        <span className="text-xs font-bold block text-white">Export Settings</span>
                        <span className="text-[9px] text-zinc-500">Save collections and profile configs.</span>
                      </button>
                      <button
                        onClick={async () => {
                          const res = await window.gameVault.importSettings();
                          if (res) {
                            await refreshLibrary();
                            showToast("Configurations imported", "success");
                          }
                        }}
                        className="rounded-xl bg-zinc-950 border border-white/5 p-3 hover:bg-zinc-900 text-left transition"
                        type="button"
                      >
                        <span className="text-xs font-bold block text-white">Import Settings</span>
                        <span className="text-[9px] text-zinc-500">Load profile configs from file.</span>
                      </button>
                      <button
                        onClick={async () => {
                          const res = await window.gameVault.createDbBackup();
                          if (res) showToast("Database backup created", "success");
                        }}
                        className="rounded-xl bg-zinc-950 border border-white/5 p-3 hover:bg-zinc-900 text-left transition"
                        type="button"
                      >
                        <span className="text-xs font-bold block text-white">Create DB Backup</span>
                        <span className="text-[9px] text-zinc-500">Copy database file to custom path.</span>
                      </button>
                      <button
                        onClick={async () => {
                          const confirmed = confirm("Restoring database backup will overwrite existing games database and restart the application. Proceed?");
                          if (!confirmed) return;
                          await window.gameVault.restoreDbBackup();
                        }}
                        className="rounded-xl bg-red-950/20 border border-red-500/20 p-3 hover:bg-red-950/40 text-left transition"
                        type="button"
                      >
                        <span className="text-xs font-bold block text-red-200">Restore DB Backup</span>
                        <span className="text-[9px] text-red-400">Restore SQLite db (app restarts).</span>
                      </button>
                    </div>
                  </div>

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

                <div className="space-y-6">
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

                  {/* Library Folders widget */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <FolderPlus className="size-5 text-[var(--accent)]" /> Library Directory
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Configure a default library folder to scan for local executables and game files.
                    </p>

                    <div className="rounded-2xl bg-zinc-950 p-4 border border-white/5 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={profile.libraryDirectory || "No directory configured"}
                          className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs outline-none truncate text-zinc-500 font-mono"
                        />
                        <button
                          onClick={handleSelectLibraryDirectory}
                          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/15 transition text-white"
                          type="button"
                        >
                          Browse
                        </button>
                      </div>

                      {profile.libraryDirectory && (
                        <div className="flex gap-2">
                          <button
                            onClick={handleScanConfiguredDirectory}
                            className="flex-1 rounded-xl bg-[var(--accent)] py-2 text-xs font-black text-zinc-950 hover:bg-[var(--accent-hover)] transition"
                            type="button"
                          >
                            Scan Folder
                          </button>
                          <button
                            onClick={handleClearLibraryDirectory}
                            className="rounded-xl bg-red-950/40 border border-red-500/20 px-3 py-2 text-xs font-bold hover:bg-red-950 transition text-red-200"
                            type="button"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Steam Directory widget */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Settings className="size-5 text-[var(--accent)]" /> Steam Directory
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Configure a custom Steam installation folder (containing 'steamapps') if not detected automatically.
                    </p>

                    <div className="rounded-2xl bg-zinc-950 p-4 border border-white/5 space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={profile.steamDirectory || "Default Steam Directory"}
                          className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-xs outline-none truncate text-zinc-500 font-mono"
                        />
                        <button
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
                        <div className="flex gap-2">
                          <button
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
                            className="w-full rounded-xl bg-red-950/40 border border-red-500/20 py-2 text-xs font-bold hover:bg-red-950 transition text-red-200"
                            type="button"
                          >
                            Clear Custom Steam Path
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emulator Profiles & ROMs Import Card */}
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Clock className="size-5 text-[var(--accent)]" /> Emulators Manager
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Add emulator paths, configure launch profiles, and import ROM collections.
                    </p>

                    {/* Add Emulator Profile form */}
                    <div className="rounded-2xl bg-zinc-950 p-4 border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Add Emulator Profile</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Name</label>
                          <input
                            type="text"
                            placeholder="e.g. RetroArch"
                            value={newEmuName}
                            onChange={(e) => setNewEmuName(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent)]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Console Platform</label>
                          <select
                            value={newEmuPlatform}
                            onChange={(e) => {
                              setNewEmuPlatform(e.target.value);
                              if (e.target.value === "snes") {
                                setNewEmuArgs('"[romPath]"');
                                setScanExtensions(".sfc,.smc");
                              } else if (e.target.value === "nes") {
                                setNewEmuArgs('"[romPath]"');
                                setScanExtensions(".nes");
                              } else if (e.target.value === "n64") {
                                setNewEmuArgs('"[romPath]"');
                                setScanExtensions(".z64,.n64");
                              } else if (e.target.value === "gameboy") {
                                setNewEmuArgs('"[romPath]"');
                                setScanExtensions(".gb,.gbc,.gba");
                              }
                            }}
                            className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="snes">Super Nintendo (SNES)</option>
                            <option value="nes">Nintendo (NES)</option>
                            <option value="n64">Nintendo 64</option>
                            <option value="gameboy">Game Boy / Color / Advance</option>
                            <option value="other">Other Console</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Executable Path</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="/Applications/RetroArch.app or C:\Emulators\RetroArch.exe"
                            value={newEmuPath}
                            onChange={(e) => setNewEmuPath(e.target.value)}
                            className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent)] font-mono"
                          />
                          <button
                            onClick={async () => {
                              const path = await window.gameVault.selectDirectory();
                              if (path) setNewEmuPath(path);
                            }}
                            className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15 transition text-white"
                            type="button"
                          >
                            Browse
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Default Arguments</label>
                        <input
                          type="text"
                          placeholder='e.g. -f "[romPath]"'
                          value={newEmuArgs}
                          onChange={(e) => setNewEmuArgs(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent)] font-mono"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (!newEmuName.trim() || !newEmuPath.trim()) {
                            showToast("Please provide name and path.", "warning");
                            return;
                          }
                          await window.gameVault.addEmulator(newEmuName.trim(), newEmuPath.trim(), newEmuPlatform, newEmuArgs);
                          setNewEmuName("");
                          setNewEmuPath("");
                          await refreshEmulators();
                          showToast("Emulator profile added", "success");
                          sounds.playConfirm();
                        }}
                        className="w-full rounded-lg bg-[var(--accent)] py-2 text-xs font-black text-zinc-950 hover:bg-[var(--accent-hover)] transition"
                        type="button"
                      >
                        Save Emulator
                      </button>
                    </div>

                    {/* Installed Emulators List */}
                    {emulators.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Configured Emulators</h4>
                        <div className="space-y-2">
                          {emulators.map((emu) => (
                            <div key={emu.id} className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950 p-3 border border-white/5 font-mono">
                              <div>
                                <span className="text-xs font-bold block text-white font-sans">{emu.name} ({emu.platform.toUpperCase()})</span>
                                <span className="text-[9px] text-zinc-500 block truncate max-w-xs">{emu.executablePath}</span>
                              </div>
                              <button
                                onClick={async () => {
                                  await window.gameVault.deleteEmulator(emu.id);
                                  await refreshEmulators();
                                  await refreshLibrary();
                                  showToast("Emulator profile removed", "warning");
                                  sounds.playConfirm();
                                }}
                                className="rounded-lg bg-red-950/40 border border-red-500/20 px-3 py-1 text-xs font-bold text-red-200 hover:bg-red-950 transition font-sans"
                                type="button"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ROMs Scanner Section */}
                    {emulators.length > 0 && (
                      <div className="rounded-2xl bg-zinc-950 p-4 border border-white/5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Scan Rom Folder</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] text-zinc-500 font-semibold block mb-1">Target Emulator</label>
                            <select
                              value={scanEmuId || ""}
                              onChange={(e) => setScanEmuId(Number(e.target.value))}
                              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none cursor-pointer"
                            >
                              {emulators.map((emu) => (
                                <option key={emu.id} value={emu.id}>{emu.name} ({emu.platform.toUpperCase()})</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-zinc-500 font-semibold block mb-1">File Extensions (comma separated)</label>
                            <input
                              type="text"
                              value={scanExtensions}
                              onChange={(e) => setScanExtensions(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent)] font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-zinc-500 font-semibold block mb-1">ROMs Folder Directory</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="No folder selected"
                              readOnly
                              value={scanFolder}
                              className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-500 outline-none truncate font-mono"
                            />
                            <button
                              onClick={async () => {
                                const folder = await window.gameVault.selectDirectory();
                                if (folder) setScanFolder(folder);
                              }}
                              className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15 transition text-white"
                              type="button"
                            >
                              Browse
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (!scanEmuId || !scanFolder || !scanExtensions) {
                              showToast("Please specify emulator and folder directory.", "warning");
                              return;
                            }
                            setIsImporting(true);
                            try {
                              const res = await window.gameVault.scanRoms(scanEmuId, scanFolder, scanExtensions);
                              await refreshLibrary();
                              showToast(`Imported ${res.count} ROMs successfully`, "success");
                              sounds.playConfirm();
                            } catch (err: any) {
                              showToast(`Error scanning: ${err.message || err}`, "warning");
                            } finally {
                              setIsImporting(false);
                            }
                          }}
                          disabled={isImporting}
                          className="w-full rounded-lg bg-[var(--accent)] py-2 text-xs font-black text-zinc-950 hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
                          type="button"
                        >
                          {isImporting ? "Scanning folder..." : "Trigger ROMs Scan"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT - PLUGINS & MARKETPLACE */}
            {activeTab === "Plugins" && (
              <div className="grid grid-cols-2 gap-8">
                {/* Left: Installed Plugins Manager */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Settings className="size-5 text-[var(--accent)]" /> Installed Plugins
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Manage, enable/disable, configure, or uninstall active GameVault extensions.
                    </p>
                    
                    {plugins.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-white/5 py-12 text-center text-zinc-500 text-xs">
                        No plugins installed yet. Browse and install extensions from the Marketplace!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {plugins.map((plugin) => (
                          <div key={plugin.id} className="rounded-2xl bg-zinc-950 p-4 border border-white/5 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white">{plugin.name}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/10 text-zinc-300">
                                    v{plugin.version}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[var(--accent-glow)] text-[var(--accent)]">
                                    {plugin.type}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">{plugin.description}</p>
                                <span className="text-[10px] text-zinc-600 mt-2 block">Author: {plugin.author}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={plugin.enabled}
                                    onChange={async () => {
                                      await window.gameVault.setPluginEnabled(plugin.id, !plugin.enabled);
                                      await refreshLibrary();
                                    }}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:after:bg-zinc-950 peer-checked:after:border-transparent" />
                                </label>
                                <button
                                  onClick={async () => {
                                    if (confirm(`Uninstall ${plugin.name}?`)) {
                                      await window.gameVault.uninstallPlugin(plugin.id);
                                      await refreshLibrary();
                                    }
                                  }}
                                  className="rounded-lg bg-red-950/40 border border-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-200 hover:bg-red-900 transition"
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            
                            {/* Configurations config JSON editor for plugin */}
                            {plugin.enabled && (
                              <div className="pt-2 border-t border-white/5 space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Configuration Values</label>
                                <textarea
                                  defaultValue={plugin.config}
                                  onBlur={async (e) => {
                                    try {
                                      JSON.parse(e.target.value);
                                      await window.gameVault.updatePluginConfig(plugin.id, e.target.value);
                                      await refreshLibrary();
                                    } catch {
                                      alert("Invalid JSON configuration format.");
                                    }
                                  }}
                                  className="w-full rounded-xl bg-zinc-900 border border-white/5 p-2 text-[10px] font-mono outline-none focus:border-[var(--accent)] text-zinc-300 h-16"
                                  placeholder='e.g. {"key": "value"}'
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Marketplace Catalog */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Sparkles className="size-5 text-[var(--accent)]" /> Community Marketplace
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Explore plugins, artwork integrations, custom dashboard widgets, and storefront themes.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {marketplaceCatalog.map((item) => {
                        const isInstalled = plugins.some((p) => p.id === item.id);
                        return (
                          <div key={item.id} className="rounded-2xl bg-zinc-950 p-4 border border-white/5 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-white block truncate w-32">{item.name}</span>
                                <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-zinc-900 text-zinc-400">
                                  {item.type}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2 h-8">{item.description}</p>
                            </div>
                            
                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                              <span className="text-[8px] text-zinc-600 font-mono">By {item.author}</span>
                              <button
                                onClick={async () => {
                                  if (isInstalled) return;
                                  await window.gameVault.installPlugin(
                                    item.id,
                                    item.name,
                                    item.description,
                                    item.author,
                                    item.version,
                                    item.type,
                                    item.config,
                                    item.code
                                  );
                                  await refreshLibrary();
                                }}
                                disabled={isInstalled}
                                className={`rounded-lg px-3 py-1 text-[10px] font-black transition ${
                                  isInstalled
                                    ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                                    : "bg-[var(--accent)] text-zinc-950 hover:bg-[var(--accent-hover)]"
                                }`}
                                type="button"
                              >
                                {isInstalled ? "✓ Installed" : "Install"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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

      {/* Drag Over Overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--accent-glow)]/90 backdrop-blur-md border-4 border-dashed border-[var(--accent)] animate-pulse">
          <FolderPlus className="size-20 text-[var(--accent)] mb-4" />
          <h2 className="text-3xl font-black text-white">Drop Game Files Here</h2>
          <p className="text-sm text-zinc-300 mt-2">Release files to scan and add them directly to your library.</p>
        </div>
      )}

      {/* Manual Add Game Modal */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Game Manually</h3>
              <button onClick={() => setIsManualAddOpen(false)} className="text-zinc-500 hover:text-white text-2xl" type="button">&times;</button>
            </div>
            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400">Game Title *</label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  placeholder="E.g. Super Meat Boy"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400">Executable Path (Optional)</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type="text"
                    value={manualPath}
                    onChange={(e) => setManualPath(e.target.value)}
                    className="flex-1 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-mono outline-none focus:border-[var(--accent)] text-white"
                    placeholder="E.g. /Applications/SuperMeatBoy.app"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const selected = await window.gameVault.selectDirectory();
                      if (selected) setManualPath(selected);
                    }}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/15 text-white"
                  >
                    Browse
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-400">Developer</label>
                  <input
                    type="text"
                    value={manualDev}
                    onChange={(e) => setManualDev(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-400">Publisher</label>
                  <input
                    type="text"
                    value={manualPub}
                    onChange={(e) => setManualPub(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-400">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={manualGenres}
                    onChange={(e) => setManualGenres(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                    placeholder="Action, Platformer"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-400">Release Date</label>
                  <input
                    type="text"
                    value={manualRelDate}
                    onChange={(e) => setManualRelDate(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                    placeholder="Oct 2010"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400">Cover Artwork URL / Path</label>
                <input
                  type="text"
                  value={manualCover}
                  onChange={(e) => setManualCover(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  placeholder="HTTPS URL or local absolute path"
                />
              </div>
              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-[var(--accent-hover)] transition"
                >
                  Add to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {duplicateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-6">
            <h3 className="text-xl font-bold text-yellow-500">Duplicate Game Detected</h3>
            <p className="text-sm text-zinc-300">
              A game with the title <strong>"{duplicateConfirm.title}"</strong> or executable path is already in your library.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={async () => {
                  const updatedMetadata = {
                    title: pendingImport!.title,
                    executablePath: pendingImport!.path,
                    developer: pendingImport!.developer,
                    publisher: pendingImport!.publisher,
                    genres: pendingImport!.genres,
                    releaseDate: pendingImport!.releaseDate,
                    coverPath: pendingImport!.coverPath,
                    description: pendingImport!.description
                  };
                  await window.gameVault.updateGameMetadata(duplicateConfirm.id, updatedMetadata);
                  await refreshLibrary();
                  setDuplicateConfirm(null);
                  setPendingImport(null);
                  setIsManualAddOpen(false);
                  sounds.playConfirm();
                }}
                className="w-full rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-bold text-zinc-950 hover:bg-yellow-400 transition text-center"
                type="button"
              >
                Overwrite Existing Game
              </button>
              <button
                onClick={async () => {
                  const path = pendingImport!.path || `manual://game-${Date.now()}`;
                  await window.gameVault.addGame(pendingImport!.title, path, "local", {
                    developer: pendingImport!.developer,
                    publisher: pendingImport!.publisher,
                    genres: pendingImport!.genres,
                    releaseDate: pendingImport!.releaseDate,
                    coverPath: pendingImport!.coverPath,
                    description: pendingImport!.description
                  });
                  await refreshLibrary();
                  setDuplicateConfirm(null);
                  setPendingImport(null);
                  setIsManualAddOpen(false);
                  sounds.playConfirm();
                }}
                className="w-full rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15 transition text-center"
                type="button"
              >
                Add as Duplicate Game
              </button>
              <button
                onClick={() => {
                  setDuplicateConfirm(null);
                  setPendingImport(null);
                }}
                className="w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-zinc-400 hover:bg-white/5 transition text-center"
                type="button"
              >
                Cancel Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Rules Editor Modal */}
      {editingCollectionId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Configure Smart Collection</h3>
              <button onClick={() => setEditingCollectionId(null)} className="text-zinc-500 hover:text-white text-2xl" type="button">&times;</button>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Define filter criteria. Games matching these fields will automatically be populated in this smart collection.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-500">Genre Contains</label>
                <input
                  type="text"
                  value={smartGenre}
                  onChange={(e) => setSmartGenre(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  placeholder="E.g. RPG, Action"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-500">Platform equals</label>
                <select
                  value={smartPlatform}
                  onChange={(e) => setSmartPlatform(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                >
                  <option value="all">Any Platform</option>
                  <option value="steam">Steam</option>
                  <option value="epic">Epic Games</option>
                  <option value="gog">GOG Galaxy</option>
                  <option value="ubisoft">Ubisoft Connect</option>
                  <option value="ea">EA App</option>
                  <option value="xbox">Xbox App</option>
                  <option value="battlenet">Battle.net</option>
                  <option value="amazon">Amazon Games</option>
                  <option value="itchio">itch.io</option>
                  <option value="emulator">ROMs / Emulated</option>
                  <option value="local">Local</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-500">Developer Contains</label>
                <input
                  type="text"
                  value={smartDeveloper}
                  onChange={(e) => setSmartDeveloper(e.target.value)}
                  className="w-full mt-1.5 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  placeholder="E.g. Valve, Supergiant"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setEditingCollectionId(null)}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const rules = [];
                  if (smartGenre.trim()) rules.push({ field: "genres", value: smartGenre.trim() });
                  if (smartPlatform !== "all") rules.push({ field: "platform", value: smartPlatform });
                  if (smartDeveloper.trim()) rules.push({ field: "developer", value: smartDeveloper.trim() });
                  
                  const rulesStr = rules.length > 0 ? JSON.stringify(rules) : null;
                  await window.gameVault.updateCollectionRules(editingCollectionId, rulesStr);
                  await refreshLibrary();
                  setEditingCollectionId(null);
                  sounds.playConfirm();
                }}
                className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-[var(--accent-hover)] transition"
              >
                Save Smart Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Details Overlay Page */}
      {selectedGameId !== null && (
        <GameDetailsPage
          game={library.games.find((g) => g.id === selectedGameId)!}
          isRunning={activeGameId === selectedGameId}
          onClose={() => setSelectedGameId(null)}
          onLaunch={handleLaunchGame}
          onUpdateMetadata={handleUpdateMetadata}
          onRemoveGame={handleRemoveGame}
          activePlugins={plugins}
        />
      )}
      {/* Bulk / Multi-select Action Bar */}
      {selectedGameIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-black text-zinc-950">
              {selectedGameIds.length}
            </span>
            <span className="text-xs text-zinc-300 font-semibold">Games Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                for (const id of selectedGameIds) {
                  await window.gameVault.setGameFavorite(id, true);
                }
                await refreshLibrary();
                setSelectedGameIds([]);
                showToast(`Favorited ${selectedGameIds.length} games`, "success");
                sounds.playConfirm();
              }}
              className="rounded-xl bg-zinc-800 border border-white/5 hover:bg-zinc-700 px-3 py-2 text-xs font-semibold text-white transition"
              type="button"
            >
              ★ Favorite
            </button>
            <button
              onClick={async () => {
                for (const id of selectedGameIds) {
                  await window.gameVault.setGameHidden(id, true);
                }
                await refreshLibrary();
                setSelectedGameIds([]);
                showToast(`Hid ${selectedGameIds.length} games`, "success");
                sounds.playConfirm();
              }}
              className="rounded-xl bg-zinc-800 border border-white/5 hover:bg-zinc-700 px-3 py-2 text-xs font-semibold text-white transition"
              type="button"
            >
              Hide
            </button>
            <button
              onClick={async () => {
                const confirmed = confirm(`Are you sure you want to delete ${selectedGameIds.length} games from library?`);
                if (!confirmed) return;
                for (const id of selectedGameIds) {
                  await window.gameVault.deleteGame(id);
                }
                await refreshLibrary();
                setSelectedGameIds([]);
                showToast(`Deleted ${selectedGameIds.length} games`, "warning");
                sounds.playConfirm();
              }}
              className="rounded-xl bg-red-950/40 border border-red-500/20 hover:bg-red-900 px-3 py-2 text-xs font-semibold text-red-200 transition"
              type="button"
            >
              Delete
            </button>
            
            <select
              defaultValue=""
              onChange={async (e) => {
                const colId = Number(e.target.value);
                if (!colId) return;
                for (const id of selectedGameIds) {
                  await window.gameVault.addGameToCollection(colId, id);
                }
                await refreshLibrary();
                setSelectedGameIds([]);
                showToast(`Added selectees to collection`, "success");
                sounds.playConfirm();
              }}
              className="rounded-xl bg-zinc-800 border border-white/5 text-xs font-semibold px-2 py-2 text-white outline-none cursor-pointer"
            >
              <option value="" disabled>Add to collection...</option>
              {library.collections.map((col) => (
                <option key={col.id} value={col.id}>{col.name}</option>
              ))}
            </select>

            <button
              onClick={() => setSelectedGameIds([])}
              className="rounded-xl border border-white/10 hover:bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Toast Alert overlay */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl border px-4 py-3 text-xs font-semibold text-white shadow-xl flex items-center gap-3 transition-all duration-300 transform translate-y-0 scale-100 ${
              toast.type === "success"
                ? "bg-zinc-950/90 border-green-500/30 text-green-200"
                : toast.type === "warning"
                ? "bg-zinc-950/90 border-red-500/30 text-red-200"
                : "bg-zinc-950/90 border-white/10 text-zinc-100"
            }`}
          >
            <div className={`size-2 rounded-full animate-pulse ${
              toast.type === "success" ? "bg-green-400" : toast.type === "warning" ? "bg-red-400" : "bg-[var(--accent)]"
            }`} />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
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
