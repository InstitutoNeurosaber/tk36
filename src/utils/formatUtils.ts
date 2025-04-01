import type { TicketStatus, TicketPriority, TicketCategory } from '../types/ticket';

export const formatUtils = {
  formatStatus(status: TicketStatus): string {
    const statusMap: Record<TicketStatus, string> = {
      open: 'Aberto',
      in_progress: 'Em Andamento',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };
    return statusMap[status] || status;
  },

  formatPriority(priority: TicketPriority): string {
    const priorityMap: Record<TicketPriority, string> = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };
    return priorityMap[priority] || priority;
  },

  formatCategory(category: TicketCategory): string {
    const categoryMap: Record<TicketCategory, string> = {
      software: 'Software',
      hardware: 'Hardware',
      network: 'Rede',
      other: 'Outro'
    };
    return categoryMap[category] || category;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
};