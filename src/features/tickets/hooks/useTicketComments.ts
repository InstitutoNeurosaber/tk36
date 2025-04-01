import { useState } from 'react';
import { useTicketStore } from '../../../stores/ticketStore';
import type { Comment } from '../../../types/ticket';

export function useTicketComments(ticketId: string) {
  const { addComment, deleteComment } = useTicketStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddComment = async (content: string, userId: string, userName?: string) => {
    try {
      setLoading(true);
      setError(null);
      await addComment(ticketId, { content, userId, userName });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao adicionar comentário');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await deleteComment(ticketId, commentId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao excluir comentário');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    addComment: handleAddComment,
    deleteComment: handleDeleteComment
  };
}