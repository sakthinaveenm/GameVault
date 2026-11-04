import { create } from 'zustand';
import { UserProfile } from '@/types';

interface ProfileState {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  isLoading: boolean;
  setProfiles: (profiles: UserProfile[]) => void;
  setActiveProfile: (profile: UserProfile) => void;
  createProfile: (displayName: string, avatarPath?: string) => UserProfile;
  deleteProfile: (id: string) => void;
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

  setProfiles: (profiles) => set({ profiles }),

  setActiveProfile: (profile) => set({ activeProfile: profile }),

  createProfile: (displayName, avatarPath) => {
    const newProfile: UserProfile = {
      id: `profile-${Date.now()}`,
      displayName,
      avatarPath,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      profiles: [...state.profiles, newProfile],
    }));
    return newProfile;
  },

  deleteProfile: (id) => {
    const { profiles, activeProfile } = get();
    if (profiles.length <= 1) return; // Cannot delete last profile
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
      const nextActive = state.activeProfile?.id === id
        ? { ...state.activeProfile, ...updates, updatedAt: new Date().toISOString() }
        : state.activeProfile;
      return { profiles: updated, activeProfile: nextActive };
    });
  },
}));

