import { create } from 'zustand';
import { JobApplication, ApplicationStatus } from '../types';
import { ApplicationRepository } from '../repositories/ApplicationRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';

interface ApplicationState {
  applications: JobApplication[];
  isLoading: boolean;
  error: string | null;
  
  // Computed statistics
  stats: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    dailyGoalProgress: number; // percentage (0 - 100)
    dailyGoal: number;
    recent: JobApplication[];
    upcomingFollowUps: JobApplication[];
  };

  // Actions
  loadApplications: () => Promise<void>;
  addApplication: (app: Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt' | 'reminderSent'>) => Promise<number>;
  updateApplication: (id: number, updates: Partial<JobApplication>) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  applications: [],
  isLoading: false,
  error: null,
  stats: {
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    dailyGoalProgress: 0,
    dailyGoal: 3,
    recent: [],
    upcomingFollowUps: [],
  },

  loadApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const apps = await ApplicationRepository.getAll();
      const settings = await SettingsRepository.getAllSettings();
      
      // Calculate Stats
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // helper dates
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      apps.forEach((app) => {
        const appDate = new Date(app.appliedDate);
        if (app.appliedDate === todayStr) {
          todayCount++;
        }
        if (appDate >= oneWeekAgo && appDate <= now) {
          weekCount++;
        }
        if (appDate >= oneMonthAgo && appDate <= now) {
          monthCount++;
        }
      });

      // Goal progress
      const dailyGoal = settings.dailyGoal || 3;
      const dailyGoalProgress = Math.min(Math.round((todayCount / dailyGoal) * 100), 100);

      // Sort by date/time desc for recent
      const sortedApps = [...apps].sort((a, b) => {
        const dateA = new Date(`${a.appliedDate}T${a.appliedTime || '00:00'}`);
        const dateB = new Date(`${b.appliedDate}T${b.appliedTime || '00:00'}`);
        return dateB.getTime() - dateA.getTime();
      });

      const recent = sortedApps.slice(0, 5);

      // Filter upcoming followups: status is 'Applied', and 6 days have passed (or close to it)
      // For checklist, let's list all "Applied" status applications ordered by date (oldest first, i.e. needs follow-up most)
      const upcomingFollowUps = apps
        .filter((app) => app.status === 'Applied')
        .sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());

      set({
        applications: apps,
        stats: {
          total: apps.length,
          today: todayCount,
          thisWeek: weekCount,
          thisMonth: monthCount,
          dailyGoalProgress,
          dailyGoal,
          recent,
          upcomingFollowUps,
        },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addApplication: async (app) => {
    set({ isLoading: true, error: null });
    try {
      const id = await ApplicationRepository.add({ ...app, reminderSent: false });
      
      // Auto-schedule alarm if we are inside a Chrome extension popup context
      if (typeof chrome !== 'undefined' && chrome.alarms) {
        const settings = await SettingsRepository.getAllSettings();
        if (settings.notificationsEnabled) {
          chrome.alarms.create(`followup_${id}`, {
            delayInMinutes: 6 * 24 * 60, // 6 days
          });
        }
      }
      
      await get().loadApplications();
      return id;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateApplication: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await ApplicationRepository.update(id, updates);
      
      // If status changes from 'Applied', we can cancel follow-up alarms
      if (updates.status && updates.status !== 'Applied') {
        if (typeof chrome !== 'undefined' && chrome.alarms) {
          chrome.alarms.clear(`followup_${id}`);
        }
      }

      await get().loadApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteApplication: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await ApplicationRepository.delete(id);
      
      // Cancel follow-up alarm
      if (typeof chrome !== 'undefined' && chrome.alarms) {
        chrome.alarms.clear(`followup_${id}`);
      }

      await get().loadApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  clearAll: async () => {
    set({ isLoading: true, error: null });
    try {
      await ApplicationRepository.clearAll();
      
      // Clear all Chrome alarms
      if (typeof chrome !== 'undefined' && chrome.alarms) {
        chrome.alarms.clearAll();
      }

      set({
        applications: [],
        stats: {
          total: 0,
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          dailyGoalProgress: 0,
          dailyGoal: 3,
          recent: [],
          upcomingFollowUps: [],
        },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
