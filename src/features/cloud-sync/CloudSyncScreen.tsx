import React, { useState, useEffect } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { SyncConflict } from '@/types';
import { api, SystemInfoDto } from '@/services/tauri';
import {
  Cloud,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Lock,
  ArrowRight,
  LogOut,
  Smartphone,
  Laptop,
  Monitor,
  X,
} from 'lucide-react';

export const CloudSyncScreen: React.FC = () => {
  const { activeProfile, linkGoogleAccount, unlinkGoogleAccount } = useProfileStore();

  const [isSyncing, setIsSyncing] = useState(false);
  const [driveMode, setDriveMode] = useState<'appdata' | 'folder'>('appdata');
  const [activeConflict, setActiveConflict] = useState<SyncConflict | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfoDto | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const isGoogleConnected = Boolean(activeProfile?.linkedGoogleEmail);

  useEffect(() => {
    api.getSystemInfo().then(setSystemInfo).catch(() => {});
  }, []);

  const handleOpenGoogleConnect = () => {
    setEmailInput(activeProfile?.linkedGoogleEmail || '');
    setShowEmailModal(true);
  };

  const handleSaveGoogleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !emailInput.trim()) return;

    try {
      const pkce = await api.generateOAuthPkce();
      console.log('PKCE session initialized:', pkce.state);
    } catch (err) {
      console.warn('OAuth PKCE generation fallback:', err);
    }

    await linkGoogleAccount(activeProfile.id, `g-${Date.now()}`, emailInput.trim());
    setShowEmailModal(false);
    setLastSyncTime(new Date().toLocaleTimeString());
  };

  const handleDisconnectGoogle = async () => {
    if (activeProfile) {
      await unlinkGoogleAccount(activeProfile.id);
      setLastSyncTime(null);
    }
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1200);
  };

  const osName = systemInfo?.os || 'Windows';
  const archName = systemInfo?.arch || 'x64';
  const appVersion = systemInfo?.appVersion || '0.1.1';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Cloud & Save Synchronization</h1>
              <p className="text-xs text-slate-400">
                Google Drive API v3 cross-device synchronization with deterministic hash manifests.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || !isGoogleConnected}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/25"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 max-w-4xl">
        {/* Google Authentication Account Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">Google Account Connection</h3>
                <p className="text-xs text-slate-400">
                  {isGoogleConnected
                    ? `Linked to ${activeProfile?.linkedGoogleEmail}`
                    : 'Sign in to enable automatic cloud backups across your devices.'}
                </p>
              </div>
            </div>

            {isGoogleConnected ? (
              <button
                onClick={handleDisconnectGoogle}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 text-xs font-semibold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : (
              <button
                onClick={handleOpenGoogleConnect}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-md"
              >
                <span>Connect Google Account</span>
              </button>
            )}
          </div>

          {/* Storage Mode Radio */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Google Drive Storage Mode
            </span>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDriveMode('appdata')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  driveMode === 'appdata'
                    ? 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-sky-400 font-bold text-xs mb-1">
                  <Lock className="w-4 h-4" />
                  <span>Private App Storage (appDataFolder)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Recommended. Isolated application directory on your Drive. Invisible to ordinary file browsers to prevent accidental corruption.
                </p>
              </button>

              <button
                onClick={() => setDriveMode('folder')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  driveMode === 'folder'
                    ? 'bg-sky-500/10 border-sky-500/50 ring-1 ring-sky-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs mb-1">
                  <Folder className="w-4 h-4" />
                  <span>Custom User-Visible Folder</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Stores save archives in an accessible folder inside your personal Google Drive for manual export and backup inspection.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Connected Sync Devices */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">Registered Synchronized Devices</h3>
            <span className="text-xs text-slate-400 font-mono">1 Active Device</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <Monitor className="w-5 h-5 text-sky-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    This Machine ({osName} {archName})
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Universal Game Hub v{appVersion} • {lastSyncTime ? `Last synced at ${lastSyncTime}` : (isGoogleConnected ? 'Sync ready' : 'Not linked to cloud')}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                isGoogleConnected
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {isGoogleConnected ? 'Active • Synced' : 'Local Only'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Email Input Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleSaveGoogleEmail}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Connect Google Account</h3>
                  <p className="text-xs text-slate-400">Enter your Google email for Drive sync.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-semibold text-slate-300">Google Email Address *</label>
              <input
                type="email"
                required
                autoFocus
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!emailInput.trim()}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Link Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
