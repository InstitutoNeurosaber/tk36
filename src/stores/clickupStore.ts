import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClickUpAPI } from '../lib/clickup';
import type { ClickUpConfig } from '../types/clickup';

interface ClickUpState {
  config: ClickUpConfig | null;
  loading: boolean;
  error: string | null;
  selectedWorkspaceId: string | null;
  selectedSpaceId: string | null;
  selectedListId: string | null;
  fetchConfig: (userId: string) => Promise<void>;
  saveConfig: (config: Omit<ClickUpConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConfig: (id: string, data: Partial<ClickUpConfig>) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  setSelectedWorkspaceId: (id: string | null) => void;
  setSelectedSpaceId: (id: string | null) => void;
  setSelectedListId: (id: string | null) => void;
  reset: () => void;
}

const initialState = {
  config: null,
  loading: false,
  error: null,
  selectedWorkspaceId: null,
  selectedSpaceId: null,
  selectedListId: null
};

export const useClickUpStore = create<ClickUpState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setSelectedWorkspaceId: (id) => {
        set({ 
          selectedWorkspaceId: id,
          // Limpa as seleções dependentes
          selectedSpaceId: null,
          selectedListId: null
        });
      },

      setSelectedSpaceId: (id) => {
        set({ 
          selectedSpaceId: id,
          // Limpa a lista selecionada
          selectedListId: null
        });
      },

      setSelectedListId: (id) => set({ selectedListId: id }),

      reset: () => set(initialState),

      fetchConfig: async (userId: string) => {
        try {
          set({ loading: true, error: null });
          const configsRef = collection(db, 'clickup_configs');
          const q = query(configsRef, where('userId', '==', userId));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const configDoc = snapshot.docs[0];
            const config = {
              id: configDoc.id,
              ...configDoc.data(),
              createdAt: configDoc.data().createdAt.toDate(),
              updatedAt: configDoc.data().updatedAt.toDate()
            } as ClickUpConfig;
            
            set({ 
              config,
              selectedWorkspaceId: config.workspaceId,
              selectedSpaceId: config.spaceId,
              selectedListId: config.listId
            });
          }
        } catch (error) {
          console.error('Erro ao buscar configuração:', error);
          set({ error: error instanceof Error ? error.message : 'Erro ao buscar configuração do ClickUp' });
        } finally {
          set({ loading: false });
        }
      },

      saveConfig: async (configData) => {
        try {
          set({ loading: true, error: null });
          
          const configsRef = collection(db, 'clickup_configs');
          const q = query(configsRef, where('userId', '==', configData.userId));
          const snapshot = await getDocs(q);
          
          const now = Timestamp.now();
          
          if (!snapshot.empty) {
            const existingConfig = snapshot.docs[0];
            await updateDoc(doc(configsRef, existingConfig.id), {
              ...configData,
              updatedAt: now
            });

            const updatedConfig: ClickUpConfig = {
              id: existingConfig.id,
              ...configData,
              createdAt: existingConfig.data().createdAt.toDate(),
              updatedAt: now.toDate()
            };

            set({ 
              config: updatedConfig,
              selectedWorkspaceId: configData.workspaceId,
              selectedSpaceId: configData.spaceId,
              selectedListId: configData.listId
            });
          } else {
            const docRef = await addDoc(configsRef, {
              ...configData,
              createdAt: now,
              updatedAt: now
            });

            const newConfig: ClickUpConfig = {
              id: docRef.id,
              ...configData,
              createdAt: now.toDate(),
              updatedAt: now.toDate()
            };

            set({ 
              config: newConfig,
              selectedWorkspaceId: configData.workspaceId,
              selectedSpaceId: configData.spaceId,
              selectedListId: configData.listId
            });
          }
        } catch (error) {
          console.error('Erro ao salvar configuração:', error);
          set({ error: error instanceof Error ? error.message : 'Erro ao salvar configuração do ClickUp' });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      updateConfig: async (id: string, data: Partial<ClickUpConfig>) => {
        try {
          set({ loading: true, error: null });
          const configRef = doc(db, 'clickup_configs', id);
          
          await updateDoc(configRef, {
            ...data,
            updatedAt: Timestamp.now()
          });

          const { config } = get();
          if (config) {
            const updatedConfig = {
              ...config,
              ...data,
              updatedAt: new Date()
            };
            set({ 
              config: updatedConfig,
              selectedWorkspaceId: data.workspaceId || config.workspaceId,
              selectedSpaceId: data.spaceId || config.spaceId,
              selectedListId: data.listId || config.listId
            });
          }
        } catch (error) {
          console.error('Erro ao atualizar configuração:', error);
          set({ error: error instanceof Error ? error.message : 'Erro ao atualizar configuração do ClickUp' });
          throw error;
        } finally {
          set({ loading: false });
        }
      },

      deleteConfig: async (id: string) => {
        try {
          set({ loading: true, error: null });
          await deleteDoc(doc(db, 'clickup_configs', id));
          set(initialState);
        } catch (error) {
          console.error('Erro ao deletar configuração:', error);
          set({ error: error instanceof Error ? error.message : 'Erro ao deletar configuração do ClickUp' });
          throw error;
        } finally {
          set({ loading: false });
        }
      }
    }),
    {
      name: 'clickup-storage',
      partialize: (state) => ({
        selectedWorkspaceId: state.selectedWorkspaceId,
        selectedSpaceId: state.selectedSpaceId,
        selectedListId: state.selectedListId
      })
    }
  )
);