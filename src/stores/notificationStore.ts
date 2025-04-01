import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Notification } from '../types/ticket';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  setNotifications: (notifications: Notification[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  error: null,

  setNotifications: (notifications) => set({ notifications }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  createNotification: async (notificationData) => {
    try {
      set({ loading: true, error: null });
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notificationData,
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao criar notificação' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      set({ loading: true, error: null });
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao marcar notificação como lida' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  markAllAsRead: async (userId) => {
    try {
      set({ loading: true, error: null });
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao marcar todas notificações como lidas' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      set({ loading: true, error: null });
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao excluir notificação' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  clearAll: async (userId) => {
    try {
      set({ loading: true, error: null });
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro ao limpar todas as notificações' });
      throw error;
    } finally {
      set({ loading: false });
    }
  }
}));