import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Clock, MessageSquare, Eye, Link, Mail } from 'lucide-react';
import { priorityColors, priorityLabels } from '../types/ticket';
import type { Ticket } from '../types/ticket';

interface KanbanCardProps {
  ticket: Ticket;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ ticket, onClick, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: ticket.id,
    data: {
      type: 'ticket',
      ticket
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
    cursor: 'grab'
  };

  const isOverdue = (deadline?: Date) => {
    if (!deadline) return false;
    return new Date() > new Date(deadline);
  };

  const getTimeRemaining = (deadline?: Date) => {
    if (!deadline) return 'Sem prazo';
    const now = new Date();
    const diff = new Date(deadline).getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) return 'Atrasado';
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group
        bg-white rounded-lg p-4 shadow-sm
        transition-all duration-200
        hover:shadow-md
        ${isSortableDragging ? 'shadow-lg ring-2 ring-primary ring-opacity-50 rotate-[-2deg]' : ''}
        ${isOverdue(ticket.deadline) ? 'border-l-4 border-red-500' : 'border border-gray-100'}
        relative
        select-none
        ${isDragging ? 'opacity-50' : ''}
        active:cursor-grabbing
      `}
    >
      {/* Botão de visualização */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.();
        }}
        className={`
          absolute top-2 right-2
          p-2 rounded-full
          bg-gray-100 text-gray-600
          hover:bg-primary hover:text-white
          transition-all duration-200
          opacity-0 group-hover:opacity-100
          transform translate-y-1 group-hover:translate-y-0
          cursor-pointer
          z-10
        `}
        title="Visualizar detalhes"
      >
        <Eye className="h-4 w-4" />
      </button>

      {/* Conteúdo do card */}
      <div onClick={() => onClick?.()} className="pr-8">
        {/* Header com título e prioridade */}
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900 line-clamp-2">{ticket.title}</h4>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${priorityColors[ticket.priority]}`}>
            {priorityLabels[ticket.priority]}
          </span>
        </div>

        {/* Descrição */}
        <p className="text-sm text-gray-500 line-clamp-2 mt-2 mb-3">
          {ticket.description}
        </p>

        {/* Informações adicionais */}
        <div className="flex flex-col space-y-2">
          {/* IDs externos */}
          <div className="flex flex-wrap gap-2">
            {ticket.taskId && (
              <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                <Link className="h-4 w-4 mr-1" />
                <span>ClickUp #{ticket.taskId}</span>
              </div>
            )}
            {ticket.gmailId && (
              <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-md">
                <Mail className="h-4 w-4 mr-1" />
                <span>Gmail #{ticket.gmailId}</span>
              </div>
            )}
          </div>

          {/* Prazo e contadores */}
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center ${
              isOverdue(ticket.deadline) ? 'text-red-600' : 'text-gray-500'
            }`}>
              <Clock className="w-4 h-4 mr-1" />
              <span>{getTimeRemaining(ticket.deadline)}</span>
            </div>

            <div className="flex items-center space-x-2">
              {ticket.comments?.length > 0 && (
                <div className="flex items-center text-blue-600">
                  <MessageSquare className="w-4 w-4 mr-1" />
                  <span>{ticket.comments.length}</span>
                </div>
              )}
              {ticket.attachments?.length > 0 && (
                <div className="flex items-center text-purple-600">
                  <AlertCircle className="w-4 w-4 mr-1" />
                  <span>{ticket.attachments.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}