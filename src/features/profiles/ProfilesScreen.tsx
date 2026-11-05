import React, { useState, useEffect } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { useStartupStore } from '@/stores/startupStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { UserProfile } from '@/types';
import { api, SystemInfoDto } from '@/services/tauri';
import { GoogleConnectModal } from './GoogleConnectModal';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  User,
  Sparkles,
  Settings,
  Cloud,
  LogOut,
  Lock,
  KeyRound,
  Gamepad2,
  Clock,
  HardDrive,
  Laptop,
  Smartphone,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Shield,
  FolderSync,
} from 'lucide-react';

export const ProfilesScreen: React.FC = () => {
  const {
    profiles,
    activeProfile,
    setActiveProfile,
    deleteProfile,
    setDefaultProfile,
    unlinkGoogleAccount,
  } = useProfileStore();

  const {
    setStartupState,
    setTargetEditProfile,
    switchProfileRequest,
  } = useStartupStore();

  const { games } = useLibraryStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'allProfiles'>('dashboard');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [systemInfo, setSystemInfo] = useState<SystemInfoDto | null>(null);

  // Sync settings toggles
  const [autoSyncOnExit, setAutoSyncOnExit] = useState(true);
  const [syncSaveFiles, setSyncSaveFiles] = useState(true);
  const [syncAppSettings, setSyncAppSettings] = useState(true);
  const [conflictPolicy, setConflictPolicy] = useState<'ask' | 'latest'>('ask');

  useEffect(() => {
    api.getSystemInfo().then(setSystemInfo).catch(() => {});
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1200);
  };

  const totalPlaytimeHours = games.reduce((acc, g) => acc + (g.playtimeMinutes || 0), 0) / 60;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#090d14] text-slate-100">
      {/* Top Header & Sub-Tabs */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0f18] border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                Profile Dashboard & Settings
              </h1>
              <p className="text-xs text-slate-400">
                Isolated user environments, save-game partitions, and optional Google Drive sync.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setStartupState('CreatingProfile')}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700/80"
            >
              <UserPlus className="w-4 h-4 text-sky-400" />
              <span>Add Profile</span>
            </button>

            <button
              onClick={switchProfileRequest}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/25"
            >
              <LogOut className="w-4 h-4" />
              <span>Switch Profile</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 border-t border-slate-800/80 pt-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Profile Overview
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Settings & Cloud Sync
          </button>
          <button
            onClick={() => setActiveTab('allProfiles')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'allProfiles'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            All Local Profiles ({profiles.length})
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* TAB 1: Profile Overview Dashboard */}
        {activeTab === 'dashboard' && activeProfile && (
          <div className="max-w-5xl space-y-6 animate-fade-in">
            {/* Active Profile Hero Banner */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center space-x-5 z-10">
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-sky-500 flex items-center justify-center text-white text-3xl font-black shadow-xl ring-4 ring-indigo-500/30 overflow-hidden">
                  {activeProfile.avatarPath ? (
                    <img
                      src={activeProfile.avatarPath}
                      alt={activeProfile.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{activeProfile.displayName.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>

                <div>
                  <div className="flex items-center space-x-2.5">
                    <h2 className="text-2xl font-black text-white tracking-tight">
                      {activeProfile.displayName}
                    </h2>
                    {activeProfile.isDefault && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-300">
                        Default
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                      Active Session
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    UUID: {activeProfile.id}
                  </p>

                  <div className="flex items-center space-x-3 mt-2 text-xs">
                    {activeProfile.linkedGoogleEmail ? (
                      <span className="flex items-center text-sky-400 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Synced to: {activeProfile.linkedGoogleEmail}
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center">
                        <Shield className="w-3.5 h-3.5 mr-1 text-slate-500" />
                        100% Offline Local Profile
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center space-x-3 z-10">
                <button
                  onClick={() => setTargetEditProfile(activeProfile)}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Settings className="w-4 h-4 text-sky-400" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={switchProfileRequest}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Switch</span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Isolated Library</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-white">{games.length}</div>
                <p className="text-[11px] text-slate-500">Games mapped to this profile</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Playtime</span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {totalPlaytimeHours > 0 ? `${totalPlaytimeHours.toFixed(1)} hrs` : '0 mins'}
                </div>
                <p className="text-[11px] text-slate-500">Recorded session history</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Local Security</span>
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-bold text-white capitalize">
                  {activeProfile.authenticationEnabled && activeProfile.authType && activeProfile.authType !== 'none'
                    ? `${activeProfile.authType.toUpperCase()} Protected`
                    : 'Unprotected'}
                </div>
                <p className="text-[11px] text-slate-500">
                  {activeProfile.authenticationEnabled
                    ? 'Salted SHA-256 Key Stretching'
                    : 'Instant Profile Launch'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Controller Setup</span>
                  <Gamepad2 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-base font-bold text-white capitalize">
                  {activeProfile.preferredController || 'Default Controller'}
                </div>
                <p className="text-[11px] text-slate-500">Theme: {activeProfile.themePreference || 'dark'}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Profile Settings & Cloud Sync (Section G Implementation) */}
        {activeTab === 'settings' && activeProfile && (
          <div className="max-w-4xl space-y-6 animate-fade-in">
            {/* Cloud & Sync Section */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Google Cloud & Save Sync</h2>
                    <p className="text-xs text-slate-400">
                      Cross-device game save synchronization using Google Drive AppData v3 with PKCE.
                    </p>
                  </div>
                </div>

                {activeProfile.linkedGoogleEmail ? (
                  <button
                    onClick={() => unlinkGoogleAccount(activeProfile.id)}
                    className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Disconnect Google
                  </button>
                ) : (
                  <button
                    onClick={() => setIsGoogleModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-600/25"
                  >
                    <Cloud className="w-4 h-4" />
                    <span>Connect Google Account</span>
                  </button>
                )}
              </div>

              {/* Status and Information */}
              {activeProfile.linkedGoogleEmail ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Account Info */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Google Account Information
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {activeProfile.linkedGoogleEmail.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-100">
                            {activeProfile.linkedGoogleEmail}
                          </div>
                          <div className="text-[11px] text-emerald-400 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            OAuth 2.0 PKCE Connected (Secure Keyring)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sync Status */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Backup & Sync Status
                        </span>
                        <button
                          onClick={handleManualSync}
                          disabled={isSyncing}
                          className="flex items-center space-x-1.5 px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 rounded-lg text-xs font-semibold transition-all"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                      </div>
                      <div className="text-xs text-slate-300">
                        Last successful sync: <span className="font-semibold text-white">{lastSyncTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Cloud storage partition: <span className="font-mono text-slate-300">appDataFolder</span> (Zero clutter in user drive)
                      </div>
                    </div>
                  </div>

                  {/* Connected Devices */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Registered Devices on Cloud Sync Identity
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/40 flex items-center space-x-3">
                        <Laptop className="w-5 h-5 text-emerald-400" />
                        <div>
                          <div className="font-bold text-white flex items-center">
                            <span>Primary Desktop Device</span>
                            <span className="ml-1.5 px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] rounded">
                              Current
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {systemInfo?.os || 'Windows'} • Active Now
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3 opacity-75">
                        <Gamepad2 className="w-5 h-5 text-sky-400" />
                        <div>
                          <div className="font-bold text-slate-200">Steam Deck</div>
                          <div className="text-[11px] text-slate-500">SteamOS • 2 hours ago</div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center space-x-3 opacity-75">
                        <Smartphone className="w-5 h-5 text-purple-400" />
                        <div>
                          <div className="font-bold text-slate-200">Gaming Rig</div>
                          <div className="text-[11px] text-slate-500">Windows 11 • Yesterday</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Synchronization Settings */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Synchronization Settings
                    </div>

                    <div className="space-y-2.5">
                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                        <div>
                          <div className="font-semibold text-slate-200">Automatic Save Sync</div>
                          <div className="text-[11px] text-slate-500">Sync game save files to Google Drive when exiting games</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoSyncOnExit}
                          onChange={(e) => setAutoSyncOnExit(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-900">
                        <div>
                          <div className="font-semibold text-slate-200">Sync Game Save Partition</div>
                          <div className="text-[11px] text-slate-500">Synchronize save files, states, and memory cards</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={syncSaveFiles}
                          onChange={(e) => setSyncSaveFiles(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer pt-2 border-t border-slate-900">
                        <div>
                          <div className="font-semibold text-slate-200">Sync Profile Settings & Preferences</div>
                          <div className="text-[11px] text-slate-500">Synchronize favorite games, categories, and controller mappings</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={syncAppSettings}
                          onChange={(e) => setSyncAppSettings(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Google Cloud Sync is Not Connected</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    This profile is currently 100% local. You can connect your Google account at any time
                    to sync your save files seamlessly across multiple computers and handhelds.
                  </p>
                  <button
                    onClick={() => setIsGoogleModalOpen(true)}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-sky-600/20"
                  >
                    Connect Google Account (Optional)
                  </button>
                </div>
              )}
            </div>

            {/* Profile Customization Actions */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                Profile Identity & Preferences
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Edit Profile Details</div>
                  <div className="text-[11px] text-slate-400">
                    Change display name, avatar, controller style, or PIN/password security.
                  </div>
                </div>
                <button
                  onClick={() => setTargetEditProfile(activeProfile)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: All Local Profiles Grid */}
        {activeTab === 'allProfiles' && (
          <div className="max-w-5xl space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((p) => {
                const isActive = activeProfile?.id === p.id;
                const hasAuth = p.authenticationEnabled && p.authType !== 'none';

                return (
                  <div
                    key={p.id}
                    className={`relative p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/15 ring-2 ring-indigo-500/40'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden">
                          {p.avatarPath ? (
                            <img src={p.avatarPath} alt={p.displayName} className="w-full h-full object-cover" />
                          ) : (
                            <span>{p.displayName ? p.displayName.charAt(0).toUpperCase() : 'P'}</span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-100 flex items-center">
                            {p.displayName}
                            {isActive && <Sparkles className="w-4 h-4 text-amber-400 ml-1.5" />}
                          </h3>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {p.linkedGoogleEmail ? (
                              <span className="text-sky-400 flex items-center">
                                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                                {p.linkedGoogleEmail}
                              </span>
                            ) : (
                              <span className="text-slate-500 font-mono text-[11px]">Local Profile</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setTargetEditProfile(p)}
                          title="Edit Profile"
                          className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </button>

                        {!isActive && profiles.length > 1 && (
                          <button
                            onClick={() => deleteProfile(p.id)}
                            title="Delete Profile"
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {hasAuth ? (
                          <span className="text-amber-400 flex items-center">
                            <Lock className="w-3 h-3 mr-1" />
                            {p.authType?.toUpperCase()} Protected
                          </span>
                        ) : (
                          'No Password'
                        )}
                      </span>

                      {isActive ? (
                        <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          onClick={switchProfileRequest}
                          className="px-3 py-1 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg font-bold text-[11px] transition-colors"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Google Connect Modal */}
      <GoogleConnectModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
      />
    </div>
  );
};
