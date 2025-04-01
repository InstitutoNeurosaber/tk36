import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Notification } from '../types/ticket';

export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao criar notificação');
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao marcar notificação como lida');
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
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
      throw new Error(error instanceof Error ? error.message : 'Erro ao marcar todas notificações como lidas');
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao deletar notificação');
    }
  },

  async clearAll(userId: string): Promise<void> {
    try {
      const batch = writeBatch(db);
      const notificationsRef = collection(db, 'notifications');
      const q = query(notificationsRef, where('userId', '==', userId));
      
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao limpar todas as notificações');
    }
  }
};