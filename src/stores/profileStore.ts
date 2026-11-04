import { create } from 'zustand';
import { UserProfile } from '@/types';
import { api } from '@/services/tauri';

interface ProfileState {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  isLoading: boolean;
  loadProfilesFromDb: () => Promise<void>;
  setProfiles: (profiles: UserProfile[]) => void;
  setActiveProfile: (profile: UserProfile) => void;
  createProfile: (displayName: string, avatarPath?: string) => Promise<UserProfile>;
  deleteProfile: (id: string) => Promise<void>;
  updateProfile: (id: string, updates: Partial<UserProfile>) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'default-profile-uuid',
  displayName: 'Player 1',
  avatarPath: '',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [DEFAULT_PROFILE],
  activeProfile: DEFAULT_PROFILE,
  isLoading: false,

  loadProfilesFromDb: async () => {
    try {
      const list = await api.listProfiles();
      if (list && list.length > 0) {
        set({
          profiles: list,
          activeProfile: list.find((p) => p.isDefault) || list[0],
        });
      }
    } catch (e) {
      console.warn('Could not fetch profiles from SQLite:', e);
    }
  },

  setProfiles: (profiles) => set({ profiles }),

  setActiveProfile: (profile) => set({ activeProfile: profile }),

  createProfile: async (displayName, avatarPath) => {
    try {
      const created = await api.createProfile(displayName, avatarPath);
      set((state) => ({
        profiles: [...state.profiles, created],
      }));
      return created;
    } catch {
      const fallback: UserProfile = {
        id: `profile-${Date.now()}`,
        displayName,
        avatarPath,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        profiles: [...state.profiles, fallback],
      }));
      return fallback;
    }
  },

  deleteProfile: async (id) => {
    const { profiles, activeProfile } = get();
    if (profiles.length <= 1) return;
    try {
      await api.deleteProfile(id);
    } catch (e) {
      console.warn('Backend delete error:', e);
    }
    const remaining = profiles.filter((p) => p.id !== id);
    let nextActive = activeProfile;
    if (activeProfile?.id === id) {
      nextActive = remaining[0];
    }
    set({ profiles: remaining, activeProfile: nextActive });
  },

  updateProfile: (id, updates) => {
    set((state) => {
      const updated = state.profiles.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const nextActive =
        state.activeProfile?.id === id
          ? { ...state.activeProfile, ...updates, updatedAt: new Date().toISOString() }
          : state.activeProfile;
      return { profiles: updated, activeProfile: nextActive };
    });
  },
}));
