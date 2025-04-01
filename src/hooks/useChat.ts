import { useState, useCallback, useEffect } from 'react';
import { useCollaborativeComments } from './useCollaborativeComments';
import { useTicketStore } from '../stores/ticketStore';
import type { Comment } from '../types/ticket';

export function useChat(ticketId: string) {
  const [typingUsers] = useState(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const { addComment: addTicketComment } = useTicketStore();

  const {
    comments,
    activeUsers,
    error: collaborativeError,
    isConnected,
    addComment: addCollaborativeComment
  } = useCollaborativeComments(ticketId);

  useEffect(() => {
    if (collaborativeError) {
      setError(collaborativeError);
    }
  }, [collaborativeError]);

  const sendComment = useCallback(async (comment: Omit<Comment, 'id'>) => {
    try {
      // Primeiro tenta adicionar ao sistema colaborativo
      const collaborativeResult = await addCollaborativeComment(comment);
      
      // Se sucesso no colaborativo, adiciona ao banco
      if (collaborativeResult) {
        await addTicketComment(ticketId, {
          content: comment.content,
          userId: comment.userId,
          userName: comment.userName
        });
      }
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
      throw error;
    }
  }, [ticketId, addCollaborativeComment, addTicketComment]);

  const setTyping = useCallback(() => {
    // Implementação do typing indicator pode ser adicionada aqui
  }, []);

  return {
    comments,
    activeUsers,
    typingUsers,
    error,
    isConnected,
    sendComment,
    setTyping
  };
}