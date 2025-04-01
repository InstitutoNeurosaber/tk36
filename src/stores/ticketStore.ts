import { create } from 'zustand';
import { ticketService } from '../services/ticketService';
import type { Ticket, TicketStatus, Comment } from '../types/ticket';

interface TicketState {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  setTickets: (tickets: Ticket[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'deadline'>) => Promise<Ticket>;
  updateTicket: (ticketId: string, changes: Partial<Ticket>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => Promise<void>;
  deleteTicket: (ticketId: string) => Promise<void>;
  addComment: (ticketId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'ticketId'>) => Promise<Comment>;
  deleteComment: (ticketId: string, commentId: string) => Promise<void>;
  optimisticUpdateStatus: (ticketId: string, status: TicketStatus) => void;
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  loading: false,
  error: null,

  setTickets: (tickets) => set({ tickets }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  createTicket: async (ticketData) => {
    try {
      set({ loading: true, error: null });
      const newTicket = await ticketService.createTicket(ticketData);
      
      set(state => ({
        tickets: [newTicket, ...state.tickets],
        loading: false
      }));

      return newTicket;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao criar ticket',
        loading: false 
      });
      throw error;
    }
  },

  updateTicket: async (ticketId, changes) => {
    try {
      set({ loading: true, error: null });
      const updatedTicket = await ticketService.updateTicket(ticketId, changes);
      set(state => ({
        tickets: state.tickets.map(t => t.id === ticketId ? { ...t, ...updatedTicket } : t),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao atualizar ticket',
        loading: false 
      });
      throw error;
    }
  },

  updateTicketStatus: async (ticketId: string, status: TicketStatus) => {
    const previousTickets = get().tickets;
    const now = new Date();
    
    try {
      // Atualização otimista
      set(state => ({
        tickets: state.tickets.map(t => 
          t.id === ticketId ? { ...t, status, updatedAt: now } : t
        )
      }));

      // Atualizar no backend
      await ticketService.updateTicket(ticketId, {
        status,
        updatedAt: now
      });
    } catch (error) {
      // Reverter em caso de erro
      set({ tickets: previousTickets });
      throw error;
    }
  },

  deleteTicket: async (ticketId) => {
    try {
      set({ loading: true, error: null });
      await ticketService.deleteTicket(ticketId);
      set(state => ({
        tickets: state.tickets.filter(t => t.id !== ticketId),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir ticket',
        loading: false 
      });
      throw error;
    }
  },

  addComment: async (ticketId, commentData) => {
    try {
      set({ loading: true, error: null });
      const newComment = await ticketService.addComment(ticketId, commentData);
      
      // Atualização otimista do estado
      set(state => ({
        tickets: state.tickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              comments: [...(ticket.comments || []), newComment],
              updatedAt: new Date()
            };
          }
          return ticket;
        }),
        loading: false
      }));

      return newComment;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao adicionar comentário',
        loading: false 
      });
      throw error;
    }
  },

  deleteComment: async (ticketId, commentId) => {
    try {
      set({ loading: true, error: null });
      await ticketService.deleteComment(ticketId, commentId);
      
      set(state => ({
        tickets: state.tickets.map(ticket => {
          if (ticket.id === ticketId) {
            return {
              ...ticket,
              comments: ticket.comments?.filter(c => c.id !== commentId) || [],
              updatedAt: new Date()
            };
          }
          return ticket;
        }),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao excluir comentário',
        loading: false 
      });
      throw error;
    }
  },

  optimisticUpdateStatus: (ticketId: string, status: TicketStatus) => {
    const now = new Date();
    set(state => ({
      tickets: state.tickets.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, status, updatedAt: now }
          : ticket
      )
    }));
  }
}));