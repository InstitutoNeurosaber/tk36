import { Handler } from '@netlify/functions';
import { ticketService } from '../../src/services/ticketService';

const validateApiKey = async (apiKey: string | undefined): Promise<boolean> => {
  if (!apiKey) return false;
  // Implementar validação da API key aqui
  return true;
};

export const handler: Handler = async (event, context) => {
  // Verificar API key
  const apiKey = event.headers['x-api-key'];
  if (!await validateApiKey(apiKey)) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'API key inválida ou não fornecida' })
    };
  }

  try {
    switch (event.path) {
      case '/.netlify/functions/tickets': {
        if (event.httpMethod === 'POST') {
          const data = JSON.parse(event.body || '{}');
          const ticket = await ticketService.createTicket(data);
          return {
            statusCode: 201,
            body: JSON.stringify(ticket)
          };
        }
        break;
      }

      case '/.netlify/functions/tickets/status': {
        if (event.httpMethod === 'POST') {
          const { ticketId, status } = JSON.parse(event.body || '{}');
          await ticketService.updateTicketStatus(ticketId, status);
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        }
        break;
      }

      case '/.netlify/functions/tickets/delete': {
        if (event.httpMethod === 'POST') {
          const { ticketId } = JSON.parse(event.body || '{}');
          await ticketService.deleteTicket(ticketId);
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
          };
        }
        break;
      }
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Rota não encontrada' })
    };

  } catch (error) {
    console.error('Erro na função Netlify:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      })
    };
  }
};