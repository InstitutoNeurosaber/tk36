import { useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTicketStore } from '../stores/ticketStore';
import { useAuthStore } from '../stores/authStore';
import { ticketService } from '../services/ticketService';
import type { Ticket, TicketStatus } from '../types/ticket';

export function useTickets() {
  const { user, userData } = useAuthStore();
  const {
    tickets,
    loading,
    error,
    setTickets,
    setLoading,
    setError
  } = useTicketStore();

  // Escutar mudanças nos tickets em tempo real
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const ticketsRef = collection(db, 'tickets');
    
    // Criar query baseada no papel do usuário
    const baseQuery = query(ticketsRef, orderBy('createdAt', 'desc'));
    const userQuery = userData?.role === 'admin' 
      ? baseQuery 
      : query(ticketsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(userQuery, 
      (snapshot) => {
        const ticketList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
          deadline: doc.data().deadline?.toDate()
        })) as Ticket[];
        
        setTickets(ticketList);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar tickets:', error);
        setError(error instanceof Error ? error.message : 'Erro ao buscar tickets');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userData?.role, setTickets, setLoading, setError]);

  const createTicket = useCallback(async (
    ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'deadline'>
  ) => {
    try {
      setLoading(true);
      setError(null);
      await ticketService.createTicket(ticketData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao criar ticket');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const updateTicketStatus = useCallback(async (
    ticketId: string,
    status: TicketStatus
  ) => {
    try {
      setLoading(true);
      setError(null);
      await ticketService.updateTicketStatus(ticketId, status);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status do ticket');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  const deleteTicket = useCallback(async (ticketId: string) => {
    try {
      setLoading(true);
      setError(null);
      await ticketService.deleteTicket(ticketId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao excluir ticket');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicketStatus,
    deleteTicket
  };
}