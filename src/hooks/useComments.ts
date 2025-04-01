import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import type { Comment } from '../types/ticket';

export function useComments(ticketId: string) {
  const { user, userData } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const commentsRef = collection(db, 'tickets', ticketId, 'comments');
    const commentsQuery = query(commentsRef, orderBy('createdAt', 'asc'));
    setLoading(true);

    const unsubscribe = onSnapshot(commentsQuery, 
      (snapshot) => {
        try {
          const commentsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate()
          })) as Comment[];
          
          setComments(commentsList);
          setError(null);
        } catch (err) {
          console.error('Erro ao carregar comentários:', err);
          setError('Erro ao carregar comentários');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Erro na subscription dos comentários:', err);
        setError('Erro ao monitorar comentários');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ticketId]);

  const addComment = useCallback(async (content: string) => {
    if (!user || !userData) {
      throw new Error('Usuário não autenticado');
    }

    try {
      const commentsRef = collection(db, 'tickets', ticketId, 'comments');
      await addDoc(commentsRef, {
        content,
        userId: user.uid,
        userName: userData.name,
        createdAt: Timestamp.now(),
        ticketId
      });
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      throw new Error('Erro ao enviar comentário');
    }
  }, [ticketId, user, userData]);

  return {
    comments,
    loading,
    error,
    addComment
  };
}