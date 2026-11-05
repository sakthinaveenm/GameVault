import { create } from 'zustand';
import { CreateProfileInput, UpdateProfileInput, UserProfile } from '@/types';
import { api } from '@/services/tauri';

interface ProfileState {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  isLoading: boolean;
  loadProfilesFromDb: () => Promise<UserProfile[]>;
  setProfiles: (profiles: UserProfile[]) => void;
  setActiveProfile: (profile: UserProfile | null) => void;
  unloadActiveProfile: () => void;
  createProfile: (input: CreateProfileInput) => Promise<UserProfile>;
  updateProfileDetails: (input: UpdateProfileInput) => Promise<UserProfile>;
  deleteProfile: (id: string) => Promise<void>;
  setDefaultProfile: (id: string) => Promise<void>;
  linkGoogleAccount: (profileId: string, googleAccountId: string, googleEmail: string) => Promise<void>;
  unlinkGoogleAccount: (profileId: string) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,

  loadProfilesFromDb: async () => {
    set({ isLoading: true });
    try {
      const list = await api.listProfiles();
      set({ profiles: list, isLoading: false });
      return list;
    } catch (e) {
      console.warn('Could not fetch profiles from SQLite:', e);
      set({ isLoading: false });
      return [];
    }
  },

  setProfiles: (profiles) => set({ profiles }),

  setActiveProfile: (profile) => set({ activeProfile: profile }),

  unloadActiveProfile: () => {
    set({ activeProfile: null });
  },

  createProfile: async (input) => {
    try {
      const created = await api.createFullProfile(input);
      set((state) => ({
        profiles: [...state.profiles, created],
      }));
      return created;
    } catch (err) {
      console.warn('Backend create profile failed, fallback:', err);
      const fallback: UserProfile = {
        id: `profile-${Date.now()}`,
        displayName: input.displayName,
        avatarPath: input.avatarPath,
        isDefault: get().profiles.length === 0,
        authenticationEnabled: input.authType !== 'none',
        authType: input.authType || 'none',
        themePreference: input.themePreference || 'dark',
        preferredController: input.preferredController,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        profiles: [...state.profiles, fallback],
      }));
      return fallback;
    }
  },

  updateProfileDetails: async (input) => {
    try {
      const updated = await api.updateUserProfile(input);
      set((state) => {
        const nextList = state.profiles.map((p) => (p.id === input.id ? updated : p));
        const nextActive = state.activeProfile?.id === input.id ? updated : state.activeProfile;
        return { profiles: nextList, activeProfile: nextActive };
      });
      return updated;
    } catch (err) {
      console.warn('Backend update failed:', err);
      const existing = get().profiles.find((p) => p.id === input.id);
      if (existing) {
        const updated: UserProfile = {
          ...existing,
          displayName: input.displayName || existing.displayName,
          avatarPath: input.avatarPath !== undefined ? input.avatarPath : existing.avatarPath,
          themePreference: input.themePreference || existing.themePreference,
          preferredController: input.preferredController !== undefined ? input.preferredController : existing.preferredController,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          profiles: state.profiles.map((p) => (p.id === input.id ? updated : p)),
          activeProfile: state.activeProfile?.id === input.id ? updated : state.activeProfile,
        }));
        return updated;
      }
      throw err;
    }
  },

  setDefaultProfile: async (id) => {
    try {
      await api.setDefaultProfile(id);
      set((state) => ({
        profiles: state.profiles.map((p) => ({ ...p, isDefault: p.id === id })),
      }));
    } catch (e) {
      console.warn('Set default profile error:', e);
    }
  },

  linkGoogleAccount: async (profileId, googleAccountId, googleEmail) => {
    try {
      await api.linkGoogleAccount(profileId, googleAccountId, googleEmail);
      set((state) => {
        const updated = state.profiles.map((p) =>
          p.id === profileId ? { ...p, linkedGoogleEmail: googleEmail } : p
        );
        const active =
          state.activeProfile?.id === profileId
            ? { ...state.activeProfile, linkedGoogleEmail: googleEmail }
            : state.activeProfile;
        return { profiles: updated, activeProfile: active };
      });
    } catch (e) {
      console.warn('Link Google error:', e);
    }
  },

  unlinkGoogleAccount: async (profileId) => {
    try {
      await api.unlinkGoogleAccount(profileId);
      set((state) => {
        const updated = state.profiles.map((p) =>
          p.id === profileId ? { ...p, linkedGoogleEmail: undefined } : p
        );
        const active =
          state.activeProfile?.id === profileId
            ? { ...state.activeProfile, linkedGoogleEmail: undefined }
            : state.activeProfile;
        return { profiles: updated, activeProfile: active };
      });
    } catch (e) {
      console.warn('Unlink Google error:', e);
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
      nextActive = null;
    }
    set({ profiles: remaining, activeProfile: nextActive });
  },
}));
