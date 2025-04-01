import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ClickUpAPI } from '../lib/clickup';
import type { Ticket, Comment } from '../types/ticket';
import type { ClickUpConfig } from '../types/clickup';

export class ClickUpService {
  private async getConfig(): Promise<ClickUpConfig | null> {
    try {
      const configsRef = collection(db, 'clickup_configs');
      const q = query(configsRef, where('active', '==', true));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const configDoc = snapshot.docs[0];
        return {
          id: configDoc.id,
          ...configDoc.data(),
          createdAt: configDoc.data().createdAt.toDate(),
          updatedAt: configDoc.data().updatedAt.toDate()
        } as ClickUpConfig;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar configuração do ClickUp:', error);
      return null;
    }
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config || !config.active || !config.apiKey) {
        return false;
      }

      // Testa a conexão com o ClickUp
      const api = new ClickUpAPI(config.apiKey);
      await api.getWorkspaces();
      return true;
    } catch (error) {
      console.error('Erro ao verificar configuração do ClickUp:', error);
      return false;
    }
  }

  private async getAPI(): Promise<ClickUpAPI> {
    const config = await this.getConfig();
    if (!config || !config.active || !config.apiKey) {
      throw new Error('Configuração do ClickUp não encontrada ou inativa');
    }
    return new ClickUpAPI(config.apiKey);
  }

  async createTaskFromTicket(ticket: Ticket): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Configuração do ClickUp não encontrada');
      }

      const api = await this.getAPI();

      // Verifica se já existe uma tarefa com esse ID
      const taskExists = await api.taskExists(ticket.id);
      if (taskExists) {
        throw new Error('Já existe uma tarefa no ClickUp com este ID');
      }

      await api.createTask(config.listId, {
        name: ticket.title,
        description: ticket.description,
        status: this.mapStatus(ticket.status),
        priority: this.getPriorityLevel(ticket.priority),
        due_date: ticket.deadline.getTime()
      });
    } catch (error) {
      console.error('Erro ao criar tarefa no ClickUp:', error);
      throw new Error('Erro ao criar tarefa no ClickUp: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

  async updateTaskStatus(ticket: Ticket): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Configuração do ClickUp não encontrada');
      }

      const api = await this.getAPI();

      // Verifica se a tarefa existe antes de tentar atualizar
      const taskExists = await api.taskExists(ticket.id);
      if (!taskExists) {
        throw new Error('Tarefa não encontrada no ClickUp');
      }

      await api.updateTaskStatus(ticket.id, this.mapStatus(ticket.status));
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa no ClickUp:', error);
      throw new Error('Erro ao atualizar status da tarefa no ClickUp: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

  async deleteTask(ticket: Ticket): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Configuração do ClickUp não encontrada');
      }

      const api = await this.getAPI();

      // Verifica se a tarefa existe antes de tentar deletar
      const taskExists = await api.taskExists(ticket.id);
      if (!taskExists) {
        // Se a tarefa não existe, consideramos como sucesso
        return;
      }

      await api.deleteTask(ticket.id);
    } catch (error) {
      if (error instanceof Error && error.message.includes('API Key inválida')) {
        throw new Error('API Key do ClickUp inválida ou expirada. Por favor, verifique suas configurações.');
      }
      console.error('Erro ao deletar tarefa no ClickUp:', error);
      throw new Error('Erro ao deletar tarefa no ClickUp: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

  async addComment(ticketId: string, comment: Comment): Promise<void> {
    try {
      const config = await this.getConfig();
      if (!config) {
        throw new Error('Configuração do ClickUp não encontrada');
      }

      const api = await this.getAPI();

      // Verifica se a tarefa existe antes de tentar adicionar comentário
      const taskExists = await api.taskExists(ticketId);
      if (!taskExists) {
        throw new Error('Tarefa não encontrada no ClickUp');
      }

      await api.addComment(ticketId, comment);
    } catch (error) {
      console.error('Erro ao adicionar comentário no ClickUp:', error);
      throw new Error('Erro ao adicionar comentário no ClickUp: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  }

  private getPriorityLevel(priority: Ticket['priority']): number {
    const priorityMap = {
      low: 3,
      medium: 2,
      high: 1,
      critical: 4
    };
    return priorityMap[priority];
  }

  private mapStatus(status: Ticket['status']): string {
    const statusMap = {
      open: 'to do',
      in_progress: 'in progress',
      resolved: 'complete',
      closed: 'closed'
    };
    return statusMap[status];
  }
}