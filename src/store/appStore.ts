import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AllSettings, DEFAULT_SETTINGS } from '../types/settings';

interface AppState {
  settings: AllSettings;
  updateSettings: (section: keyof AllSettings, values: Partial<AllSettings[keyof AllSettings]>) => void;
  resetSection: (section: keyof AllSettings) => void;
  resetAll: () => void;
  setSettings: (settings: AllSettings) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },

      updateSettings: (section, values) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: {
              ...state.settings[section],
              ...values,
            },
          },
        })),

      resetSection: (section) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [section]: { ...(DEFAULT_SETTINGS[section] as any) },
          },
        })),

      resetAll: () => set({ settings: { ...DEFAULT_SETTINGS } }),

      setSettings: (settings) => set({ settings }),
    }),
    {
      name: 'pinc-settings',
      partialize: (state) => ({
        settings: state.settings,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AppState>;
        return {
          ...currentState,
          ...persisted,
        };
      },
    }
  )
);