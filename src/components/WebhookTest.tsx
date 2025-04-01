import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useWebhookStore } from '../stores/webhookStore';
import type { WebhookEvent } from '../types/webhook';
import { statusLabels, priorityLabels, categoryLabels, clickupStatusMap, clickupPriorityMap, priorityDeadlines } from '../types/ticket';
import { WebhookTestModal } from './WebhookTestModal';

const testPayloads: Record<WebhookEvent, unknown> = {
  'ticket.created': {
    id: 'test-123',
    title: 'Teste de Webhook',
    description: 'Este é um ticket de teste para webhook',
    status: 'open',
    priority: 'medium',
    category: 'software',
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deadline: {
      iso: new Date(Date.now() + priorityDeadlines.medium).toISOString(),
      timestamp: Date.now() + priorityDeadlines.medium
    },
    labels: {
      status: statusLabels.open,
      priority: priorityLabels.medium,
      category: categoryLabels.software
    },
    clickup: {
      status: clickupStatusMap.open,
      priority: clickupPriorityMap.medium,
      due_date: Date.now() + priorityDeadlines.medium,
      due_date_time: true,
      time_estimate: 8640000, // 2.4 horas em ms
      start_date: Date.now(),
      start_date_time: true,
      points: 3
    },
    isTest: true,
    timestamp: new Date().toISOString()
  },
  'ticket.updated': {
    ticket: {
      id: 'test-123',
      title: 'Teste de Webhook',
      status: 'open',
      taskId: 'task-123',
      deadline: {
        iso: new Date(Date.now() + priorityDeadlines.medium).toISOString(),
        timestamp: Date.now() + priorityDeadlines.medium
      },
      labels: {
        status: statusLabels.open
      },
      clickup: {
        status: clickupStatusMap.open,
        priority: clickupPriorityMap.medium,
        due_date: Date.now() + priorityDeadlines.medium,
        due_date_time: true,
        time_estimate: 8640000,
        start_date: Date.now(),
        start_date_time: true,
        points: 3
      }
    },
    changes: {
      title: 'Título Atualizado',
      description: 'Descrição atualizada'
    },
    metadata: {
      changedBy: 'test-user',
      changedAt: new Date().toISOString()
    },
    isTest: true,
    timestamp: new Date().toISOString()
  },
  'ticket.status_changed': {
    ticket: {
      id: 'test-123',
      title: 'Teste de Webhook',
      userId: 'test-user',
      taskId: 'task-123',
      deadline: {
        iso: new Date(Date.now() + priorityDeadlines.medium).toISOString(),
        timestamp: Date.now() + priorityDeadlines.medium
      }
    },
    oldStatus: 'open',
    newStatus: 'in_progress',
    labels: {
      oldStatus: statusLabels.open,
      newStatus: statusLabels.in_progress
    },
    clickup: {
      old_status: clickupStatusMap.open,
      new_status: clickupStatusMap.in_progress,
      priority: clickupPriorityMap.medium,
      due_date: Date.now() + priorityDeadlines.medium,
      due_date_time: true,
      time_estimate: 8640000,
      start_date: Date.now(),
      start_date_time: true,
      points: 3
    },
    metadata: {
      changedBy: 'test-user',
      changedAt: new Date().toISOString(),
      reason: 'Teste de mudança de status',
      taskId: 'task-123'
    },
    isTest: true,
    timestamp: new Date().toISOString()
  },
  'ticket.comment_added': {
    ticketId: 'test-123',
    comment: {
      id: 'comment-123',
      content: 'Este é um comentário de teste',
      userId: 'test-user',
      createdAt: new Date().toISOString()
    },
    metadata: {
      ticketTitle: 'Teste de Webhook',
      ticketStatus: 'open',
      taskId: 'task-123',
      clickup: {
        status: clickupStatusMap.open,
        priority: clickupPriorityMap.medium,
        due_date: Date.now() + priorityDeadlines.medium,
        due_date_time: true,
        time_estimate: 8640000,
        start_date: Date.now(),
        start_date_time: true,
        points: 3
      },
      commentType: 'public'
    },
    isTest: true,
    timestamp: new Date().toISOString()
  },
  'ticket.assigned': {
    ticket: {
      id: 'test-123',
      title: 'Teste de Webhook',
      status: 'open',
      priority: 'medium',
      category: 'software',
      taskId: 'task-123',
      deadline: {
        iso: new Date(Date.now() + priorityDeadlines.medium).toISOString(),
        timestamp: Date.now() + priorityDeadlines.medium
      },
      labels: {
        status: statusLabels.open,
        priority: priorityLabels.medium,
        category: categoryLabels.software
      },
      clickup: {
        status: clickupStatusMap.open,
        priority: clickupPriorityMap.medium,
        due_date: Date.now() + priorityDeadlines.medium,
        due_date_time: true,
        time_estimate: 8640000,
        start_date: Date.now(),
        start_date_time: true,
        points: 3
      }
    },
    assignedToId: 'assigned-user-123',
    assignedToName: 'Usuário de Teste',
    metadata: {
      assignedBy: 'test-user',
      assignedAt: new Date().toISOString(),
      previousAssignee: null,
      taskId: 'task-123'
    },
    isTest: true,
    timestamp: new Date().toISOString()
  },
  'ticket.deleted': {
    ticket: {
      id: 'test-123',
      title: 'Teste de Webhook',
      status: 'closed',
      priority: 'medium',
      category: 'software',
      taskId: 'task-123',
      deadline: {
        iso: new Date(Date.now() + priorityDeadlines.medium).toISOString(),
        timestamp: Date.now() + priorityDeadlines.medium
      },
      labels: {
        status: statusLabels.closed,
        priority: priorityLabels.medium,
        category: categoryLabels.software
      },
      clickup: {
        status: clickupStatusMap.closed,
        priority: clickupPriorityMap.medium,
        due_date: Date.now() + priorityDeadlines.medium,
        due_date_time: true,
        time_estimate: 8640000,
        start_date: Date.now(),
        start_date_time: true,
        points: 3
      }
    },
    metadata: {
      deletedAt: new Date().toISOString(),
      deletedBy: 'test-user',
      reason: 'Teste de exclusão',
      taskId: 'task-123'
    },
    isTest: true,
    timestamp: new Date().toISOString()
  }
};

