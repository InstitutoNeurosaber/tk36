import { 
  statusLabels, 
  priorityLabels, 
  categoryLabels 
} from '../../../types/ticket';
import type { 
  TicketStatus, 
  TicketPriority, 
  TicketCategory 
} from '../../../types/ticket';

export const formatters = {
  formatStatus(status: TicketStatus): string {
    return statusLabels[status] || status;
  },

  formatPriority(priority: TicketPriority): string {
    return priorityLabels[priority] || priority;
  },

  formatCategory(category: TicketCategory): string {
    return categoryLabels[category] || category;
  },

  formatDate(date: Date): string {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  formatTimeRemaining(deadline: Date): string {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff < 0) return 'Atrasado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  }
};