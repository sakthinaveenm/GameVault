import type { Profile } from "../types/window";
import { Monitor, Sun, Moon, Palette, Maximize } from "lucide-react";

interface CustomizationSettingsProps {
  profile: Profile;
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
  onClose?: () => void;
}

const ACCENT_COLORS = [
  { name: "lime", hex: "#a3e635" },
  { name: "violet", hex: "#8b5cf6" },
  { name: "rose", hex: "#f43f5e" },
  { name: "sky", hex: "#38bdf8" },
  { name: "amber", hex: "#f59e0b" },
  { name: "emerald", hex: "#10b981" }
];

export function CustomizationSettings({
  profile,
  onUpdateSettings,
  onClose
}: CustomizationSettingsProps) {
  const currentAccent = profile.accentColor;
  const currentTheme = profile.theme;
  const startInFullscreen = profile.startInFullscreen;

  const handleThemeChange = (newTheme: string) => {
    void onUpdateSettings(
      newTheme,
      currentAccent,
      startInFullscreen,
      profile.libraryDirectory || null,
      profile.customBgPrimary,
      profile.customBgSecondary,
      profile.customTextPrimary,
      profile.customAccent
    );
  };

  const handleAccentChange = (newAccent: string) => {
    void onUpdateSettings(
      currentTheme,
      newAccent,
      startInFullscreen,
      profile.libraryDirectory || null,
      profile.customBgPrimary,
      profile.customBgSecondary,
      profile.customTextPrimary,
      profile.customAccent
    );
  };

  const handleFullscreenToggle = (enabled: boolean) => {
    void onUpdateSettings(
      currentTheme,
      currentAccent,
      enabled,
      profile.libraryDirectory || null,
      profile.customBgPrimary,
      profile.customBgSecondary,
      profile.customTextPrimary,
      profile.customAccent
    );
  };

  const handleCustomColorChange = (field: string, value: string) => {
    void onUpdateSettings(
      currentTheme,
      currentAccent,
      startInFullscreen,
      profile.libraryDirectory || null,
      field === "customBgPrimary" ? value : profile.customBgPrimary,
      field === "customBgSecondary" ? value : profile.customBgSecondary,
      field === "customTextPrimary" ? value : profile.customTextPrimary,
      field === "customAccent" ? value : profile.customAccent
    );
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 space-y-6 text-zinc-100">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Palette className="size-5 text-[var(--accent)]" /> Customize Interface
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-zinc-500 hover:text-white"
            type="button"
          >
            Close Settings
          </button>
        )}
      </div>

      {/* Theme Picker */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Theme Mode</h4>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: "dark", label: "Dark", icon: Moon },
            { id: "light", label: "Light", icon: Sun },
            { id: "system", label: "System", icon: Monitor },
            { id: "custom", label: "Custom", icon: Palette }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleThemeChange(id)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold transition ${
                currentTheme === id
                  ? "border-[var(--accent)] bg-[var(--accent-glow)] text-white shadow-[0_0_8px_var(--accent-glow)]"
                  : "border-white/5 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-400 hover:text-white"
              }`}
              type="button"
            >
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Theme Color Settings */}
      {currentTheme === "custom" && (
        <div className="border-t border-white/5 pt-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Custom Theme Colors</h4>
          <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white/[0.02] border border-white/5 p-4">
            <label className="flex flex-col gap-1.5 cursor-pointer">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Primary Background</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile.customBgPrimary || "#09090b"}
                  onChange={(e) => handleCustomColorChange("customBgPrimary", e.target.value)}
                  className="size-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none p-0"
                />
                <span className="text-[10px] font-mono uppercase">{profile.customBgPrimary || "#09090B"}</span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5 cursor-pointer">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Panel/Card Background</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile.customBgSecondary || "#18181b"}
                  onChange={(e) => handleCustomColorChange("customBgSecondary", e.target.value)}
                  className="size-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none p-0"
                />
                <span className="text-[10px] font-mono uppercase">{profile.customBgSecondary || "#18181B"}</span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5 cursor-pointer">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Primary Text Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile.customTextPrimary || "#f4f4f5"}
                  onChange={(e) => handleCustomColorChange("customTextPrimary", e.target.value)}
                  className="size-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none p-0"
                />
                <span className="text-[10px] font-mono uppercase">{profile.customTextPrimary || "#F4F4F5"}</span>
              </div>
            </label>

            <label className="flex flex-col gap-1.5 cursor-pointer">
              <span className="text-[10px] uppercase font-bold text-zinc-500">Custom Accent Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={profile.customAccent || "#a3e635"}
                  onChange={(e) => handleCustomColorChange("customAccent", e.target.value)}
                  className="size-8 rounded-lg cursor-pointer bg-transparent border-0 outline-none p-0"
                />
                <span className="text-[10px] font-mono uppercase">{profile.customAccent || "#A3E635"}</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Accent Color Picker (Disabled if Custom Theme is managing accent) */}
      {currentTheme !== "custom" && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Accent Color</h4>
          <div className="grid grid-cols-6 gap-2">
            {ACCENT_COLORS.map(({ name, hex }) => (
              <button
                key={name}
                onClick={() => handleAccentChange(name)}
                className={`relative grid size-10 place-items-center rounded-xl transition duration-150 ${
                  currentAccent === name
                    ? "scale-110 border-2 border-white shadow-[0_0_15px_var(--accent)]"
                    : "hover:scale-105 border border-white/10"
                }`}
                style={{ backgroundColor: hex }}
                title={name}
                type="button"
              >
                {currentAccent === name && (
                  <div className="size-2 rounded-full bg-white shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Startup options */}
      <div className="border-t border-white/5 pt-4 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Startup Configurations</h4>
        
        <label className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.02] border border-white/5 px-4 py-3 cursor-pointer hover:bg-white/[0.04] transition">
          <div className="flex items-center gap-3">
            <Maximize className="size-5 text-zinc-500" />
            <div>
              <p className="text-sm font-semibold">Start in Fullscreen</p>
              <p className="text-xs text-zinc-500">Launches GameVault in Big Picture mode by default.</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={startInFullscreen}
            onChange={(e) => handleFullscreenToggle(e.target.checked)}
            className="accent-[var(--accent)] size-4 cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
