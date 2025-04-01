import type { Ticket } from '../../../types/ticket';

export const filters = {
  searchTickets(tickets: Ticket[], searchTerm: string): Ticket[] {
    if (!searchTerm) return tickets;
    
    const term = searchTerm.toLowerCase();
    return tickets.filter(ticket => 
      ticket.title.toLowerCase().includes(term) ||
      ticket.description.toLowerCase().includes(term)
    );
  },

  filterByStatus(tickets: Ticket[], status: string): Ticket[] {
    if (status === 'all') return tickets;
    return tickets.filter(ticket => ticket.status === status);
  },

  filterByPriority(tickets: Ticket[], priority: string): Ticket[] {
    if (priority === 'all') return tickets;
    return tickets.filter(ticket => ticket.priority === priority);
  },

  filterByCategory(tickets: Ticket[], category: string): Ticket[] {
    if (category === 'all') return tickets;
    return tickets.filter(ticket => ticket.category === category);
  }
};