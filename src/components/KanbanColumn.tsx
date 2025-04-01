import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { statusLabels } from '../types/ticket';
import type { Ticket, TicketStatus } from '../types/ticket';

interface KanbanColumnProps {
  id: string;
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  isOver: boolean;
}

const columnStyles: Record<TicketStatus, string> = {
  open: 'bg-red-50 border-red-200 shadow-red-100',
  in_progress: 'bg-yellow-50 border-yellow-200 shadow-yellow-100',
  resolved: 'bg-blue-50 border-blue-200 shadow-blue-100',
  closed: 'bg-green-50 border-green-200 shadow-green-100'
};

const headerStyles: Record<TicketStatus, string> = {
  open: 'text-red-700 bg-red-100',
  in_progress: 'text-yellow-700 bg-yellow-100',
  resolved: 'text-blue-700 bg-blue-100',
  closed: 'text-green-700 bg-green-100'
};

const countStyles: Record<TicketStatus, string> = {
  open: 'bg-red-200 text-red-800',
  in_progress: 'bg-yellow-200 text-yellow-800',
  resolved: 'bg-blue-200 text-blue-800',
  closed: 'bg-green-200 text-green-800'
};

export function KanbanColumn({ id, status, tickets, onTicketClick, isOver }: KanbanColumnProps) {
  const { setNodeRef, isOver: isOverColumn } = useDroppable({
    id,
    data: {
      status,
      accepts: ['ticket']
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        rounded-lg border ${columnStyles[status]} 
        transition-all duration-200 ease-in-out
        min-h-[calc(100vh-12rem)] flex flex-col
        ${isOver ? 'ring-2 ring-primary ring-opacity-50 transform scale-[1.02] shadow-lg' : ''}
      `}
    >
      <div className={`p-4 rounded-t-lg ${headerStyles[status]}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{statusLabels[status]}</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${countStyles[status]}`}>
            {tickets.length}
          </span>
        </div>
      </div>

      <SortableContext
        items={tickets.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div 
          className={`
            p-4 space-y-3 flex-1 overflow-y-auto
            ${isOver ? 'bg-primary/5' : ''}
            transition-colors duration-200
          `}
        >
          {tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => onTicketClick(ticket)}
            />
          ))}
          
          {tickets.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-500">Nenhum ticket</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}