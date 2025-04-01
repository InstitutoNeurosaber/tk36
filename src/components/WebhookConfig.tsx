import React, { useEffect, useState } from 'react';
import { Webhook, Clock as ClickUp, Code, TestTube } from 'lucide-react';
import { useWebhookStore } from '../stores/webhookStore';
import { useAuthStore } from '../stores/authStore';
import { WebhookForm } from './WebhookForm';
import { WebhookList } from './WebhookList';
import { WebhookTest } from './WebhookTest';
import { ClickUpConfig } from './ClickUpConfig';
import { ApiDocs } from './ApiDocs';
import { N8nDocs } from './N8nDocs';
import { SystemTest } from './SystemTest';
import type { WebhookConfig as WebhookConfigType } from '../types/webhook';

export function WebhookConfig() {
  const [activeTab, setActiveTab] = React.useState<'webhooks' | 'clickup' | 'api' | 'n8n' | 'test'>('webhooks');
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfigType | null>(null);
  const { user } = useAuthStore();
  const { fetchWebhooks } = useWebhookStore();

  useEffect(() => {
    if (user) {
      fetchWebhooks(user.uid);
    }
  }, [user, fetchWebhooks]);

  const handleWebhookCreated = async () => {
    if (user) {
      await fetchWebhooks(user.uid);
    }
  };

  const handleWebhookUpdated = async () => {
    if (user) {
      await fetchWebhooks(user.uid);
      setEditingWebhook(null);
    }
  };

  const handleWebhookDeleted = async () => {
    if (user) {
      await fetchWebhooks(user.uid);
    }
  };

  const handleEdit = (webhook: WebhookConfigType) => {
    setEditingWebhook(webhook);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`${
              activeTab === 'webhooks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Webhook className="h-5 w-5 mr-2" />
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('clickup')}
            className={`${
              activeTab === 'clickup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <ClickUp className="h-5 w-5 mr-2" />
            ClickUp
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`${
              activeTab === 'api'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Code className="h-5 w-5 mr-2" />
            API
          </button>
          <button
            onClick={() => setActiveTab('n8n')}
            className={`${
              activeTab === 'n8n'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <Code className="h-5 w-5 mr-2" />
            n8n
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`${
              activeTab === 'test'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <TestTube className="h-5 w-5 mr-2" />
            Teste do Sistema
          </button>
        </nav>
      </div>

      {activeTab === 'webhooks' ? (
        <>
          <WebhookForm 
            webhook={editingWebhook}
            onWebhookCreated={handleWebhookCreated}
            onWebhookUpdated={handleWebhookUpdated}
            onCancel={editingWebhook ? () => setEditingWebhook(null) : undefined}
          />
          <WebhookTest />
          <WebhookList 
            onWebhookDeleted={handleWebhookDeleted}
            onEdit={handleEdit}
          />
        </>
      ) : activeTab === 'clickup' ? (
        <ClickUpConfig />
      ) : activeTab === 'api' ? (
        <ApiDocs />
      ) : activeTab === 'n8n' ? (
        <N8nDocs />
      ) : (
        <SystemTest />
      )}
    </div>
  );
}