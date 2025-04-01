import { useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useNotificationStore } from '../stores/notificationStore';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';
import type { Notification } from '../types/ticket';

export function useNotifications() {
  const { user } = useAuthStore();
  const {
    notifications,
    loading,
    error,
    setNotifications,
    setLoading,
    setError
  } = useNotificationStore();

  // Escutar mudanças nas notificações em tempo real
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const notificationList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as Notification[];
        
        setNotifications(notificationList);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar notificações:', error);
        setError(error instanceof Error ? error.message : 'Erro ao buscar notificações');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, setNotifications, setLoading, setError]);

  const createNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'createdAt' | 'read'>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.createNotification(notification);
      // Não precisa atualizar o estado manualmente pois o listener do onSnapshot fará isso
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao criar notificação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.markAsRead(notificationId);
      // Não precisa atualizar o estado manualmente pois o listener do onSnapshot fará isso
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao marcar notificação como lida');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const markAllAsRead = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.markAllAsRead(userId);
      // Não precisa atualizar o estado manualmente pois o listener do onSnapshot fará isso
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao marcar todas notificações como lidas');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.deleteNotification(notificationId);
      // Não precisa atualizar o estado manualmente pois o listener do onSnapshot fará isso
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao deletar notificação');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const clearAll = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      await notificationService.clearAll(userId);
      // Não precisa atualizar o estado manualmente pois o listener do onSnapshot fará isso
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao limpar todas as notificações');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    notifications,
    loading,
    error,
    createNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  };
}