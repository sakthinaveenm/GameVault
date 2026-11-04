import React, { useState } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import { UserProfile } from '@/types';
import {
  Users,
  UserPlus,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  User,
  Sparkles,
} from 'lucide-react';

export const ProfilesScreen: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile, createProfile, deleteProfile } =
    useProfileStore();

  const [newProfileName, setNewProfileName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const created = await createProfile(newProfileName.trim());
    setActiveProfile(created);
    setNewProfileName('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-8 pt-6 pb-4 bg-[#0b0e14] border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">Profile Management</h1>
              <p className="text-xs text-slate-400">
                Independent user profiles with isolated save directories, cloud sync, and settings.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New Profile</span>
          </button>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
          {profiles.map((p) => {
            const isActive = activeProfile?.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => setActiveProfile(p)}
                className={`relative p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-br from-indigo-950/60 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/15 ring-2 ring-indigo-500/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                      {p.displayName ? p.displayName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center">
                        {p.displayName}
                        {isActive && <Sparkles className="w-4 h-4 text-amber-400 ml-1.5" />}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {p.linkedGoogleEmail ? (
                          <span className="text-emerald-400 flex items-center">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {p.linkedGoogleEmail}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">Local-Only Profile</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </span>
                  ) : (
                    profiles.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteProfile(p.id);
                        }}
                        title="Delete Profile"
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                  <span className="font-semibold text-slate-400">
                    {isActive ? 'Current Session' : 'Click to Switch'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Profile Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Create Local Profile</h3>
                <p className="text-xs text-slate-400">Independent save and library profile.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Profile Name</label>
              <input
                type="text"
                autoFocus
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g. RetroGamer, Guest"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProfileName.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Create Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

