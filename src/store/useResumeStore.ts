import { create } from 'zustand';
import { Resume } from '../types';
import { ResumeRepository } from '../repositories/ResumeRepository';
import { useApplicationStore } from './useApplicationStore';

interface ResumeState {
  resumes: Resume[];
  isLoading: boolean;
  error: string | null;

  loadResumes: () => Promise<void>;
  addResume: (name: string, fileName: string) => Promise<number>;
  renameResume: (id: number, name: string) => Promise<void>;
  deleteResume: (id: number) => Promise<void>;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  isLoading: false,
  error: null,

  loadResumes: async () => {
    set({ isLoading: true, error: null });
    try {
      const resumes = await ResumeRepository.getAll();
      set({ resumes, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addResume: async (name, fileName) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const id = await ResumeRepository.add({
        name,
        fileName,
        uploadedDate: now,
      });
      await get().loadResumes();
      return id;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  renameResume: async (id, name) => {
    set({ isLoading: true, error: null });
    try {
      await ResumeRepository.update(id, { name });
      await get().loadResumes();
      // Reload applications to reflect changes if application resumeName is updated in UI
      await useApplicationStore.getState().loadApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteResume: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await ResumeRepository.delete(id);
      await get().loadResumes();
      // Reload applications as deleteResume transaction detaches resumeId
      await useApplicationStore.getState().loadApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
