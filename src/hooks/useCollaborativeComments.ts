import { useEffect, useState, useCallback, useRef } from 'react';
import { YjsProvider } from '../lib/yjs';
import { useAuthStore } from '../stores/authStore';
import type { Comment } from '../types/ticket';

export function useCollaborativeComments(ticketId: string) {
  const { user, userData } = useAuthStore();
  const [provider, setProvider] = useState<YjsProvider | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const providerRef = useRef<YjsProvider | null>(null);
  const connectionCheckInterval = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!user || !userData || !ticketId) return;

    const initializeProvider = () => {
      try {
        console.log('[Comments] Initializing YJS provider...');
        const yjsProvider = new YjsProvider(
          `ticket-${ticketId}`,
          user.uid,
          userData.name
        );
        providerRef.current = yjsProvider;

        // Carregar comentários iniciais
        const commentsArray = yjsProvider.getCommentsArray();
        const initialComments = commentsArray.toArray();
        console.log('[Comments] Initial comments:', initialComments);
        setComments(initialComments);

        // Observar mudanças nos comentários em tempo real
        const unobserveComments = yjsProvider.observeComments(() => {
          if (!yjsProvider) return;
          const newComments = yjsProvider.getCommentsArray().toArray();
          console.log('[Comments] Comments updated:', newComments);
          setComments(newComments);
        });

        // Observar usuários ativos
        const awareness = yjsProvider.getAwareness();
        const updateActiveUsers = () => {
          if (!yjsProvider) return;
          const users = yjsProvider.getActiveUsers();
          console.log('[Comments] Active users updated:', users);
          setActiveUsers(users);
        };

        awareness.on('change', updateActiveUsers);
        updateActiveUsers();

        // Monitorar estado da conexão
        const checkConnection = () => {
          if (!yjsProvider) return;
          const connected = yjsProvider.isConnected();
          console.log('[Comments] Connection status:', connected);
          setIsConnected(connected);

          if (!connected && reconnectAttempts.current < maxReconnectAttempts) {
            console.log('[Comments] Attempting to reconnect...');
            reconnectAttempts.current++;
            yjsProvider.reconnect();
          }
        };

        // Verificar conexão inicialmente e periodicamente
        checkConnection();
        connectionCheckInterval.current = setInterval(checkConnection, 5000);

        setProvider(yjsProvider);
        setError(null);
        setIsConnected(true);

        return () => {
          console.log('[Comments] Cleaning up provider...');
          clearInterval(connectionCheckInterval.current);
          unobserveComments();
          awareness.off('change', updateActiveUsers);
          yjsProvider.destroy();
          providerRef.current = null;
        };
      } catch (error) {
        console.error('[Comments] Error initializing provider:', error);
        setError(error instanceof Error ? error.message : 'Erro ao conectar ao chat colaborativo');
        setIsConnected(false);
        
        if (providerRef.current) {
          providerRef.current.destroy();
          providerRef.current = null;
        }
        
        return undefined;
      }
    };

    const cleanup = initializeProvider();
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [ticketId, user, userData]);

  const addComment = useCallback(async (comment: Omit<Comment, 'id'>) => {
    const currentProvider = providerRef.current;

    if (!currentProvider) {
      console.error('[Comments] Provider not initialized');
      throw new Error('Chat não inicializado');
    }

    if (!currentProvider.isConnected()) {
      console.error('[Comments] Not connected');
      throw new Error('Sem conexão com o chat');
    }

    console.log('[Comments] Adding comment:', comment);

    try {
      const commentWithId: Comment = {
        ...comment,
        id: crypto.randomUUID()
      };

      const success = currentProvider.addComment(commentWithId);
      
      if (!success) {
        throw new Error('Falha ao adicionar comentário');
      }

      console.log('[Comments] Comment added successfully');
      return commentWithId;
    } catch (error) {
      console.error('[Comments] Error adding comment:', error);
      throw error;
    }
  }, []);

  return {
    comments,
    activeUsers,
    error,
    isConnected,
    addComment
  };
}