export function WebhookTest() {
  const { testWebhook } = useWebhookStore();
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent>('ticket.created');
  const [loading, setLoading] = useState(false);
  const [testModal, setTestModal] = useState({
    isOpen: false,
    loading: false,
    result: null as any
  });

  const handleTest = async () => {
    setLoading(true);
    setTestModal({ isOpen: true, loading: true, result: null });
    
    try {
      const response = await testWebhook(selectedEvent, testPayloads[selectedEvent]);
      setTestModal({
        isOpen: true,
        loading: false,
        result: {
          success: true,
          message: 'Evento de teste enviado com sucesso!',
          taskId: response?.taskId,
          response
        }
      });
    } catch (error) {
      setTestModal({
        isOpen: true,
        loading: false,
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao enviar evento de teste'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Testar Webhook</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Selecione o Evento
          </label>
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value as WebhookEvent)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="ticket.created">Ticket Criado</option>
            <option value="ticket.updated">Ticket Atualizado</option>
            <option value="ticket.status_changed">Status Alterado</option>
            <option value="ticket.comment_added">Comentário Adicionado</option>
            <option value="ticket.assigned">Ticket Atribuído</option>
            <option value="ticket.deleted">Ticket Excluído</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Payload de Teste
          </label>
          <pre className="mt-1 p-4 bg-gray-50 rounded-md overflow-auto text-sm">
            {JSON.stringify(testPayloads[selectedEvent], null, 2)}
          </pre>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={handleTest}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Enviando...' : 'Enviar Teste'}
          </button>
        </div>
      </div>

      <WebhookTestModal
        isOpen={testModal.isOpen}
        onClose={() => setTestModal(prev => ({ ...prev, isOpen: false }))}
        loading={testModal.loading}
        result={testModal.result}
      />
    </div>
  );
}