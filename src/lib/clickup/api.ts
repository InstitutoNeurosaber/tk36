import { ClickUpConfig, ClickUpUser, ClickUpSpace, ClickUpList, ClickUpTask } from '../../types/clickup';
import type { Comment } from '../../types/ticket';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export class ClickUpAPI {
  private apiKey: string;
  private controller: AbortController;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.controller = new AbortController();
  }

  public abort() {
    this.controller.abort();
    this.controller = new AbortController();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${CLICKUP_API_BASE}${endpoint}`, {
        ...options,
        signal: this.controller.signal,
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('API Key inválida. Verifique suas credenciais.');
        }
        if (response.status === 404) {
          throw new Error('Recurso não encontrado. Verifique os IDs fornecidos.');
        }
        if (response.status === 429) {
          throw new Error('Limite de requisições excedido. Aguarde um momento e tente novamente.');
        }
        const errorData = await response.json().catch(() => ({ err: 'Erro desconhecido' }));
        throw new Error(errorData.err || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Requisição cancelada');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Não foi possível conectar à API do ClickUp. Verifique sua conexão e a API Key.');
        }
        throw error;
      }
      throw new Error('Erro desconhecido ao acessar a API do ClickUp');
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.getWorkspaces();
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('API Key inválida')) {
        return false;
      }
      throw error;
    }
  }

  async getWorkspaces(): Promise<{ teams: { id: string; name: string }[] }> {
    return this.request<{ teams: { id: string; name: string }[] }>('/team');
  }

  async getSpaces(workspaceId: string): Promise<{ spaces: ClickUpSpace[] }> {
    return this.request<{ spaces: ClickUpSpace[] }>(`/team/${workspaceId}/space`);
  }

  async getLists(spaceId: string): Promise<{ lists: ClickUpList[] }> {
    return this.request<{ lists: ClickUpList[] }>(`/space/${spaceId}/list`);
  }

  async getUsers(workspaceId: string): Promise<{ users: ClickUpUser[] }> {
    return this.request<{ users: ClickUpUser[] }>(`/team/${workspaceId}/user`);
  }

  async createTask(listId: string, task: Partial<ClickUpTask>): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/list/${listId}/task`, {
      method: 'POST',
      body: JSON.stringify(task)
    });
  }

  async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await this.request(`/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.request(`/task/${taskId}`, {
      method: 'DELETE'
    });
  }

  async addComment(taskId: string, comment: Comment): Promise<void> {
    await this.request(`/task/${taskId}/comment`, {
      method: 'POST',
      body: JSON.stringify({
        comment_text: comment.content,
        assignee: comment.userId,
        notify_all: true
      })
    });
  }

  async getComments(taskId: string): Promise<Comment[]> {
    const response = await this.request<{ comments: any[] }>(`/task/${taskId}/comment`);
    return response.comments.map(comment => ({
      id: comment.id,
      content: comment.comment_text,
      userId: comment.user.id,
      createdAt: new Date(comment.date),
      ticketId: taskId
    }));
  }

  async taskExists(taskId: string): Promise<boolean> {
    try {
      await this.request(`/task/${taskId}`);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Recurso não encontrado')) {
        return false;
      }
      throw error;
    }
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`);
  }
}