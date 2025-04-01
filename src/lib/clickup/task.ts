import { ClickUpAPI } from './api';
import type { Ticket } from '../../types/ticket';

export class ClickUpTaskManager {
  private api: ClickUpAPI;

  constructor(apiKey: string) {
    this.api = new ClickUpAPI(apiKey);
  }

  async createTaskFromTicket(listId: string, ticket: Ticket) {
    const priorityMap = {
      low: 3,
      medium: 2,
      high: 1,
      critical: 4
    };

    return this.api.createTask(listId, {
      name: ticket.title,
      description: this.formatDescription(ticket),
      priority: priorityMap[ticket.priority],
      due_date: ticket.deadline.getTime(),
      status: 'to do'
    });
  }

  private formatDescription(ticket: Ticket): string {
    return `
# Ticket #${ticket.id}

${ticket.description}

## Detalhes
- **Prioridade**: ${ticket.priority}
- **Categoria**: ${ticket.category}
- **Status**: ${ticket.status}
- **Criado em**: ${ticket.createdAt.toLocaleString('pt-BR')}
- **Prazo**: ${ticket.deadline.toLocaleString('pt-BR')}

[Ver ticket no sistema](${window.location.origin}/tickets/${ticket.id})
    `.trim();
  }
}