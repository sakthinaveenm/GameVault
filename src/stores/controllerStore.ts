import { create } from 'zustand';
import { ControllerInfo } from '@/types';

interface ControllerState {
  connectedControllers: ControllerInfo[];
  activeController: ControllerInfo | null;
  focusedElementId: string | null;
  showHints: boolean;
  setConnectedControllers: (controllers: ControllerInfo[]) => void;
  setActiveController: (controller: ControllerInfo | null) => void;
  setFocusedElementId: (id: string | null) => void;
  toggleHints: () => void;
}

export const useControllerStore = create<ControllerState>((set) => ({
  connectedControllers: [],
  activeController: null,
  focusedElementId: null,
  showHints: true,

  setConnectedControllers: (controllers) =>
    set({
      connectedControllers: controllers,
      activeController: controllers.length > 0 ? controllers[0] : null,
    }),

  setActiveController: (controller) => set({ activeController: controller }),

  setFocusedElementId: (id) => set({ focusedElementId: id }),

  toggleHints: () => set((state) => ({ showHints: !state.showHints })),
}));

