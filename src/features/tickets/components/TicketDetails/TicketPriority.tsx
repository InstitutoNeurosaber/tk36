import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { priorityLabels } from '../../../../types/ticket';
import type { Ticket } from '../../../../types/ticket';

interface TicketPriorityProps {
  ticket: Ticket;
  onChange: (priority: string, reason?: string) => void;
  disabled: boolean;
}

export function TicketPriority({ ticket, onChange, disabled }: TicketPriorityProps) {
  const [priorityReason, setPriorityReason] = useState('');

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-gray-900">Prioridade</h3>
      
      {ticket.priorityLockedBy && (
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Este ticket teve sua prioridade alterada para{' '}
                <strong>{priorityLabels[ticket.priority].toLowerCase()}</strong>
                {ticket.priorityReason && (
                  <>, pois {ticket.priorityReason}</>
                )}
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Alterado por {ticket.priorityLockedBy} em{' '}
                {new Date(ticket.priorityLockedAt!).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}

      <select
        value={ticket.priority}
        onChange={(e) => onChange(e.target.value, priorityReason)}
        disabled={disabled}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
      >
        {Object.entries(priorityLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {ticket.priority !== ticket.priority && (
        <div className="mt-2">
          <label className="block text-sm font-medium text-gray-700">
            Motivo da alteração
          </label>
          <input
            type="text"
            value={priorityReason}
            onChange={(e) => setPriorityReason(e.target.value)}
            placeholder="Ex: não foi identificada urgência na situação"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      )}
    </div>
  );
}