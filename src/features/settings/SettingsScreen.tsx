import React, { useState, useEffect } from 'react';
import { useControllerStore } from '@/stores/controllerStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { api } from '@/services/tauri';
import {
  Settings,
  Monitor,
  Folder,
  Gamepad2,
  HardDrive,
  Cloud,
  Shield,
  Save,
  Check,
  RotateCcw,
} from 'lucide-react';

const SETTINGS_STORAGE_KEY = 'ugh_app_settings';

export const SettingsScreen: React.FC = () => {
  const { showHints, toggleHints } = useControllerStore();
  const { isFullscreen, toggleFullscreen } = useNavigationStore();

  const [scanPath, setScanPath] = useState('D:\\Games');
  const [romsPath, setRomsPath] = useState('D:\\ROMs');
  const [deadzone, setDeadzone] = useState(0.25);
  const [backupDelay, setBackupDelay] = useState(5);
  const [retentionLimit, setRetentionLimit] = useState(10);
  const [autoSync, setAutoSync] = useState(true);
  const [saveConfirmation, setSaveConfirmation] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.scanPath) setScanPath(parsed.scanPath);
        if (parsed.romsPath) setRomsPath(parsed.romsPath);
        if (typeof parsed.deadzone === 'number') setDeadzone(parsed.deadzone);
        if (typeof parsed.backupDelay === 'number') setBackupDelay(parsed.backupDelay);
        if (typeof parsed.retentionLimit === 'number') setRetentionLimit(parsed.retentionLimit);
        if (typeof parsed.autoSync === 'boolean') setAutoSync(parsed.autoSync);
      } else {
        api.getDefaultGameDirectories().then((dirs) => {
          if (dirs && dirs.length > 0) {
            setScanPath(dirs[0]);
          }
        }).catch(() => {});
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          scanPath,
          romsPath,
          deadzone,
          backupDelay,
          retentionLimit,
          autoSync,
        })
      );
    } catch (err) {
      console.warn('Failed to persist settings:', err);
    }
    setSaveConfirmation(true);
    setTimeout(() => setSaveConfirmation(false), 2500);
  };

  const handleResetDefaults = async () => {
    try {
      const dirs = await api.getDefaultGameDirectories();
      const defaultScan = (dirs && dirs.length > 0) ? dirs[0] : 'C:\\Games';
      setScanPath(defaultScan);
    } catch {
      setScanPath('C:\\Games');
    }
    setRomsPath('C:\\ROMs');
    setDeadzone(0.25);
    setBackupDelay(5);
    setRetentionLimit(10);
    setAutoSync(true);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Launcher Settings</h1>
              <p className="text-xs text-slate-400">
                Configure directories, controller sensitivities, save backup retention, and cloud options.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/25"
            >
              {saveConfirmation ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{saveConfirmation ? 'Saved Settings' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Form Body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6 space-y-6 max-w-4xl">
        {/* General & Display */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <Monitor className="w-4 h-4 text-sky-400 mr-2" />
            <span>Display & Application</span>
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">Fullscreen Big Picture Mode</div>
                <div className="text-[11px] text-slate-500">
                  Immersive 10-foot console display format. (F11 shortcut)
                </div>
              </div>
              <button
                onClick={toggleFullscreen}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isFullscreen ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isFullscreen ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <div className="text-xs font-bold text-slate-200">Controller Button Hints Bar</div>
                <div className="text-[11px] text-slate-500">
                  Display button glyph bar at the bottom of the screen.
                </div>
              </div>
              <button
                onClick={toggleHints}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  showHints ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    showHints ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Directory Configurations */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <Folder className="w-4 h-4 text-indigo-400 mr-2" />
            <span>Configured Directories</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Game Scanning Folder</label>
              <input
                type="text"
                value={scanPath}
                onChange={(e) => setScanPath(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Retro ROMs Directory</label>
              <input
                type="text"
                value={romsPath}
                onChange={(e) => setRomsPath(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Controller Settings */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <Gamepad2 className="w-4 h-4 text-emerald-400 mr-2" />
            <span>Controller Input Calibration</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Analog Stick Dead-Zone</span>
              <span className="font-mono text-emerald-400">{deadzone.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={deadzone}
              onChange={(e) => setDeadzone(parseFloat(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Save & Cloud Sync Policies */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-100 text-sm flex items-center">
            <Cloud className="w-4 h-4 text-sky-400 mr-2" />
            <span>Save Manager & Cloud Policies</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Write Quiescence Delay (seconds after exit)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={backupDelay}
                onChange={(e) => setBackupDelay(parseInt(e.target.value) || 5)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Max Snapshot Retention per Game
              </label>
              <input
                type="number"
                min="3"
                max="50"
                value={retentionLimit}
                onChange={(e) => setRetentionLimit(parseInt(e.target.value) || 10)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
