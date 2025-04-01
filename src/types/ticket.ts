export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'software' | 'hardware' | 'network' | 'other';

export interface DeadlineHistory {
  oldDeadline: Date;
  newDeadline: Date;
  reason: string;
  extendedBy: string;
  extendedAt: Date;
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: Date;
  updatedAt: Date;
  deadline: Date;
  deadlineHistory?: DeadlineHistory[];
  userId: string;
  assignedToId?: string;
  assignedToName?: string;
  comments?: Comment[];
  attachments?: Attachment[];
  taskId?: string;
  gmailId?: string;
  priorityLockedBy?: string;
  priorityLockedAt?: Date;
  priorityReason?: string;
}

export const statusLabels: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em Andamento',
  resolved: 'Resolvido',
  closed: 'Fechado'
};

export const priorityLabels: Record<TicketPriority, string> = {
  low: 'Baixa',
  medium: 'Normal',
  high: 'Alta',
  critical: 'Urgente'
};

export const categoryLabels: Record<TicketCategory, string> = {
  software: 'Software',
  hardware: 'Hardware',
  network: 'Rede',
  other: 'Outro'
};

export const statusColors: Record<TicketStatus, string> = {
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800'
};

export const priorityColors: Record<TicketPriority, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800'
};

export const priorityDeadlines: Record<TicketPriority, number> = {
  low: 7 * 24 * 60 * 60 * 1000, // 7 dias
  medium: 3 * 24 * 60 * 60 * 1000, // 3 dias
  high: 24 * 60 * 60 * 1000, // 24 horas
  critical: 4 * 60 * 60 * 1000 // 4 horas
};

// Mapeamento de status para o ClickUp
export const clickupStatusMap: Record<TicketStatus, string> = {
  open: 'ABERTO',
  in_progress: 'EM ANDAMENTO',
  resolved: 'RESOLVIDO',
  closed: 'FECHADO'
};

// Mapeamento reverso para converter status do ClickUp em status do sistema
export const clickupStatusReverseMap: Record<string, TicketStatus> = {
  'ABERTO': 'open',
  'EM ANDAMENTO': 'in_progress',
  'RESOLVIDO': 'resolved',
  'FECHADO': 'closed'
};

//  Mapeamento de prioridades para o ClickUp
export const clickupPriorityMap: Record<TicketPriority, number> = {
  critical: 1, // Urgente
  high: 2,     // Alta
  medium: 3,   // Normal
  low: 4       // Baixa
};

// Mapeamento reverso de prioridades do ClickUp
export const clickupPriorityReverseMap: Record<number, TicketPriority> = {
  1: 'critical', // Urgente
  2: 'high',     // Alta
  3: 'medium',   // Normal
  4: 'low'       // Baixa
};