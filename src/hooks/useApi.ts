import { useState } from 'react';
import { ticketApi, setApiKey as setStoredApiKey } from '../services/api';
import type { TicketStatus, TicketPriority } from '../types/ticket';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = async <T>(
    request: Promise<T>,
    errorMessage: string
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      return await request;
    } catch (err) {
      const message = err instanceof Error ? err.message : errorMessage;
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (data: {
    title: string;
    description: string;
    category: string;
    priority: TicketPriority;
  }) => {
    return handleRequest(
      ticketApi.createTicket(data),
      'Erro ao criar ticket'
    );
  };

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    return handleRequest(
      ticketApi.updateStatus(ticketId, { status }),
      'Erro ao atualizar status'
    );
  };

  const updatePriority = async (ticketId: string, priority: TicketPriority) => {
    return handleRequest(
      ticketApi.updatePriority(ticketId, { priority }),
      'Erro ao atualizar prioridade'
    );
  };

  const addComment = async (ticketId: string, content: string, userId: string) => {
    return handleRequest(
      ticketApi.addComment(ticketId, { content, userId }),
      'Erro ao adicionar comentário'
    );
  };

  const deleteTicket = async (ticketId: string) => {
    return handleRequest(
      ticketApi.deleteTicket(ticketId),
      'Erro ao excluir ticket'
    );
  };

  const setApiKey = (apiKey: string) => {
    setStoredApiKey(apiKey);
  };

  return {
    loading,
    error,
    createTicket,
    updateStatus,
    updatePriority,
    addComment,
    deleteTicket,
    setApiKey
  };
}