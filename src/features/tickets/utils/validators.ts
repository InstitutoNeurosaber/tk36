import type { Ticket } from '../../../types/ticket';

export const validators = {
  isValidTitle(title: string): boolean {
    return title.length >= 3 && title.length <= 100;
  },

  isValidDescription(description: string): boolean {
    return description.length >= 10 && description.length <= 1000;
  },

  isValidDeadline(deadline: Date): boolean {
    return deadline > new Date();
  },

  isOverdue(ticket: Ticket): boolean {
    return new Date() > new Date(ticket.deadline);
  },

  canEditTicket(ticket: Ticket, userId: string, isAdmin: boolean): boolean {
    return isAdmin || ticket.userId === userId;
  },

  canDeleteComment(commentUserId: string, currentUserId: string, isAdmin: boolean): boolean {
    return isAdmin || commentUserId === currentUserId;
  }
};