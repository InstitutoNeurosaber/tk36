import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Image as ImageIcon } from 'lucide-react';
import { useComments } from '../hooks/useComments';
import { useAuthStore } from '../stores/authStore';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Ticket } from '../types/ticket';

interface CommentsProps {
  ticket: Ticket;
}

export function Comments({ ticket }: CommentsProps) {
  const { user } = useAuthStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const commentsContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    comments,
    loading,
    error,
    addComment
  } = useComments(ticket.id);

  // Rolar para o último comentário quando houver novos
  useEffect(() => {
    if (commentsContainerRef.current) {
      commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!newComment.trim() || isSubmitting || !user) return;

    try {
      setIsSubmitting(true);
      await addComment(newComment.trim());
      setNewComment('');
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const files: File[] = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      e.preventDefault();
      await handleFiles(files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    try {
      setIsSubmitting(true);

      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          console.error('Arquivo não é uma imagem:', file.name);
          continue;
        }

        const fileId = uuidv4();
        const fileRef = ref(storage, `comments/${ticket.id}/${fileId}-${file.name}`);
        
        await uploadBytes(fileRef, file);
        const imageUrl = await getDownloadURL(fileRef);
        
        await addComment(`![${file.name}](${imageUrl})`);
      }
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const groupCommentsByDate = () => {
    const groups: Record<string, typeof comments> = {};
    
    comments.forEach(comment => {
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

  const renderCommentContent = (content: string) => {
    // Verifica se o conteúdo é uma imagem (formato Markdown)
    const imageMatch = content.match(/!\[(.*?)\]\((.*?)\)/);
    if (imageMatch) {
      const [, alt, src] = imageMatch;
      return (
        <img 
          src={src} 
          alt={alt} 
          className="max-w-full rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => window.open(src, '_blank')}
        />
      );
    }
    return content;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div 
        ref={commentsContainerRef}
        className={`flex-1 overflow-y-auto space-y-4 pr-2 ${isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg' : ''}`}
        style={{ maxHeight: 'calc(100vh - 400px)' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
                          {comment.userName || 'Usuário'}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 max-w-full break-words ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {renderCommentContent(comment.content)}
                        </div>
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

        {comments.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">
              Nenhuma mensagem ainda. Seja o primeiro a comentar!
            </p>
          </div>
        )}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-4">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              onPaste={handlePaste}
              placeholder="Digite sua mensagem ou arraste uma imagem..."
              className="w-full rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm pr-12"
              disabled={isSubmitting}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
              multiple
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmitting}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            <Send className={`h-5 w-5 text-white ${isSubmitting ? 'opacity-50' : ''}`} />
          </button>
        </div>
      </form>
    </div>
  );
}