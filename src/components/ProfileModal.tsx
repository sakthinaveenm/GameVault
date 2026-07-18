import { useState } from "react";
import type { Profile, Game } from "../types/window";
import { X, Save, Edit3, Award, Flame, Library, Star } from "lucide-react";

interface ProfileModalProps {
  profile: Profile;
  games: Game[];
  onClose: () => void;
  onUpdate: (name: string, avatarPath: string | null) => Promise<void>;
}

const PRESET_AVATARS = ["👾", "🎮", "🚀", "🐱‍💻", "🦊", "🐉", "🤖", "🎨"];

export function ProfileModal({ profile, games, onClose, onUpdate }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarPath, setAvatarPath] = useState(profile.avatarPath || "👾");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [customPathMode, setCustomPathMode] = useState(
    profile.avatarPath && !PRESET_AVATARS.includes(profile.avatarPath)
  );

  // Compute stats
  const totalGames = games.length;
  const totalFavorites = games.filter((g) => g.isFavorite).length;
  const totalPlaytimeSeconds = games.reduce((sum, g) => sum + g.playtimeSeconds, 0);
  const totalPlaytimeHours = (totalPlaytimeSeconds / 3600).toFixed(1);

  const mostPlayed = [...games].sort((a, b) => b.playtimeSeconds - a.playtimeSeconds)[0] || null;
  const mostPlayedHours = mostPlayed ? (mostPlayed.playtimeSeconds / 3600).toFixed(1) : "0";

  async function handleSave() {
    setErrorMsg("");
    if (!displayName.trim()) {
      setErrorMsg("Display name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      await onUpdate(displayName.trim(), avatarPath);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-900 p-8 shadow-2xl text-zinc-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full bg-white/5 p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition"
          type="button"
        >
          <X className="size-5" />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-extrabold tracking-tight mb-8">
          User <span className="text-[var(--accent)]">Profile</span>
        </h2>

        <div className="grid grid-cols-[200px_1fr] gap-8">
          {/* Avatar and Editing */}
          <div className="flex flex-col items-center border-r border-white/10 pr-8">
            <div className="grid size-28 place-items-center rounded-full bg-[var(--accent-glow)] border-4 border-[var(--accent)] text-5xl shadow-[0_0_20px_var(--accent-glow)] select-none">
              {customPathMode && avatarPath.startsWith("http") || avatarPath.includes("/") ? (
                <img
                  src={avatarPath}
                  alt="Avatar"
                  className="size-full rounded-full object-cover"
                  onError={() => setAvatarPath("👾")}
                />
              ) : (
                avatarPath
              )}
            </div>

            <div className="mt-6 w-full">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Display Name
              </label>
              <div className="relative mt-2 flex items-center">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  placeholder="Player Name"
                />
                <Edit3 className="absolute right-3 size-4 text-zinc-600 pointer-events-none" />
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="mt-6 w-full">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Avatar Icon
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomPathMode(!customPathMode);
                    setAvatarPath(customPathMode ? "👾" : "");
                  }}
                  className="text-[10px] text-[var(--accent)] hover:underline"
                >
                  {customPathMode ? "Use preset" : "Use custom path"}
                </button>
              </div>

              {customPathMode ? (
                <input
                  type="text"
                  value={avatarPath}
                  onChange={(e) => setAvatarPath(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-[var(--accent)]"
                  placeholder="Absolute image file path or URL"
                />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setAvatarPath(emoji)}
                      className={`grid size-9 place-items-center rounded-lg text-lg transition ${
                        avatarPath === emoji
                          ? "bg-[var(--accent)] text-zinc-950 font-bold"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      type="button"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats Page */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">
                Player Statistics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <Library className="size-6 text-[var(--accent)]" />
                  <div>
                    <p className="text-xs text-zinc-500 font-medium">Games Owned</p>
                    <p className="text-xl font-bold">{totalGames}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <Star className="size-6 text-yellow-400" />
                  <div>
                    <p className="text-xs text-zinc-500 font-medium">Favorites</p>
                    <p className="text-xl font-bold">{totalFavorites}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <Flame className="size-6 text-orange-500 animate-pulse" />
                  <div>
                    <p className="text-xs text-zinc-500 font-medium">Total Playtime</p>
                    <p className="text-xl font-bold">{totalPlaytimeHours}h</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 p-4">
                  <Award className="size-6 text-amber-500" />
                  <div>
                    <p className="text-xs text-zinc-500 font-medium">Most Played</p>
                    <p className="text-sm font-bold truncate max-w-[130px]" title={mostPlayed?.title || "None"}>
                      {mostPlayed ? mostPlayed.title : "None"}
                    </p>
                    {mostPlayed && (
                      <p className="text-[10px] text-zinc-500">{mostPlayedHours} hours</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-sm text-red-400 mt-4">{errorMsg}</p>
            )}

            <div className="mt-8 flex justify-end gap-3 border-t border-white/10 pt-6">
              <button
                onClick={onClose}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-bold text-zinc-950 hover:bg-[var(--accent-hover)] transition disabled:opacity-50"
                type="button"
              >
                <Save className="size-4" />
                {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
