import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import type { Comment } from '../../../types/ticket';

export const commentService = {
  async addComment(
    ticketId: string, 
    data: Omit<Comment, 'id' | 'createdAt' | 'ticketId'>
  ): Promise<Comment> {
    const ticketRef = doc(db, 'tickets', ticketId);
    const now = Timestamp.now();
    const commentId = crypto.randomUUID();

    const newComment = {
      id: commentId,
      ticketId,
      ...data,
      createdAt: now
    };

    await updateDoc(ticketRef, {
      comments: arrayUnion({
        ...newComment,
        createdAt: now
      }),
      updatedAt: now
    });

    return {
      ...newComment,
      createdAt: now.toDate()
    };
  },

  async deleteComment(ticketId: string, commentId: string): Promise<void> {
    const ticketRef = doc(db, 'tickets', ticketId);
    const now = Timestamp.now();

    await updateDoc(ticketRef, {
      comments: arrayRemove({ id: commentId }),
      updatedAt: now
    });
  }
};