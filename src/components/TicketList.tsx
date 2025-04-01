import React, { useState } from 'react';
import { AlertCircle, Clock, HardDrive, Network, Settings, Trash2, Link, LayoutList, Kanban as LayoutKanban } from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';
import { useAuthStore } from '../stores/authStore';
import type { Ticket, TicketStatus, TicketCategory } from '../types/ticket';
import { statusLabels, priorityLabels, statusColors, priorityColors } from '../types/ticket';

const categoryIcons: Record<TicketCategory, React.ReactNode> = {
  software: <Settings className="w-5 h-5" />,
  hardware: <HardDrive className="w-5 h-5" />,
  network: <Network className="w-5 h-5" />,
  other: <AlertCircle className="w-5 h-5" />
};

interface TicketListProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onStatusChange: (ticketId: string, status: TicketStatus) => void;
}

export function TicketList({ 
  tickets, 
  onTicketClick, 
  onDeleteTicket,
  onStatusChange 
}: TicketListProps) {
  const { userData } = useAuthStore();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(userData?.role === 'admin' ? 'kanban' : 'list');

  const isOverdue = (deadline?: Date) => {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  };

  const getTimeRemaining = (deadline?: Date) => {
    if (!deadline) return 'Sem prazo definido';

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diff = deadlineDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) {
      return 'Atrasado';
    }
    if (days > 0) {
      return `${days}d ${hours}h restantes`;
    }
    if (hours > 0) {
      return `${hours}h restantes`;
    }
    return 'Menos de 1h restante';
  };

  return (
    <div className="space-y-4">
      {/* Mostrar seletor de visualização apenas para admins */}
      {userData?.role === 'admin' && (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium inline-flex items-center ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutList className="h-4 w-4 mr-1" />
            Lista
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1 rounded-md text-sm font-medium inline-flex items-center ${
              viewMode === 'kanban'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutKanban className="h-4 w-4 mr-1" />
            Kanban
          </button>
        </div>
      )}

      {viewMode === 'kanban' && userData?.role === 'admin' ? (
        <KanbanBoard
          tickets={tickets}
          onTicketClick={onTicketClick}
          onTicketMove={onStatusChange}
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="group bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all cursor-pointer border border-gray-100 relative"
            >
              {/* Botão de excluir */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Tem certeza que deseja excluir este ticket?')) {
                    onDeleteTicket(ticket.id);
                  }
                }}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Excluir ticket"
              >
                <Trash2 className="h-5 w-5" />
              </button>

              {/* Conteúdo do card (clicável para abrir detalhes) */}
              <div onClick={() => onTicketClick(ticket)} className="pr-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">{categoryIcons[ticket.category]}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {ticket.description}
                      </p>
                      {ticket.taskId && (
                        <div className="flex items-center mt-2 text-xs text-blue-600">
                          <Link className="h-4 w-4 mr-1" />
                          <span>ID da Tarefa: {ticket.taskId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                        {priorityLabels[ticket.priority]}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                        {statusLabels[ticket.status]}
                      </span>
                    </div>
                    <span className={`text-xs flex items-center ${
                      isOverdue(ticket.deadline) ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      <Clock className="w-4 h-4 mr-1" />
                      {getTimeRemaining(ticket.deadline)}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  Criado em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          ))}

          {tickets.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum ticket encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}