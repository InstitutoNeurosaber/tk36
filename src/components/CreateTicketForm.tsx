import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { TicketCategory, TicketPriority } from '../types/ticket';
import { priorityLabels, priorityDeadlines } from '../types/ticket';

interface CreateTicketFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
  }) => void;
}

export function CreateTicketForm({ onSubmit }: CreateTicketFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'software' as TicketCategory,
    priority: 'medium' as TicketPriority
  });

  const [deadline, setDeadline] = useState<Date>(new Date());

  useEffect(() => {
    const now = new Date();
    const newDeadline = new Date(now.getTime() + priorityDeadlines[formData.priority]);
    setDeadline(newDeadline);
  }, [formData.priority]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      category: 'software',
      priority: 'medium'
    });
  };

  const formatDeadline = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descrição
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Categoria
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TicketCategory })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="software">Software</option>
            <option value="hardware">Hardware</option>
            <option value="network">Rede</option>
            <option value="other">Outro</option>
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Prioridade
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as TicketPriority })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="low">Baixa</option>
            <option value="medium">Normal</option>
            <option value="high">Alta</option>
            <option value="critical">Urgente</option>
          </select>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Prazo de Entrega</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>Com base na prioridade <strong>{priorityLabels[formData.priority]}</strong>, 
              este ticket deverá ser entregue até:</p>
              <p className="mt-1 font-semibold">{formatDeadline(deadline)}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Criar Ticket
        </button>
      </div>
    </form>
  );
}