import React from 'react';
import { Trash2, X } from 'lucide-react';
import type { Ticket } from '../../../../types/ticket';

interface TicketHeaderProps {
  ticket: Ticket;
  onClose: () => void;
  onDelete: () => void;
}

export function TicketHeader({ ticket, onClose, onDelete }: TicketHeaderProps) {
  return (
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
      <div className="flex space-x-2">
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 transition-colors duration-200"
          title="Excluir ticket"
        >
          <Trash2 className="w-6 h-6" />
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-500"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}