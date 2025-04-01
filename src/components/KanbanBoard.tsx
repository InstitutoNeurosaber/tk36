import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useTicketStore } from '../stores/ticketStore';
import type { Ticket, TicketStatus } from '../types/ticket';

interface KanbanBoardProps {
  tickets: Ticket[];
  onTicketClick: (ticket: Ticket) => void;
  onTicketMove?: (ticketId: string, status: TicketStatus) => void;
}

const statusColumns: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export function KanbanBoard({ tickets: initialTickets, onTicketClick, onTicketMove }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<{ ticketId: string; status: TicketStatus } | null>(null);
  const { updateTicketStatus, optimisticUpdateStatus } = useTicketStore();

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 1,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50,
      tolerance: 5,
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const getTicketsByStatus = (status: TicketStatus) => {
    return initialTickets.filter(ticket => ticket.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTicket = initialTickets.find(t => t.id === active.id);
    const overId = over.id as string;

    if (!activeTicket) return;

    const overColumn = overId.startsWith('column-') ? overId.replace('column-', '') as TicketStatus : null;
    if (overColumn && overColumn !== activeTicket.status) {
      setPendingStatus({ ticketId: activeTicket.id, status: overColumn });
      optimisticUpdateStatus(activeTicket.id, overColumn);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    document.body.style.cursor = '';

    if (!over || !pendingStatus) {
      setActiveId(null);
      setPendingStatus(null);
      return;
    }

    const activeTicket = initialTickets.find(t => t.id === active.id);
    if (!activeTicket) return;

    try {
      await updateTicketStatus(pendingStatus.ticketId, pendingStatus.status);
      
      // Notificar componente pai sobre a mudança
      if (onTicketMove) {
        onTicketMove(pendingStatus.ticketId, pendingStatus.status);
      }
    } catch (error) {
      console.error('Erro ao mover ticket:', error);
      // Reverter otimismo em caso de erro
      optimisticUpdateStatus(activeTicket.id, activeTicket.status);
    }

    setActiveId(null);
    setPendingStatus(null);
  };

  const handleDragCancel = () => {
    if (pendingStatus) {
      const ticket = initialTickets.find(t => t.id === pendingStatus.ticketId);
      if (ticket) {
        optimisticUpdateStatus(ticket.id, ticket.status);
      }
    }
    setActiveId(null);
    setPendingStatus(null);
    document.body.style.cursor = '';
  };

  const activeTicket = activeId ? initialTickets.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 min-h-[calc(100vh-12rem)]">
        {statusColumns.map((status) => (
          <KanbanColumn
            key={status}
            id={`column-${status}`}
            status={status}
            tickets={getTicketsByStatus(status)}
            onTicketClick={onTicketClick}
            isOver={pendingStatus?.status === status}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId && activeTicket ? (
          <div className="transform scale-105 rotate-[-2deg]">
            <KanbanCard
              ticket={activeTicket}
              isDragging={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}