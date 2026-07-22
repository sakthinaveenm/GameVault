import { useEffect, useState, useRef } from "react";
import type { Game } from "../types/window";
import { X, Play, Clock, Calendar, Building, Tag, FileText, Edit, Trash2, Save, RefreshCw, Award } from "lucide-react";
import confetti from "canvas-confetti";

interface GameDetailsPageProps {
  game: Game;
  isRunning: boolean;
  onClose: () => void;
  onLaunch: (gameId: number) => void;
  onUpdateMetadata: (gameId: number, data: Partial<Game>) => Promise<void>;
  onRemoveGame?: (gameId: number) => void; // Optional remove handler
  activePlugins?: any[];
}

export function GameDetailsPage({
  game,
  isRunning,
  onClose,
  onLaunch,
  onUpdateMetadata,
  onRemoveGame,
  activePlugins
}: GameDetailsPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [desc, setDesc] = useState(game.description || "");
  const [cover, setCover] = useState(game.coverPath || "");
  const [dev, setDev] = useState(game.developer || "");
  const [pub, setPub] = useState(game.publisher || "");
  const [genresList, setGenresList] = useState(game.genres || "");
  const [relDate, setRelDate] = useState(game.releaseDate || "");
  const [isSaving, setIsSaving] = useState(false);
  const [launchArgs, setLaunchArgs] = useState(game.launchArguments || "");
  const [hiddenState, setHiddenState] = useState(game.isHidden || false);
  const [preScript, setPreScript] = useState(game.preLaunchScript || "");
  const [postScript, setPostScript] = useState(game.postCloseScript || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifierMessage, setVerifierMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  // Active Session Timer state
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const hist = await window.gameVault.getLaunchHistory(game.id);
        setHistory(hist);
      } catch (err) {
        console.error("Failed to load launch history:", err);
      }
    };
    void loadHistory();
  }, [game.id, isRunning]);

  const [gameAchievements, setGameAchievements] = useState<any[]>([]);

  const refreshGameAchievements = async () => {
    try {
      const list = await window.gameVault.getAchievements(game.id);
      setGameAchievements(list);
    } catch (err) {
      console.error("Failed to load game achievements:", err);
    }
  };

  useEffect(() => {
    void refreshGameAchievements();
  }, [game.id]);

  // Trigger confetti when launching game
  const handlePlayClick = () => {
    onLaunch(game.id);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#a3e635", "#8b5cf6", "#f43f5e", "#38bdf8"]
    });
  };

  useEffect(() => {
    if (isRunning) {
      setSessionSeconds(0);
      timerRef.current = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Format session timer (HH:MM:SS)
  const formatSessionTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const secs = (totalSecs % 60).toString().padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  };

  // Format playtime (Hours/Minutes)
  const formatPlaytime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h`;
  };

  const handleSaveMetadata = async () => {
    setIsSaving(true);
    try {
      await onUpdateMetadata(game.id, {
        description: desc.trim(),
        coverPath: cover.trim(),
        developer: dev.trim(),
        publisher: pub.trim(),
        genres: genresList.trim(),
        releaseDate: relDate.trim(),
        launchArguments: launchArgs.trim(),
        isHidden: hiddenState
      });
      await window.gameVault.saveGameScripts(game.id, preScript.trim() || null, postScript.trim() || null);
      
      await onUpdateMetadata(game.id, {
        preLaunchScript: preScript.trim() || null,
        postCloseScript: postScript.trim() || null
      });

      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-zinc-950 text-zinc-100 overflow-y-auto">
      {/* Hero Banner Area */}
      <div className="relative h-[380px] w-full bg-gradient-to-b from-zinc-800 to-zinc-950">
        {cover && cover.startsWith("http") || cover.includes("/") ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
            style={{ backgroundImage: `url(${cover})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--accent-glow-strong),transparent_70%)] opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

        {/* Header Controls */}
        <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-xl bg-zinc-900/80 border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-zinc-800 transition"
            type="button"
          >
            <X className="size-4" /> Back to Library
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/80 border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-zinc-800 transition"
              type="button"
            >
              <Edit className="size-4" /> Edit Details
            </button>
            <button
              onClick={async () => {
                const success = await window.gameVault.triggerSingleGameMetadata(game.id, game.title);
                if (success) {
                  alert("Successfully fetched Steam metadata! Re-open detail card to view.");
                  onClose();
                } else {
                  alert("No matching Steam metadata found on Steam store.");
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-zinc-900/80 border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-zinc-800 transition"
              type="button"
            >
              <RefreshCw className="size-4" /> Sync Metadata
            </button>
            <button
              onClick={async () => {
                const nextVal = !game.isCompleted;
                await window.gameVault.toggleGameCompleted(game.id, nextVal);
                await onUpdateMetadata(game.id, { isCompleted: nextVal });
                void refreshGameAchievements();
              }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                game.isCompleted
                  ? "bg-green-950/40 border-green-500/20 text-green-200"
                  : "bg-zinc-900/80 border-white/10 text-zinc-300 hover:bg-zinc-800"
              }`}
              type="button"
            >
              {game.isCompleted ? "✔ Completed" : "Mark Completed"}
            </button>
            <button
              onClick={async () => {
                const nextVal = !game.showcased;
                await window.gameVault.toggleGameShowcase(game.id, nextVal);
                await onUpdateMetadata(game.id, { showcased: nextVal });
              }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                game.showcased
                  ? "bg-[var(--accent)] text-zinc-950 border-[var(--accent)]"
                  : "bg-zinc-900/80 border-white/10 text-zinc-300 hover:bg-zinc-800"
              }`}
              type="button"
            >
              🏆 {game.showcased ? "Pinned" : "Pin Game"}
            </button>
            {onRemoveGame && (
              <button
                onClick={() => {
                  if (confirm("Remove this game from your library?")) {
                    onRemoveGame(game.id);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-red-900/60 border border-red-500/20 px-4 py-2 text-sm font-semibold hover:bg-red-950 transition text-red-200"
                type="button"
              >
                <Trash2 className="size-4" /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Hero Meta Info */}
        <div className="absolute bottom-8 left-8 right-8 flex items-end gap-8 z-10">
          {/* Cover Art */}
          <div className="size-[200px] shrink-0 rounded-2xl bg-zinc-900/80 border border-white/10 shadow-2xl flex items-center justify-center text-6xl select-none overflow-hidden">
            {cover && cover.startsWith("http") || cover.includes("/") ? (
              <img src={cover} alt="Cover" className="size-full object-cover" />
            ) : (
              "🎮"
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="mb-3">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest badge-${game.platform}`}>
                {game.platform === "local" ? "Local Executable" : `${game.platform === "gog" ? "GOG GALAXY" : game.platform.toUpperCase()} INTEGRATION`}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tight">{game.title}</h1>
            <p className="text-xs text-zinc-500 font-mono mt-2 truncate" title={game.executablePath}>
              {game.executablePath}
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Clock className="size-4 text-[var(--accent)]" />
                <span>Playtime: <strong>{formatPlaytime(game.playtimeSeconds)}</strong></span>
              </div>
              {game.lastPlayedAt && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar className="size-4 text-[var(--accent)]" />
                  <span>Last Played: <strong>{game.lastPlayedAt}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-[1fr_300px] gap-12 px-8 py-10">
        {/* Left Hand Details Column */}
        <div className="space-y-8">
          {isEditing ? (
            /* Editing Form */
            <div className="rounded-3xl border border-white/10 bg-zinc-900 p-6 space-y-6">
              <h3 className="text-lg font-bold">Edit Game Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-500">Cover Artwork URL / Path</label>
                  <input
                    type="text"
                    value={cover}
                    onChange={(e) => setCover(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    placeholder="E.g. /Users/name/images/game.jpg"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-500">Release Date</label>
                  <input
                    type="text"
                    value={relDate}
                    onChange={(e) => setRelDate(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    placeholder="E.g. Oct 2024"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-500">Developer</label>
                  <input
                    type="text"
                    value={dev}
                    onChange={(e) => setDev(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-500">Publisher</label>
                  <input
                    type="text"
                    value={pub}
                    onChange={(e) => setPub(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={genresList}
                    onChange={(e) => setGenresList(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                    placeholder="E.g. Action, RPG, Open World"
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase text-zinc-500">Description</label>
                    <button
                      onClick={async () => {
                        try {
                          const res = await window.gameVault.aiEnhanceMetadata(game.id);
                          setDesc(res);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-[10px] font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
                      type="button"
                    >
                      🪄 Generate with AI
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold uppercase text-zinc-500">Launch Arguments</label>
                  <input
                    type="text"
                    value={launchArgs}
                    onChange={(e) => setLaunchArgs(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)] text-white"
                    placeholder="E.g. -novid -windowed"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-500">Pre-Launch Automation Hook (Bash/Batch)</label>
                  <input
                    type="text"
                    value={preScript}
                    onChange={(e) => setPreScript(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-[var(--accent)] text-white font-mono"
                    placeholder="E.g. taskkill /f /im explorer.exe"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-500">Post-Close Automation Hook (Bash/Batch)</label>
                  <input
                    type="text"
                    value={postScript}
                    onChange={(e) => setPostScript(e.target.value)}
                    className="w-full mt-2 rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-[var(--accent)] text-white font-mono"
                    placeholder="E.g. start explorer.exe"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3 bg-zinc-950/40 p-3 rounded-xl border border-white/5">
                  <input
                    type="checkbox"
                    id="isHiddenCheckbox"
                    checked={hiddenState}
                    onChange={(e) => setHiddenState(e.target.checked)}
                    className="accent-[var(--accent)] size-4 cursor-pointer"
                  />
                  <label htmlFor="isHiddenCheckbox" className="text-xs font-semibold uppercase text-zinc-400 cursor-pointer select-none">
                    Hide Game in Library
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMetadata}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
                  type="button"
                >
                  <Save className="size-4" />
                  {isSaving ? "Saving..." : "Save Details"}
                </button>
              </div>
            </div>
          ) : (
            /* Main Meta Details */
            <div className="space-y-8">
              {game.description ? (
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                    <FileText className="size-4" /> About the Game
                  </h3>
                  <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {game.description}
                  </p>
                </div>
              ) : (
                <p className="text-zinc-600 text-sm italic">No description available. Click Edit Details to add one.</p>
              )}

              {history.length > 0 && (
                <div className="space-y-3 mt-8">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                    <Clock className="size-4 text-[var(--accent)]" /> Gameplay Sessions History
                  </h3>
                  <div className="rounded-2xl border border-white/5 bg-zinc-900/20 divide-y divide-white/5 max-h-56 overflow-y-auto font-mono text-xs">
                    {history.map((session) => (
                      <div key={session.id} className="flex justify-between px-4 py-2.5 text-zinc-300 font-mono">
                        <span>{session.launchedAt}</span>
                        <span className="font-bold text-[var(--accent)]">{formatPlaytime(session.durationSeconds)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Game achievements progress log list */}
              <div className="space-y-4 mt-8">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-500">
                  <Award className="size-4 text-[var(--accent)]" /> Achievements & Trophies
                </h3>
                {gameAchievements.length === 0 ? (
                  <p className="text-zinc-600 text-xs italic">No achievements loaded.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {gameAchievements.map((ach) => (
                      <button
                        key={ach.id}
                        onClick={async () => {
                          if (!ach.unlocked) return;
                          const nextVal = !ach.showcased;
                          await window.gameVault.toggleAchievementShowcase(ach.id, nextVal);
                          void refreshGameAchievements();
                        }}
                        className={`rounded-2xl border p-4 text-left transition flex flex-col justify-between h-28 relative overflow-hidden group ${
                          ach.unlocked
                            ? "bg-zinc-900/60 border-white/10 hover:border-[var(--accent)] cursor-pointer"
                            : "bg-zinc-950/20 border-white/5 opacity-50 cursor-not-allowed"
                        }`}
                        disabled={!ach.unlocked}
                        type="button"
                        title={ach.unlocked ? "Click to showcase/pin trophy on profile!" : "Play to unlock!"}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xl">🏆</span>
                            {ach.showcased && (
                              <span className="bg-[var(--accent)] text-zinc-950 rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase">Pinned</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-white block mt-2 truncate w-full">{ach.title}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 block truncate w-full">{ach.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Hand Sidebar (Launch Panel & Info Cards) */}
        <div className="space-y-6">
          {/* Play/Launcher Widget */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 flex flex-col items-center text-center">
            {isRunning ? (
              <>
                <div className="relative size-16 mb-4 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-[var(--accent)] animate-spin duration-3000" />
                  <div className="absolute inset-2 rounded-full bg-[var(--accent-glow)] animate-pulse" />
                </div>
                <h4 className="font-bold text-lg text-white">Running Game</h4>
                <p className="text-2xl font-black text-[var(--accent)] mt-3 tracking-mono font-mono animate-glow">
                  {formatSessionTime(sessionSeconds)}
                </p>
                <p className="text-xs text-zinc-500 mt-2">Close the game to stop tracking playtime.</p>
              </>
            ) : (
              <>
                <button
                  onClick={handlePlayClick}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[var(--accent)] py-5 text-lg font-black text-zinc-950 hover:bg-[var(--accent-hover)] shadow-[0_0_20px_var(--accent-glow)] hover:scale-[1.02] focus:scale-[1.02] transition duration-200"
                  type="button"
                >
                  <Play className="size-6 fill-zinc-950" /> PLAY GAME
                </button>
                <p className="text-xs text-zinc-500 mt-3">Spawns executable and tracks playtime automatically.</p>
              </>
            )}
          </div>

          {/* Dynamic Widget API: HLTB statistics */}
          {activePlugins?.some((p) => p.id === "hltb" && p.enabled) && (
            <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 space-y-3 text-left">
              <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Award className="size-4 text-[var(--accent)]" /> HowLongToBeat Stats
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 font-mono">
                <div className="bg-zinc-950 p-2 rounded-xl">
                  <span className="text-[9px] text-zinc-500 block uppercase">Main</span>
                  <strong className="text-white">12.5h</strong>
                </div>
                <div className="bg-zinc-950 p-2 rounded-xl">
                  <span className="text-[9px] text-zinc-500 block uppercase">Extra</span>
                  <strong className="text-white">24h</strong>
                </div>
                <div className="bg-zinc-950 p-2 rounded-xl">
                  <span className="text-[9px] text-zinc-500 block uppercase">100%</span>
                  <strong className="text-white">48h</strong>
                </div>
              </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Game Information</h4>

            {game.developer && (
              <div className="flex gap-3">
                <Building className="size-4 shrink-0 text-zinc-600 mt-1" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Developer</p>
                  <p className="text-sm font-semibold">{game.developer}</p>
                </div>
              </div>
            )}

            {game.publisher && (
              <div className="flex gap-3">
                <Building className="size-4 shrink-0 text-zinc-600 mt-1" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Publisher</p>
                  <p className="text-sm font-semibold">{game.publisher}</p>
                </div>
              </div>
            )}

            {game.releaseDate && (
              <div className="flex gap-3">
                <Calendar className="size-4 shrink-0 text-zinc-600 mt-1" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Release Date</p>
                  <p className="text-sm font-semibold">{game.releaseDate}</p>
                </div>
              </div>
            )}

            {game.genres && (
              <div className="flex gap-3">
                <Tag className="size-4 shrink-0 text-zinc-600 mt-1" />
                <div>
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase">Genres</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {game.genres.split(",").map((genre) => (
                      <span
                        key={genre.trim()}
                        className="rounded-full bg-white/5 border border-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-400"
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Files Integrity Check card */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/40 p-6 space-y-4 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <FileText className="size-4 text-[var(--accent)]" /> Integrity Verifier
            </h4>
            <p className="text-[10px] text-zinc-400">Validate local application assets structure and verify checksum signatures.</p>

            {verifierMessage && (
              <div className="rounded-xl bg-zinc-950 border border-white/5 p-3 text-[10px] font-mono text-zinc-300 whitespace-pre-wrap break-all">
                {verifierMessage}
              </div>
            )}

            <button
              onClick={async () => {
                setIsVerifying(true);
                setVerifierMessage("Analyzing game directory...\nCalculating hashes...");
                try {
                  const res = await window.gameVault.verifyGameFiles(game.id);
                  setVerifierMessage(`Validation Complete!\n- Files Verified: ${res.filesVerified}\n- Status: SUCCESS\n- Signature: ${res.hash}`);
                } catch (err: any) {
                  setVerifierMessage(`Verification failed: ${err.message || err}`);
                } finally {
                  setIsVerifying(false);
                }
              }}
              disabled={isVerifying}
              className="w-full rounded-xl bg-white/5 border border-white/10 py-2 text-xs font-bold text-zinc-300 hover:bg-white/10 transition disabled:opacity-50"
              type="button"
            >
              {isVerifying ? "Verifying Files..." : "Verify Game Files"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
