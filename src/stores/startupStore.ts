import { create } from 'zustand';
import { StartupState, UserProfile } from '@/types';
import { api } from '@/services/tauri';
import { useProfileStore } from './profileStore';
import { useLibraryStore } from './libraryStore';
import { useControllerStore } from './controllerStore';

interface StartupStoreState {
  startupState: StartupState;
  currentTaskMessage: string;
  progressPercent: number;
  selectedCandidate: UserProfile | null;
  errorMessage: string | null;
  targetEditProfile: UserProfile | null;
  isSwitchConfirmOpen: boolean;

  setStartupState: (state: StartupState) => void;
  setSelectedCandidate: (candidate: UserProfile | null) => void;
  setTargetEditProfile: (profile: UserProfile | null) => void;
  setIsSwitchConfirmOpen: (open: boolean) => void;
  setErrorMessage: (msg: string | null) => void;

  runStartupSequence: () => Promise<void>;
  chooseProfile: (profile: UserProfile) => Promise<void>;
  completeAuthenticationAndLaunch: (profile: UserProfile) => Promise<void>;
  switchProfileRequest: () => void;
  confirmProfileSwitch: () => void;
  cancelProfileSwitch: () => void;
  exitApp: () => Promise<void>;
}

export const useStartupStore = create<StartupStoreState>((set, get) => ({
  startupState: 'Initializing',
  currentTaskMessage: 'Initializing Universal Game Hub...',
  progressPercent: 10,
  selectedCandidate: null,
  errorMessage: null,
  targetEditProfile: null,
  isSwitchConfirmOpen: false,

  setStartupState: (state) => set({ startupState: state }),
  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
  setTargetEditProfile: (profile) => set({ targetEditProfile: profile }),
  setIsSwitchConfirmOpen: (open) => set({ isSwitchConfirmOpen: open }),
  setErrorMessage: (msg) => set({ errorMessage: msg }),

  runStartupSequence: async () => {
    try {
      // 1. Initializing Universal Game Hub
      set({
        startupState: 'Initializing',
        currentTaskMessage: 'Initializing Universal Game Hub...',
        progressPercent: 15,
      });

      // 2. Loading configuration
      await new Promise((r) => setTimeout(r, 120));
      set({
        currentTaskMessage: 'Loading configuration and platform adapter...',
        progressPercent: 30,
      });

      // 3. Initializing local database & migrations
      const diagnostics = await api.initStartupDiagnostics();
      set({
        startupState: 'DatabaseReady',
        currentTaskMessage: 'Initializing local SQLite database and verifying migrations...',
        progressPercent: 55,
      });

      // 4. Loading profiles
      set({
        startupState: 'LoadingProfiles',
        currentTaskMessage: 'Loading local gaming profiles...',
        progressPercent: 75,
      });
      const profiles = await useProfileStore.getState().loadProfilesFromDb();

      // 5. Initializing controller services
      set({
        currentTaskMessage: 'Initializing controller subsystem & Gilrs visualizer...',
        progressPercent: 90,
      });
      try {
        const controllers = await api.listControllers();
        if (controllers && controllers.length > 0) {
          useControllerStore.getState().setConnectedControllers(controllers);
        }
      } catch (err) {
        console.warn('Controller initialization warning:', err);
      }

      // 6. Preparing gaming environment
      set({
        currentTaskMessage: 'Preparing gaming environment...',
        progressPercent: 100,
      });
      await new Promise((r) => setTimeout(r, 150));

      // 7. Check whether profiles exist; if none, navigate to profile creation
      if (!profiles || profiles.length === 0) {
        set({
          startupState: 'CreatingProfile',
          currentTaskMessage: 'No profile found. Please create your local profile.',
        });
      } else {
        set({
          startupState: 'ProfileSelection',
          currentTaskMessage: 'Profile Selection Ready.',
        });
      }
    } catch (err: any) {
      console.error('Startup sequence failed:', err);
      set({
        startupState: 'Error',
        errorMessage: err?.message || String(err) || 'Failed to complete startup initialization.',
      });
    }
  },

  chooseProfile: async (profile: UserProfile) => {
    // If profile has PIN/password authentication enabled, challenge user
    if (profile.authenticationEnabled && profile.authType !== 'none') {
      set({
        selectedCandidate: profile,
        startupState: 'AuthenticatingProfile',
      });
    } else {
      await get().completeAuthenticationAndLaunch(profile);
    }
  },

  completeAuthenticationAndLaunch: async (profile: UserProfile) => {
    set({
      startupState: 'LoadingProfile',
      currentTaskMessage: `Loading profile: ${profile.displayName}...`,
    });

    // Cleanly isolate: unload previous library & profile state first
    useLibraryStore.getState().setGames([]);
    useProfileStore.getState().setActiveProfile(profile);

    // Load active profile's library, play history & favorites
    try {
      await useLibraryStore.getState().loadGamesFromDb(profile.id);
    } catch (err) {
      console.warn('Could not load profile games from DB:', err);
    }

    set({
      startupState: 'DashboardReady',
      selectedCandidate: null,
      currentTaskMessage: 'Dashboard Ready',
    });
  },

  switchProfileRequest: () => {
    set({ isSwitchConfirmOpen: true });
  },

  confirmProfileSwitch: () => {
    // Cleanly isolate: unload current profile state and reset library store
    useProfileStore.getState().unloadActiveProfile();
    useLibraryStore.getState().setGames([]);
    set({
      isSwitchConfirmOpen: false,
      selectedCandidate: null,
      startupState: 'ProfileSelection',
    });
  },

  cancelProfileSwitch: () => {
    set({ isSwitchConfirmOpen: false });
  },

  exitApp: async () => {
    await api.exitApplication();
  },
}));
