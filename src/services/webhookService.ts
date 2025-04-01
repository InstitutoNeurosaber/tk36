import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { WebhookConfig, WebhookEvent } from '../types/webhook';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { clickupStatusMap, clickupPriorityMap } from '../types/ticket';

// Configurar axios com retry e timeout mais longo
const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Configurar retry com backoff exponencial
axiosRetry(axiosInstance, { 
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.code === 'ECONNABORTED' ||
           (error.response?.status && error.response.status >= 500);
  },
  shouldResetTimeout: true
});

interface WebhookResponse {
  taskId?: string;
  gmailId?: string;
  status?: string;
  priority?: string;
}

export const webhookService = {
  async getActiveWebhooks(event: WebhookEvent): Promise<WebhookConfig[]> {
    try {
      const webhooksRef = collection(db, 'webhooks');
      const q = query(
        webhooksRef,
        where('active', '==', true),
        where('events', 'array-contains', event)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      })) as WebhookConfig[];
    } catch (error) {
      console.error('Erro ao buscar webhooks:', error);
      return [];
    }
  },

  async sendWebhookNotification(event: WebhookEvent, data: unknown): Promise<WebhookResponse | undefined> {
    try {
      const webhooks = await this.getActiveWebhooks(event);
      
      if (webhooks.length === 0) {
        console.log('Nenhum webhook ativo para o evento:', event);
        return;
      }

      const baseUrl = window.location.origin;
      const ticketUrl = `${baseUrl}/tickets/${(data as any).id}`;

      // Buscar dados do criador do ticket
      const creatorData = await this.getTicketCreatorData((data as any).userId);

      // Preparar dados do webhook com tratamento seguro de datas
      const prepareWebhookData = () => {
        const deadlineDate = (data as any).deadline;
        let deadlineTimestamp: number | undefined;

        if (deadlineDate) {
          if (deadlineDate instanceof Date) {
            deadlineTimestamp = deadlineDate.getTime();
          } else if (typeof deadlineDate === 'string') {
            deadlineTimestamp = new Date(deadlineDate).getTime();
          }
        }

        const createdAtDate = (data as any).createdAt;
        const startDate = createdAtDate instanceof Date ? 
          createdAtDate.getTime() : 
          typeof createdAtDate === 'string' ? 
            new Date(createdAtDate).getTime() : 
            Date.now();

        // Limpar dados removendo campos undefined e funções
        const cleanData = JSON.parse(JSON.stringify({
          ...data,
          creator: creatorData,
          deadline: deadlineTimestamp ? {
            iso: new Date(deadlineTimestamp).toISOString(),
            timestamp: deadlineTimestamp
          } : undefined,
          url: ticketUrl,
          clickup: {
            status: (data as any).status ? clickupStatusMap[(data as any).status] : undefined,
            priority: (data as any).priority ? clickupPriorityMap[(data as any).priority] : undefined,
            due_date: deadlineTimestamp,
            due_date_time: Boolean(deadlineTimestamp),
            time_estimate: 8640000,
            start_date: startDate,
            start_date_time: true,
            points: 3
          }
        }));

        return cleanData;
      };

      const payload = {
        event,
        data: prepareWebhookData(),
        timestamp: new Date().toISOString()
      };

      // Enviar webhooks em paralelo
      const results = await Promise.allSettled(webhooks.map(async webhook => {
        try {
          const url = webhook.url;
          
          const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(webhook.headers || {})
          };

          const response = await axiosInstance({
            method: 'POST',
            url,
            headers,
            data: payload,
            validateStatus: (status) => {
              return status >= 200 && status < 300;
            }
          });

          console.log(`Webhook enviado com sucesso para ${url}`, response.data);

          // Extrair dados da resposta priorizando ClickUp
          const webhookResponse: WebhookResponse = {};

          // Verificar se é uma resposta do ClickUp
          const isClickUpResponse = response.data?.history_items || 
                                  response.data?.task || 
                                  response.data?.list || 
                                  response.data?.space;

          if (isClickUpResponse) {
            // Extrair ID do ClickUp de diferentes locais possíveis na resposta
            webhookResponse.taskId = 
              response.data?.task?.id ||
              response.data?.id ||
              response.data?.task_id ||
              response.data?.history_items?.[0]?.task?.id ||
              response.data?.history_items?.[0]?.after?.id;

            // Extrair status e prioridade do ClickUp
            if (response.data?.status || response.data?.task?.status) {
              webhookResponse.status = response.data.status || response.data.task.status;
            }
            if (response.data?.priority || response.data?.task?.priority) {
              webhookResponse.priority = response.data.priority || response.data.task.priority;
            }
          } else {
            // Se não for resposta do ClickUp, usar outros IDs disponíveis
            if (response.data?.id) {
              webhookResponse.taskId = response.data.id;
            }
            if (!webhookResponse.taskId && response.data?.gmailId) {
              webhookResponse.gmailId = response.data.gmailId;
            }
            if (response.data?.status) {
              webhookResponse.status = response.data.status;
            }
            if (response.data?.priority) {
              webhookResponse.priority = response.data.priority;
            }
          }

          return { success: true, url, response: webhookResponse };
        } catch (error) {
          console.error(`Erro ao enviar webhook para ${webhook.url}:`, error);
          
          if (axios.isAxiosError(error)) {
            console.error('Detalhes do erro:', {
              status: error.response?.status,
              data: error.response?.data,
              headers: error.response?.headers,
              config: error.config
            });
          }

          // Adicionar à fila em caso de erro
          try {
            const queueRef = collection(db, 'webhook_queue');
            await addDoc(queueRef, {
              webhook: {
                id: webhook.id,
                url: webhook.url,
                headers: webhook.headers || {}
              },
              event,
              data: payload,
              status: 'pending',
              attempts: 0,
              maxAttempts: 3,
              createdAt: Timestamp.now(),
              nextAttempt: Timestamp.now(),
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
            console.log(`Webhook adicionado à fila para retry: ${webhook.url}`);
          } catch (queueError) {
            console.error('Erro ao adicionar webhook à fila:', queueError);
          }
          
          return { success: false, url: webhook.url, error };
        }
      }));

      // Processar respostas bem-sucedidas
      const successfulResults = results.filter(
        (result): result is PromiseFulfilledResult<{ success: true; response: WebhookResponse }> => 
          result.status === 'fulfilled' && result.value.success
      );

      if (successfulResults.length > 0) {
        // Combinar todas as respostas em uma única, priorizando ClickUp
        const combinedResponse: WebhookResponse = {};
        
        // Primeiro procurar por respostas do ClickUp
        const clickupResponse = successfulResults.find(result => 
          result.value.response.taskId && 
          result.value.response.taskId.startsWith('task_')
        );

        if (clickupResponse) {
          // Se encontrou resposta do ClickUp, usar ela
          Object.assign(combinedResponse, clickupResponse.value.response);
        } else {
          // Se não encontrou ClickUp, usar outras respostas
          successfulResults.forEach(result => {
            const response = result.value.response;
            if (response.taskId && !combinedResponse.taskId) {
              combinedResponse.taskId = response.taskId;
            }
            if (response.gmailId && !combinedResponse.taskId && !combinedResponse.gmailId) {
              combinedResponse.gmailId = response.gmailId;
            }
            if (response.status && !combinedResponse.status) {
              combinedResponse.status = response.status;
            }
            if (response.priority && !combinedResponse.priority) {
              combinedResponse.priority = response.priority;
            }
          });
        }

        console.log('Resposta combinada dos webhooks:', combinedResponse);
        return combinedResponse;
      }

      return undefined;

    } catch (error) {
      console.error('Erro ao processar webhooks:', error);
      throw new Error('Erro ao processar webhooks: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  },

  async getTicketCreatorData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userId,
          name: userData.name,
          email: userData.email,
          role: userData.role
        };
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do criador:', error);
      return null;
    }
  }
};
