import React, { useState } from 'react';
import { Globe, Bell, Beaker, Edit2, Trash2, Send } from 'lucide-react';
import { useWebhookStore } from '../stores/webhookStore';
import { useAuthStore } from '../stores/authStore';
import type { WebhookConfig, WebhookEvent } from '../types/webhook';
import { WebhookTestModal } from './WebhookTestModal';
import { statusLabels, priorityLabels, categoryLabels } from '../types/ticket';

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
    labels: {
      status: statusLabels.open,
      priority: priorityLabels.medium,
      category: categoryLabels.software
    },
    clickup: {
      status: 'ABERTO',
      priority: 3,
      due_date: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 dias
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
      labels: {
        status: statusLabels.open
      },
      clickup: {
        status: 'ABERTO',
        priority: 3,
        due_date: Date.now() + (7 * 24 * 60 * 60 * 1000),
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
      userId: 'test-user'
    },
    oldStatus: 'open',
    newStatus: 'in_progress',
    labels: {
      oldStatus: statusLabels.open,
      newStatus: statusLabels.in_progress
    },
    clickup: {
      old_status: 'ABERTO',
      new_status: 'EM ANDAMENTO',
      priority: 3,
      due_date: Date.now() + (7 * 24 * 60 * 60 * 1000),
      due_date_time: true,
      time_estimate: 8640000,
      start_date: Date.now(),
      start_date_time: true,
      points: 3
    },
    metadata: {
      changedBy: 'test-user',
      changedAt: new Date().toISOString(),
      reason: 'Teste de mudança de status'
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
      clickup: {
        status: 'ABERTO',
        priority: 3,
        due_date: Date.now() + (7 * 24 * 60 * 60 * 1000),
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
      labels: {
        status: statusLabels.open,
        priority: priorityLabels.medium,
        category: categoryLabels.software
      },
      clickup: {
        status: 'ABERTO',
        priority: 3,
        due_date: Date.now() + (7 * 24 * 60 * 60 * 1000),
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
      previousAssignee: null
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
      taskId: 'task-123', // ID da tarefa no ClickUp
      labels: {
        status: statusLabels.closed,
        priority: priorityLabels.medium,
        category: categoryLabels.software
      },
      clickup: {
        status: 'FECHADO',
        priority: 3,
        due_date: Date.now() + (7 * 24 * 60 * 60 * 1000),
        due_date_time: true,
        time_estimate: 8640000,
        start_date: Date.now(),
        start_date_time: true,
        points: 3
      }
    },
    metadata: {
      deletedBy: 'test-user',
      deletedAt: new Date().toISOString(),
      reason: 'Teste de exclusão',
      taskId: 'task-123' // ID da tarefa nos metadados também
    },
    isTest: true,
    timestamp: new Date().toISOString()
  }
};

const eventLabels: Record<WebhookEvent, string> = {
  'ticket.created': 'Ticket Criado',
  'ticket.updated': 'Ticket Atualizado',
  'ticket.status_changed': 'Status Alterado',
  'ticket.comment_added': 'Comentário Adicionado',
  'ticket.assigned': 'Ticket Atribuído',
  'ticket.deleted': 'Ticket Excluído'
};

interface WebhookListProps {
  onWebhookDeleted: () => void;
  onEdit: (webhook: WebhookConfig) => void;
}

export function WebhookList({ onWebhookDeleted, onEdit }: WebhookListProps) {
  const { user } = useAuthStore();
  const { webhooks, deleteWebhook, testWebhook } = useWebhookStore();
  const [testModal, setTestModal] = useState({
    isOpen: false,
    loading: false,
    result: null as any,
    webhookId: null as string | null
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este webhook?')) {
      await deleteWebhook(id);
      onWebhookDeleted();
    }
  };

  const handleTest = async (webhook: WebhookConfig, event: WebhookEvent) => {
    setTestModal({
      isOpen: true,
      loading: true,
      result: null,
      webhookId: webhook.id
    });

    try {
      const result = await testWebhook(webhook.id, {
        event,
        data: testPayloads[event],
        timestamp: new Date().toISOString(),
        user: {
          id: user?.uid || 'test-user',
          email: user?.email || 'test@example.com',
          name: 'Usuário de Teste'
        }
      });

      setTestModal(prev => ({
        ...prev,
        loading: false,
        result: {
          success: true,
          message: 'Webhook testado com sucesso!',
          response: result
        }
      }));
    } catch (error) {
      setTestModal(prev => ({
        ...prev,
        loading: false,
        result: {
          success: false,
          message: error instanceof Error ? error.message : 'Erro ao testar webhook'
        }
      }));
    }
  };

  return (
    <>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Webhooks Configurados</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {webhooks.map((webhook) => (
            <div key={webhook.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span>{webhook.name}</span>
                    {webhook.active ? (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Inativo
                      </span>
                    )}
                  </h4>
                  <p className="mt-1 text-sm text-gray-500 flex items-center space-x-2">
                    <span>URL: {webhook.url}</span>
                    {webhook.testUrl && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <Beaker className="h-4 w-4 mr-1" />
                          Teste: {webhook.testUrl}
                        </span>
                      </>
                    )}
                  </p>
                  <div className="mt-2">
                    {webhook.events.map((event) => (
                      <button
                        key={event}
                        onClick={() => handleTest(webhook, event)}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2 hover:bg-blue-200 transition-colors"
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        {eventLabels[event]}
                        <Send className="h-3 w-3 ml-1" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => onEdit(webhook)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                    title="Editar webhook"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Excluir webhook"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum webhook configurado</p>
            </div>
          )}
        </div>
      </div>

      <WebhookTestModal
        isOpen={testModal.isOpen}
        onClose={() => setTestModal(prev => ({ ...prev, isOpen: false }))}
        loading={testModal.loading}
        result={testModal.result}
      />
    </>
  );
}