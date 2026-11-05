import React from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { useStartupStore } from '@/stores/startupStore';
import { UserProfile } from '@/types';
import {
  UserPlus,
  Lock,
  Sparkles,
  Settings,
  Power,
  CloudDownload,
  Gamepad2,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ProfileSelectionScreen: React.FC = () => {
  const { profiles } = useProfileStore();
  const {
    chooseProfile,
    setStartupState,
    setTargetEditProfile,
    exitApp,
  } = useStartupStore();

  const handleSelect = (profile: UserProfile) => {
    chooseProfile(profile);
  };

  const handleEdit = (e: React.MouseEvent, profile: UserProfile) => {
    e.stopPropagation();
    setTargetEditProfile(profile);
  };

  return (
    <div className="relative min-h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col justify-between p-8 sm:p-12 select-none overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-r from-sky-600/10 via-indigo-600/10 to-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-6xl mx-auto z-10 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-sky-500/20">
            GH
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center">
              <span>Universal Game Hub</span>
              <span className="text-sky-400 font-normal text-xs ml-2.5 px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30">
                Who's Playing?
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Select your local player profile to access your isolated library, saves, and stats.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setStartupState('RecoveringProfile')}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-sky-400 hover:text-sky-300 rounded-xl text-xs font-semibold transition-all shadow-sm controller-focus-ring"
            title="Recover existing profile from Google Drive"
          >
            <CloudDownload className="w-4 h-4" />
            <span className="hidden sm:inline">Connect Google Account</span>
          </button>

          <button
            onClick={exitApp}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition-all controller-focus-ring"
            title="Exit application"
          >
            <Power className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Main Profile Cards Grid */}
      <div className="my-auto py-8 w-full max-w-6xl mx-auto z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Render All Local Profiles */}
          {profiles.map((profile, idx) => {
            const hasAuth = profile.authenticationEnabled && profile.authType !== 'none';

            return (
              <div
                key={profile.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(profile)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(profile);
                  }
                }}
                className="group relative flex flex-col items-center text-center p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-[#0c121e]/90 border border-slate-800 hover:border-sky-500/80 hover:shadow-2xl hover:shadow-sky-500/15 transition-all duration-300 cursor-pointer controller-focus-ring focus:outline-none"
              >
                {/* Default Profile Ribbon */}
                {profile.isDefault && (
                  <span className="absolute top-3.5 left-3.5 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-sky-400" />
                    <span>Default</span>
                  </span>
                )}

                {/* Settings Gear Button */}
                <button
                  type="button"
                  onClick={(e) => handleEdit(e, profile)}
                  aria-label={`Configure ${profile.displayName} profile`}
                  className="absolute top-3 right-3 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-slate-800 transition-colors opacity-70 group-hover:opacity-100 controller-focus-ring"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Profile Large Avatar */}
                <div className="relative mt-2 mb-4">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 p-0.5 shadow-xl group-hover:scale-105 transition-transform duration-300">
                    {profile.avatarPath ? (
                      <img
                        src={profile.avatarPath}
                        alt={profile.displayName}
                        className="w-full h-full object-cover rounded-[22px]"
                      />
                    ) : (
                      <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center text-white text-3xl font-black">
                        {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 'P'}
                      </div>
                    )}
                  </div>

                  {/* Auth Indicator Badge */}
                  {hasAuth && (
                    <div
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-slate-950 border border-amber-500/60 text-amber-400 shadow-md"
                      title={profile.authType === 'pin' ? 'PIN Protected' : 'Password Protected'}
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="text-base font-bold text-white tracking-tight group-hover:text-sky-300 transition-colors flex items-center justify-center">
                  <span>{profile.displayName}</span>
                  {profile.isDefault && <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1.5" />}
                </h2>

                {/* Metadata / Last Played / Cloud Status */}
                <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                  {profile.linkedGoogleEmail ? (
                    <span className="inline-flex items-center text-emerald-400">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      <span>Cloud Linked</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">Offline Local Profile</span>
                  )}

                  {profile.lastPlayedGame && (
                    <div className="flex items-center justify-center text-slate-400 truncate max-w-[180px]">
                      <Clock className="w-3 h-3 mr-1 text-sky-400 shrink-0" />
                      <span className="truncate">{profile.lastPlayedGame}</span>
                    </div>
                  )}
                </div>

                {/* Controller Selection Action Hint */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-sky-400 group-hover:text-white transition-colors flex items-center space-x-1.5">
                    <span>Press A / Click to Play</span>
                  </span>
                </div>
              </div>
            );
          })}

          {/* Add Profile Card */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setStartupState('CreatingProfile')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setStartupState('CreatingProfile');
              }
            }}
            className="group relative flex flex-col items-center justify-center text-center p-6 rounded-3xl bg-slate-900/40 border-2 border-dashed border-slate-800 hover:border-sky-500 hover:bg-slate-900/80 hover:shadow-xl transition-all duration-300 cursor-pointer controller-focus-ring focus:outline-none min-h-[220px]"
          >
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 group-hover:bg-sky-500/20 text-sky-400 flex items-center justify-center transition-all mb-3 group-hover:scale-110">
              <UserPlus className="w-8 h-8" />
            </div>
            <h2 className="text-sm font-bold text-slate-200 group-hover:text-white">Add New Profile</h2>
            <p className="text-[11px] text-slate-500 mt-1 max-w-[160px]">
              Create an isolated local player profile completely offline.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controller Navigation Hints */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4 z-10 font-mono">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-sky-400 font-bold">A</kbd>
            <span>Select Profile</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">D-Pad / Stick</kbd>
            <span>Navigate</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <kbd className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-400">X</kbd>
            <span>Add Profile</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-slate-400">
          <Gamepad2 className="w-4 h-4 text-sky-400" />
          <span>Controller Ready</span>
        </div>
      </div>
    </div>
  );
};

