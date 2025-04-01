import type { Ticket, TicketStatus, TicketPriority } from '../types/ticket';

// Interfaces para payloads do n8n
interface N8nWebhookPayload {
  body: any;
  headers: Record<string, string>;
  query: Record<string, string>;
}

interface N8nTicketData {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  status?: TicketStatus;
  assignedToId?: string;
  deadline?: string;
}

export const n8nService = {
  // Validar payload do webhook do n8n
  validateWebhookPayload(payload: N8nWebhookPayload): boolean {
    const { headers } = payload;
    // Verificar header de autenticação do n8n
    return headers['x-n8n-signature'] !== undefined;
  },

  // Converter payload do n8n para formato do ticket
  parseTicketData(payload: N8nWebhookPayload): N8nTicketData {
    const { body } = payload;
    
    return {
      title: body.title,
      description: body.description || '',
      category: body.category || 'other',
      priority: body.priority || 'medium',
      status: body.status,
      assignedToId: body.assignedToId,
      deadline: body.deadline
    };
  },

  // Gerar payload para webhook do n8n
  generateWebhookPayload(ticket: Ticket, event: string): any {
    return {
      event,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        deadline: ticket.deadline?.toISOString(),
        assignedToId: ticket.assignedToId,
        assignedToName: ticket.assignedToName
      },
      timestamp: new Date().toISOString()
    };
  },

  // Exemplos de workflows do n8n
  getWorkflowExamples(): Record<string, string> {
    return {
      createTicket: `
[
  {
    "name": "Criar Ticket via API",
    "nodes": [
      {
        "type": "n8n-nodes-base.webhook",
        "position": [100, 100],
        "parameters": {
          "path": "create-ticket",
          "responseMode": "responseNode"
        }
      },
      {
        "type": "n8n-nodes-base.httpRequest",
        "position": [300, 100],
        "parameters": {
          "url": "${window.location.origin}/api/tickets",
          "method": "POST",
          "headers": {
            "X-API-Key": "=={{$node.webhook.parameter.headers['x-api-key']}}"
          },
          "body": {
            "title": "=={{$node.webhook.parameter.body.title}}",
            "description": "=={{$node.webhook.parameter.body.description}}",
            "category": "=={{$node.webhook.parameter.body.category}}",
            "priority": "=={{$node.webhook.parameter.body.priority}}"
          }
        }
      }
    ]
  }
]`,
      updateStatus: `
[
  {
    "name": "Atualizar Status do Ticket",
    "nodes": [
      {
        "type": "n8n-nodes-base.webhook",
        "position": [100, 100],
        "parameters": {
          "path": "update-status",
          "responseMode": "responseNode"
        }
      },
      {
        "type": "n8n-nodes-base.httpRequest",
        "position": [300, 100],
        "parameters": {
          "url": "${window.location.origin}/api/tickets/=={{$node.webhook.parameter.body.ticketId}}/status",
          "method": "POST",
          "headers": {
            "X-API-Key": "=={{$node.webhook.parameter.headers['x-api-key']}}"
          },
          "body": {
            "status": "=={{$node.webhook.parameter.body.status}}"
          }
        }
      }
    ]
  }
]`
    };
  }
};