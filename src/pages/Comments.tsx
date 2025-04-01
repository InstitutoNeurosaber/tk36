import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, User, ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { useChat } from '../hooks/useChat';
import { useTicketStore } from '../stores/ticketStore';
import type { Comment, Ticket } from '../types/ticket';

export function CommentsPage() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, userData: currentUserData } = useAuthStore();
  const { tickets } = useTicketStore();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { 
    isConnected, 
    typingUsers, 
    error: chatError, 
    sendComment, 
    setTyping 
  } = useChat(ticketId || '');

  useEffect(() => {
    if (ticketId) {
      const currentTicket = tickets.find(t => t.id === ticketId);
      if (currentTicket) {
        setTicket(currentTicket);
      }
    }
  }, [ticketId, tickets]);

  useEffect(() => {
    const fetchUserNames = async () => {
      if (!ticket?.comments) return;
      
      const uniqueUserIds = [...new Set(ticket.comments.map(comment => comment.userId))];
      const names: Record<string, string> = {};

      for (const userId of uniqueUserIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            names[userId] = userData.name;
          }
        } catch (error) {
          console.error('Erro ao buscar nome do usuário:', error);
          names[userId] = 'Usuário';
        }
      }

      setUserNames(names);
    };

    fetchUserNames();
  }, [ticket?.comments]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [ticket?.comments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmitting || !user || !ticketId || !currentUserData) return;

    try {
      setIsSubmitting(true);
      await sendComment({
        content: newComment.trim(),
        userId: user.uid,
        userName: currentUserData.name,
        ticketId,
        createdAt: new Date()
      });
      setNewComment('');
      setTyping(false);
    } catch (error) {
      console.error('Erro ao enviar comentário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewComment(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    setTyping(true);

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const groupCommentsByDate = () => {
    if (!ticket?.comments) return {};
    
    const groups: Record<string, Comment[]> = {};
    
    ticket.comments.forEach(comment => {
      const date = formatDate(comment.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(comment);
    });

    return groups;
  };

  const isCurrentUser = (userId: string) => {
    return user?.uid === userId;
  };

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{ticket.title}</h1>
              <p className="text-sm text-gray-500">#{ticket.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <span className="text-sm text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                Conectado
              </span>
            ) : (
              <span className="text-sm text-red-600 flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                Desconectado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {Object.entries(groupCommentsByDate()).map(([date, dateComments]) => (
              <div key={date} className="space-y-4">
                <div className="flex justify-center">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {date}
                  </span>
                </div>

                {dateComments.map((comment) => {
                  const isOwn = isCurrentUser(comment.userId);
                  return (
                    <div
                      key={comment.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end space-x-2 max-w-[80%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwn && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        
                        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                          {!isOwn && (
                            <span className="text-xs text-gray-500 mb-1">
                              {userNames[comment.userId] || 'Usuário'}
                            </span>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2 max-w-full break-words ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                            <span className={`text-xs ${
                              isOwn ? 'text-blue-100' : 'text-gray-500'
                            } block text-right mt-1`}>
                              {formatTime(comment.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {(!ticket.comments || ticket.comments.length === 0) && (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500 text-sm">
                  Nenhuma mensagem ainda. Seja o primeiro a comentar!
                </p>
              </div>
            )}
          </div>

          {typingUsers.size > 0 && (
            <div className="px-4 py-2 text-sm text-gray-500 italic">
              {Array.from(typingUsers).map(userId => userNames[userId]).join(', ')} 
              {typingUsers.size === 1 ? ' está digitando...' : ' estão digitando...'}
            </div>
          )}

          {/* Input Form */}
          <div className="p-4 bg-white border-t border-gray-200">
            <form ref={formRef} onSubmit={handleSubmit} className="max-w-4xl mx-auto">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 min-w-0 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                  disabled={isSubmitting || !isConnected}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting || !isConnected}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  <Send className={`h-5 w-5 text-white ${isSubmitting ? 'opacity-50' : ''}`} />
                </button>
              </div>
              {!isConnected && (
                <p className="mt-2 text-sm text-red-600">
                  Desconectado do chat. Tentando reconectar...
                </p>
              )}
              {chatError && (
                <p className="mt-2 text-sm text-red-600">
                  Erro: {chatError}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}