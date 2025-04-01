import { create } from 'zustand';
import { diaryService } from '../services/diaryService';
import type { DiaryEntry } from '../types/diary';

interface DiaryState {
  entries: DiaryEntry[];
  loading: boolean;
  error: string | null;
  createEntry: (entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DiaryEntry>;
  updateEntry: (id: string, changes: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  fetchEntries: (userId: string) => Promise<void>;
  shareEntry: (entryId: string, userIds: string[]) => Promise<void>;
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,

  createEntry: async (entryData) => {
    try {
      set({ loading: true, error: null });
      const newEntry = await diaryService.createEntry(entryData);
      
      set(state => ({
        entries: [newEntry, ...state.entries],
        loading: false
      }));

      return newEntry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar entrada';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateEntry: async (id, changes) => {
    try {
      set({ loading: true, error: null });
      await diaryService.updateEntry(id, changes);
      
      set(state => ({
        entries: state.entries.map(entry =>
          entry.id === id
            ? { ...entry, ...changes, updatedAt: new Date() }
            : entry
        ),
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar entrada';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteEntry: async (id) => {
    try {
      set({ loading: true, error: null });
      await diaryService.deleteEntry(id);
      
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir entrada';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  fetchEntries: async (userId) => {
    try {
      set({ loading: true, error: null });
      const entries = await diaryService.getEntries(userId);
      set({ entries, loading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar entradas';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  shareEntry: async (entryId, userIds) => {
    try {
      set({ loading: true, error: null });
      await diaryService.shareEntry(entryId, userIds);
      
      set(state => ({
        entries: state.entries.map(entry =>
          entry.id === entryId
            ? { ...entry, sharedWith: userIds, updatedAt: new Date() }
            : entry
        ),
        loading: false
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao compartilhar entrada';
      set({ error: message, loading: false });
      throw new Error(message);
    }
  }
}));