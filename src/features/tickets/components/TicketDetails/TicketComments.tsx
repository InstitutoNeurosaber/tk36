import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { useTicketComments } from '../../hooks/useTicketComments';
import { useAuthStore } from '../../../../stores/authStore';
import type { Ticket } from '../../../../types/ticket';

interface TicketCommentsProps {
  ticket: Ticket;
}

export function TicketComments({ ticket }: TicketCommentsProps) {
  const { user, userData } = useAuthStore();
  const { addComment, deleteComment } = useTicketComments(ticket.id);
  const [newComment, setNewComment] = useState('');
  const commentsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commentsContainerRef.current) {
      const container = commentsContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [ticket.comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await addComment(newComment.trim(), user.uid, userData?.name);
      setNewComment('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este comentário?')) {
      return;
    }

    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
    }
  };

  const canDeleteComment = (userId: string) => {
    return userData?.role === 'admin' || user?.uid === userId;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center">
        <MessageSquare className="w-5 h-5 mr-2" />
        Comentários
      </h3>

      <div 
        ref={commentsContainerRef}
        className="space-y-4 max-h-[400px] overflow-y-auto scroll-smooth"
      >
        {ticket.comments?.map((comment) => (
          <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-900">
                {comment.userName || 'Usuário'}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('pt-BR')}
                </span>
                {canDeleteComment(comment.userId) && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Excluir comentário"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
          </div>
        ))}

        {(!ticket.comments || ticket.comments.length === 0) && (
          <p className="text-center text-gray-500 text-sm py-4">
            Nenhum comentário ainda
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicione um comentário..."
            className="flex-1 min-w-0 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}