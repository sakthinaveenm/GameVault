import React, { useState } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { useStartupStore } from '@/stores/startupStore';
import { CreateProfileInput } from '@/types';
import {
  UserPlus,
  ArrowLeft,
  Lock,
  KeyRound,
  Gamepad2,
  Palette,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
];

export const CreateProfileScreen: React.FC = () => {
  const { profiles, createProfile } = useProfileStore();
  const { setStartupState, completeAuthenticationAndLaunch } = useStartupStore();

  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [authType, setAuthType] = useState<'none' | 'pin' | 'password'>('none');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [preferredController, setPreferredController] = useState('xbox');
  const [themePreference, setThemePreference] = useState('dark');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setValidationError('Please enter a player display name.');
      return;
    }

    if (authType === 'pin' && pin.trim().length < 4) {
      setValidationError('PIN must be at least 4 digits.');
      return;
    }

    if (authType === 'password' && password.trim().length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const input: CreateProfileInput = {
      displayName: displayName.trim(),
      avatarPath: selectedAvatar,
      authType,
      pin: authType === 'pin' ? pin.trim() : undefined,
      password: authType === 'password' ? password.trim() : undefined,
      preferredController,
      themePreference,
    };

    try {
      const created = await createProfile(input);
      // Immediately launch into gaming environment with newly created profile
      await completeAuthenticationAndLaunch(created);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create profile in local database.');
      setIsSubmitting(false);
    }
  };

  const canGoBack = profiles.length > 0;

  return (
    <div className="relative min-h-screen w-screen bg-[#07090e] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-y-auto font-sans">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-3xl mx-auto z-10 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          {canGoBack && (
            <button
              type="button"
              onClick={() => setStartupState('ProfileSelection')}
              aria-label="Back to profile selection"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors controller-focus-ring"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Create Local Player Profile</h1>
            <p className="text-xs text-slate-400">
              100% Offline. Your saves, playtime, and settings will be stored locally.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
          <Shield className="w-3 h-3" />
          <span>Local SQLite Storage</span>
        </span>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto my-6 space-y-6 z-10">
        {validationError && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2 animate-shake">
            <span>{validationError}</span>
          </div>
        )}

        {/* Display Name & Avatar Picker Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Player Display Name *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. ShadowRacer, Player 1, CyberValkyrie"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 text-sm font-semibold focus:outline-none focus:border-sky-500 transition-colors controller-focus-ring"
            />
          </div>

          {/* Avatar Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-3">
              {PRESET_AVATARS.map((url, idx) => {
                const isSelected = selectedAvatar === url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-0.5 controller-focus-ring ${
                      isSelected
                        ? 'border-sky-400 ring-4 ring-sky-500/20 scale-105'
                        : 'border-slate-800 hover:border-slate-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt="Avatar option" className="w-full h-full object-cover rounded-xl" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Optional Authentication Card */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center">
                <Lock className="w-4 h-4 text-amber-400 mr-2" />
                <span>Profile Authentication (Optional)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Protect your game saves and statistics from other local players.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setAuthType('none')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center space-y-1 transition-all controller-focus-ring ${
                authType === 'none'
                  ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>No Security (Instant)</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthType('pin')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center space-y-1 transition-all controller-focus-ring ${
                authType === 'pin'
                  ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>4-Digit PIN</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthType('password')}
              className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center space-y-1 transition-all controller-focus-ring ${
                authType === 'password'
                  ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Password</span>
            </button>
          </div>

          {/* Conditional Input */}
          {authType === 'pin' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-300">Enter 4-Digit Local PIN</label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-48 tracking-widest text-center text-lg font-mono px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 focus:outline-none focus:border-amber-400 controller-focus-ring"
              />
              <p className="text-[11px] text-slate-500">
                Encrypted via SHA-256 with cryptographic salt before saving to SQLite.
              </p>
            </div>
          )}

          {authType === 'password' && (
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-300">Enter Local Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full max-w-sm px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 controller-focus-ring"
              />
            </div>
          )}
        </div>

        {/* Preferences (Theme & Controller) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Gamepad2 className="w-4 h-4 text-sky-400" />
              <span>Preferred Controller</span>
            </label>
            <select
              value={preferredController}
              onChange={(e) => setPreferredController(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500 controller-focus-ring"
            >
              <option value="xbox">Xbox Wireless / Elite Controller</option>
              <option value="playstation">PlayStation DualSense / DualShock</option>
              <option value="nintendo">Nintendo Switch Pro Controller</option>
              <option value="generic">Generic DirectInput / Keyboard</option>
            </select>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Visual Theme</span>
            </label>
            <select
              value={themePreference}
              onChange={(e) => setThemePreference(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500 controller-focus-ring"
            >
              <option value="dark">Deep Space (Standard Dark)</option>
              <option value="midnight">Midnight OLED Black</option>
              <option value="neon">Cyberpunk Neon Sky</option>
              <option value="retro">Retro Slate Gray</option>
            </select>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end space-x-4 pt-3">
          {canGoBack && (
            <button
              type="button"
              onClick={() => setStartupState('ProfileSelection')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition-colors controller-focus-ring"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-7 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-500/25 controller-focus-ring disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Profile...' : 'Save & Start Playing'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
