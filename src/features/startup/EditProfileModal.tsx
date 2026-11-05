import React, { useState } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { useStartupStore } from '@/stores/startupStore';
import { UserProfile, UpdateProfileInput } from '@/types';
import {
  X,
  Settings,
  Lock,
  KeyRound,
  Gamepad2,
  Palette,
  Check,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
];

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose }) => {
  const { updateProfileDetails, deleteProfile, profiles } = useProfileStore();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatarPath || PRESET_AVATARS[0]);
  const [preferredController, setPreferredController] = useState(profile.preferredController || 'xbox');
  const [themePreference, setThemePreference] = useState(profile.themePreference || 'dark');
  const [changeAuth, setChangeAuth] = useState(false);
  const [authType, setAuthType] = useState<'none' | 'pin' | 'password'>(profile.authType as any || 'none');
  const [newPin, setNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canDelete = profiles.length > 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    const input: UpdateProfileInput = {
      id: profile.id,
      displayName: displayName.trim(),
      avatarPath: selectedAvatar,
      preferredController,
      themePreference,
    };

    if (changeAuth) {
      if (authType === 'none') {
        input.removeAuth = true;
      } else if (authType === 'pin' && newPin.trim()) {
        input.newPin = newPin.trim();
        input.authType = 'pin';
      } else if (authType === 'password' && newPassword.trim()) {
        input.newPassword = newPassword.trim();
        input.authType = 'password';
      }
    }

    try {
      await updateProfileDetails(input);
      onClose();
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;
    await deleteProfile(profile.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Edit Profile: {profile.displayName}
              </h2>
              <p className="text-xs text-slate-400">
                Update avatar, display name, and local security credentials.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-sky-500 controller-focus-ring"
            />
          </div>

          {/* Avatar Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all p-0.5 controller-focus-ring ${
                    selectedAvatar === url
                      ? 'border-sky-400 ring-2 ring-sky-500/30 scale-105'
                      : 'border-slate-800 hover:border-slate-600 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="Preset avatar" className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          </div>

          {/* Theme & Preferred Controller */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Preferred Controller</span>
              </label>
              <select
                value={preferredController}
                onChange={(e) => setPreferredController(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500 controller-focus-ring"
              >
                <option value="xbox">Xbox Wireless</option>
                <option value="playstation">PlayStation DualSense</option>
                <option value="nintendo">Nintendo Switch Pro</option>
                <option value="generic">Generic DirectInput</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
                <Palette className="w-3.5 h-3.5 text-purple-400" />
                <span>Theme</span>
              </label>
              <select
                value={themePreference}
                onChange={(e) => setThemePreference(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-sky-500 controller-focus-ring"
              >
                <option value="dark">Deep Space (Dark)</option>
                <option value="midnight">Midnight Black</option>
                <option value="neon">Cyberpunk Neon</option>
                <option value="retro">Retro Slate</option>
              </select>
            </div>
          </div>

          {/* Authentication Modification */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Authentication Security ({(profile.authType || 'none').toUpperCase()})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setChangeAuth(!changeAuth)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold controller-focus-ring"
              >
                {changeAuth ? 'Keep Existing Security' : 'Change Security'}
              </button>
            </div>

            {changeAuth && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAuthType('none')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold controller-focus-ring ${
                      authType === 'none'
                        ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Remove Protection
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthType('pin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold controller-focus-ring ${
                      authType === 'pin'
                        ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Set New PIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthType('password')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold controller-focus-ring ${
                      authType === 'password'
                        ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    Set New Password
                  </button>
                </div>

                {authType === 'pin' && (
                  <input
                    type="password"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter new 4-digit PIN"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs text-center font-mono tracking-widest controller-focus-ring"
                  />
                )}

                {authType === 'password' && (
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 text-xs controller-focus-ring"
                  />
                )}
              </div>
            )}
          </div>

          {/* Delete Profile Action */}
          {canDelete && (
            <div className="pt-2">
              {confirmDelete ? (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300">
                  <span className="flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Delete this profile and all isolated saves?</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold"
                    >
                      Confirm Delete
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold controller-focus-ring"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Profile</span>
                </button>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors controller-focus-ring"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 controller-focus-ring disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
