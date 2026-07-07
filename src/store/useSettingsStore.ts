import { create } from 'zustand';
import { AppSettings } from '../types';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { useApplicationStore } from './useApplicationStore';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    dailyGoal: 3,
    notificationsEnabled: true,
    theme: 'light',
  },
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await SettingsRepository.getAllSettings();
      
      // Sync theme class with document root
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      set({ settings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const current = get().settings;
      const updated = { ...current, ...updates };
      
      await SettingsRepository.saveAllSettings(updated);

      if (updates.theme) {
        if (updates.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }

      set({ settings: updated, isLoading: false });
      
      // Refresh applications store to recalculate daily goal progress
      await useApplicationStore.getState().loadApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  toggleTheme: async () => {
    const currentTheme = get().settings.theme;
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    await get().updateSettings({ theme: nextTheme });
  },
}));
