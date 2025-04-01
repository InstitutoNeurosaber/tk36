import { useState } from 'react';
import { useTicketStore } from '../stores/ticketStore';
import type { TicketStatus } from '../types/ticket';

export function useTicketStatus() {
  const { updateTicketStatus } = useTicketStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      setLoading(true);
      setError(null);
      await updateTicketStatus(ticketId, newStatus);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateStatus: handleStatusChange
  };
}