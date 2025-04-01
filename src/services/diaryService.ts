import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DiaryEntry } from '../types/diary';

export const diaryService = {
  async createEntry(data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> {
    try {
      const now = Timestamp.now();
      const entriesRef = collection(db, 'diary_entries');
      
      const docRef = await addDoc(entriesRef, {
        ...data,
        createdAt: now,
        updatedAt: now
      });

      return {
        id: docRef.id,
        ...data,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };
    } catch (error) {
      console.error('Erro ao criar entrada:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao criar entrada no diário');
    }
  },

  async updateEntry(id: string, changes: Partial<DiaryEntry>): Promise<void> {
    try {
      const entryRef = doc(db, 'diary_entries', id);
      await updateDoc(entryRef, {
        ...changes,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao atualizar entrada:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar entrada no diário');
    }
  },

  async deleteEntry(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'diary_entries', id));
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao excluir entrada do diário');
    }
  },

  async getEntries(userId: string): Promise<DiaryEntry[]> {
    try {
      const entriesRef = collection(db, 'diary_entries');
      
      // Primeiro tenta buscar com o índice composto
      try {
        const q = query(
          entriesRef,
          where('userId', '==', userId),
          orderBy('updatedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        })) as DiaryEntry[];
      } catch (indexError) {
        // Se falhar por falta de índice, faz uma busca simples
        console.warn('Índice não encontrado, fazendo busca simples:', indexError);
        const q = query(
          entriesRef,
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const entries = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        })) as DiaryEntry[];

        // Ordena manualmente
        return entries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      }
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar entradas do diário');
    }
  },

  async shareEntry(entryId: string, userIds: string[]): Promise<void> {
    try {
      const entryRef = doc(db, 'diary_entries', entryId);
      await updateDoc(entryRef, {
        sharedWith: userIds,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Erro ao compartilhar entrada:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao compartilhar entrada do diário');
    }
  }
};