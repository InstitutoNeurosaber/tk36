import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Save } from 'lucide-react';
import { useWebhookStore } from '../stores/webhookStore';
import { useAuthStore } from '../stores/authStore';
import type { WebhookEvent, WebhookConfig } from '../types/webhook';

const webhookEvents: { value: WebhookEvent; label: string }[] = [
  { value: 'ticket.created', label: 'Ticket Criado' },
  { value: 'ticket.updated', label: 'Ticket Atualizado' },
  { value: 'ticket.status_changed', label: 'Status do Ticket Alterado' },
  { value: 'ticket.comment_added', label: 'Comentário Adicionado' },
  { value: 'ticket.assigned', label: 'Ticket Atribuído' },
  { value: 'ticket.deleted', label: 'Ticket Excluído' }
];

const webhookSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  url: z.string().url('URL inválida'),
  testUrl: z.string().url('URL de teste inválida').optional().nullable(),
  events: z.array(z.enum(['ticket.created', 'ticket.updated', 'ticket.status_changed', 'ticket.comment_added', 'ticket.assigned', 'ticket.deleted'])).min(1, 'Selecione pelo menos um evento'),
  headers: z.record(z.string()).optional(),
  active: z.boolean()
});

type WebhookFormData = z.infer<typeof webhookSchema>;

interface WebhookFormProps {
  webhook?: WebhookConfig;
  onWebhookCreated: () => void;
  onWebhookUpdated?: () => void;
  onCancel?: () => void;
}

export function WebhookForm({ webhook, onWebhookCreated, onWebhookUpdated, onCancel }: WebhookFormProps) {
  const { user } = useAuthStore();
  const { createWebhook, updateWebhook, loading } = useWebhookStore();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors }
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      active: true,
      events: [],
      headers: {},
      testUrl: null
    }
  });

  // Preencher o formulário quando estiver editando
  useEffect(() => {
    if (webhook) {
      setValue('name', webhook.name);
      setValue('url', webhook.url);
      setValue('testUrl', webhook.testUrl || null);
      setValue('events', webhook.events);
      setValue('headers', webhook.headers || {});
      setValue('active', webhook.active);
    }
  }, [webhook, setValue]);

  const onSubmit = async (data: WebhookFormData, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      if (webhook) {
        // Atualizar webhook existente
        await updateWebhook(webhook.id, {
          ...data,
          userId: user.uid
        });
        setTestResult({ success: true, message: 'Webhook atualizado com sucesso!' });
        onWebhookUpdated?.();
      } else {
        // Criar novo webhook
        await createWebhook({
          ...data,
          userId: user.uid
        });
        setTestResult({ success: true, message: 'Webhook criado com sucesso!' });
        reset();
        onWebhookCreated();
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao salvar webhook'
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        {webhook ? 'Editar Webhook' : 'Novo Webhook'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            URL de Produção
          </label>
          <input
            type="url"
            {...register('url')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            URL de Teste (Opcional)
          </label>
          <input
            type="url"
            {...register('testUrl')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
          {errors.testUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.testUrl.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Eventos
          </label>
          <Controller
            name="events"
            control={control}
            render={({ field }) => (
              <div className="mt-2 space-y-2">
                {webhookEvents.map((event) => (
                  <label key={event.value} className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      value={event.value}
                      checked={field.value.includes(event.value)}
                      onChange={(e) => {
                        const value = e.target.value as WebhookEvent;
                        const newValues = e.target.checked
                          ? [...field.value, value]
                          : field.value.filter((v) => v !== value);
                        field.onChange(newValues);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            )}
          />
          {errors.events && (
            <p className="mt-1 text-sm text-red-600">{errors.events.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Headers (opcional)
          </label>
          <div className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2">
            <Controller
              name="headers"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {Object.entries(field.value || {}).map(([key, value], index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        onChange={(e) => {
                          const newHeaders = { ...field.value };
                          delete newHeaders[key];
                          newHeaders[e.target.value] = value;
                          field.onChange(newHeaders);
                        }}
                        placeholder="Header"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => {
                          field.onChange({
                            ...field.value,
                            [key]: e.target.value
                          });
                        }}
                        placeholder="Value"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newHeaders = { ...field.value };
                          delete newHeaders[key];
                          field.onChange(newHeaders);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange({
                        ...field.value,
                        '': ''
                      });
                    }}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Header
                  </button>
                </div>
              )}
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register('active')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-900">
            Ativo
          </label>
        </div>

        {testResult && (
          <div className={`p-4 rounded-md ${
            testResult.success ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <p className={`text-sm ${
              testResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {testResult.message}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-5 w-5 mr-2" />
            {loading ? 'Salvando...' : webhook ? 'Atualizar Webhook' : 'Salvar Webhook'}
          </button>
        </div>
      </form>
    </div>
  );
}