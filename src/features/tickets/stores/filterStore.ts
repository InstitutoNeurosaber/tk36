import { create } from 'zustand';
import type { TicketStatus, TicketPriority, TicketCategory } from '../../../types/ticket';

interface FilterState {
  searchTerm: string;
  status: TicketStatus | 'all';
  priority: TicketPriority | 'all';
  category: TicketCategory | 'all';
  setSearchTerm: (term: string) => void;
  setStatus: (status: TicketStatus | 'all') => void;
  setPriority: (priority: TicketPriority | 'all') => void;
  setCategory: (category: TicketCategory | 'all') => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchTerm: '',
  status: 'all',
  priority: 'all',
  category: 'all',

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setStatus: (status) => set({ status }),
  setPriority: (priority) => set({ priority }),
  setCategory: (category) => set({ category }),
  
  clearFilters: () => set({
    searchTerm: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  })
}));