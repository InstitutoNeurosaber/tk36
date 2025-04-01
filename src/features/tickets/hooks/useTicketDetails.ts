import { useState } from 'react';
import { useTicketStore } from '../../../stores/ticketStore';
import type { Ticket, TicketStatus, TicketPriority } from '../../../types/ticket';

export function useTicketDetails(ticketId: string) {
  const { updateTicket, updateTicketStatus } = useTicketStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = async (status: TicketStatus) => {
    try {
      setLoading(true);
      setError(null);
      await updateTicketStatus(ticketId, status);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (priority: TicketPriority, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      await updateTicket(ticketId, { 
        priority,
        priorityReason: reason,
        priorityLockedAt: new Date(),
        priorityLockedBy: 'current-user' // Substituir pelo nome do usuário atual
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar prioridade');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (changes: Partial<Ticket>) => {
    try {
      setLoading(true);
      setError(null);
      await updateTicket(ticketId, changes);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar ticket');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateStatus: handleUpdateStatus,
    updatePriority: handleUpdatePriority,
    updateTicket: handleUpdateTicket
  };
}