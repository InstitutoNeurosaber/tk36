import type { Ticket } from '../types/ticket';

const CLICKUP_API_BASE = 'https://api.clickup.com/api/v2';

export class ClickUpAPI {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${CLICKUP_API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 401) {
          throw new Error('API Key inválida ou expirada');
        }
        if (response.status === 403) {
          throw new Error('Team not authorized');
        }
        throw new Error(error.err || `Erro ${response.status}: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro desconhecido na requisição ao ClickUp');
    }
  }

  async getWorkspaces() {
    return this.request<{ teams: { id: string; name: string }[] }>('/team');
  }

  async getSpaces(workspaceId: string) {
    return this.request<{ spaces: { id: string; name: string }[] }>(`/team/${workspaceId}/space`);
  }

  async getLists(spaceId: string) {
    return this.request<{ lists: { id: string; name: string }[] }>(`/space/${spaceId}/list`);
  }

  async createTask(listId: string, ticket: Ticket) {
    const priorityMap = {
      low: 3,
      medium: 2,
      high: 1,
      critical: 4
    };

    return this.request(`/list/${listId}/task`, {
      method: 'POST',
      body: JSON.stringify({
        name: ticket.title,
        description: ticket.description,
        priority: priorityMap[ticket.priority],
        due_date: ticket.deadline.getTime(),
        status: 'to do'
      })
    });
  }

  async updateTaskStatus(listId: string, taskId: string, status: string) {
    return this.request(`/list/${listId}/task/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({
        status
      })
    });
  }

  async deleteTask(listId: string, taskId: string) {
    return this.request(`/list/${listId}/task/${taskId}`, {
      method: 'DELETE'
    });
  }
}