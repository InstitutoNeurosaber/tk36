import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTicketStore } from '../stores/ticketStore';
import { useNotificationStore } from '../stores/notificationStore';
import { ticketService } from '../services/ticketService';
import { webhookService } from '../services/webhookService';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending' | 'running';
  message?: string;
  duration?: number;
}

export function SystemTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuthStore();
  const { createTicket, deleteTicket } = useTicketStore();
  const { createNotification } = useNotificationStore();

  const tests = [
    {
      name: 'Autenticação',
      run: async () => {
        if (!user) throw new Error('Usuário não autenticado');
        return 'Autenticação OK';
      }
    },
    {
      name: 'Criação de Ticket',
      run: async () => {
        if (!user) throw new Error('Usuário não autenticado');

        const ticket = await createTicket({
          title: '[TESTE] Ticket de Teste',
          description: 'Ticket criado pelo teste do sistema',
          category: 'software',
          priority: 'medium',
          userId: user.uid,
          comments: [],
          attachments: []
        });

        if (!ticket || !ticket.id) {
          throw new Error('Falha ao criar ticket');
        }

        return { message: 'Ticket criado com sucesso', ticketId: ticket.id };
      }
    },
    {
      name: 'Sistema de Notificações',
      run: async () => {
        if (!user) throw new Error('Usuário não autenticado');

        await createNotification({
          ticketId: 'test',
          userId: user.uid,
          message: 'Notificação de teste do sistema'
        });
        return 'Notificação criada com sucesso';
      }
    },
    {
      name: 'Webhooks',
      run: async () => {
        if (!user) throw new Error('Usuário não autenticado');

        const testTicket = {
          id: 'test',
          title: '[TESTE] Webhook',
          description: 'Teste de webhook',
          status: 'open',
          priority: 'medium',
          category: 'software',
          userId: user.uid,
          createdAt: new Date(),
          updatedAt: new Date(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000)
        };

        await webhookService.sendWebhookNotification('ticket.created', testTicket);
        return 'Webhook enviado com sucesso';
      }
    },
    {
      name: 'Exclusão de Ticket',
      run: async () => {
        if (!user) throw new Error('Usuário não autenticado');

        // Criar um ticket para testar a exclusão
        const ticket = await createTicket({
          title: '[TESTE] Ticket para Exclusão',
          description: 'Teste de exclusão',
          category: 'software',
          priority: 'medium',
          userId: user.uid,
          comments: [],
          attachments: []
        });

        if (!ticket || !ticket.id) {
          throw new Error('Falha ao criar ticket para teste de exclusão');
        }

        // Aguardar um momento para garantir que o ticket foi criado
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Tentar excluir o ticket
        await deleteTicket(ticket.id);
        return 'Ticket excluído com sucesso';
      }
    },
    {
      name: 'Limpeza',
      run: async () => {
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar e excluir todos os tickets de teste restantes
        const testTickets = await ticketService.findByTitle('[TESTE]');
        let deletedCount = 0;

        for (const ticket of testTickets) {
          try {
            await deleteTicket(ticket.id);
            deletedCount++;
          } catch (error) {
            console.error(`Erro ao excluir ticket ${ticket.id}:`, error);
          }
        }

        return `${deletedCount} tickets de teste removidos`;
      }
    }
  ];

  const runTests = async () => {
    if (!user) {
      setResults([{
        name: 'Erro',
        status: 'error',
        message: 'Usuário não autenticado'
      }]);
      return;
    }

    setIsRunning(true);
    setResults([]);

    for (const test of tests) {
      // Adiciona o teste como "running" antes de executá-lo
      setResults(prev => [...prev, { name: test.name, status: 'running' }]);
      
      try {
        const startTime = Date.now();
        const result = await test.run();
        const duration = Date.now() - startTime;
        
        // Atualiza o resultado do teste
        setResults(prev => prev.map(r => 
          r.name === test.name 
            ? { 
                name: test.name, 
                status: 'success', 
                message: typeof result === 'string' ? result : result.message,
                duration 
              }
            : r
        ));

        // Pequena pausa entre os testes para melhor visualização
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Erro no teste ${test.name}:`, error);
        setResults(prev => prev.map(r => 
          r.name === test.name 
            ? { 
                name: test.name, 
                status: 'error', 
                message: error instanceof Error ? error.message : 'Erro desconhecido' 
              }
            : r
        ));

        // Pausa maior em caso de erro para melhor visualização
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teste do Sistema</h2>
        <button
          onClick={runTests}
          disabled={isRunning || !user}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Iniciar Testes
            </>
          )}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="p-6 space-y-4">
          {results.map((result, index) => (
            <div
              key={result.name}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                result.status === 'running'
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  : result.status === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : result.status === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700'
              } animate-in fade-in slide-in`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {result.status === 'running' ? (
                    <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                  ) : result.status === 'success' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : result.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {result.name}
                  </h3>
                  {result.message && (
                    <p className={`mt-1 text-sm ${
                      result.status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {result.message}
                    </p>
                  )}
                </div>
              </div>
              {result.duration && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {(result.duration / 1000).toFixed(2)}s
                </span>
              )}
            </div>
          ))}

          {results.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                Nenhum teste executado
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Clique no botão "Iniciar Testes" para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}