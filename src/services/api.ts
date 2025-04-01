import axios from 'axios';
import type { TicketStatus, TicketPriority } from '../types/ticket';

// Criar instância do Axios com configurações base
const api = axios.create({
  baseURL: '/.netlify/functions',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Interceptor para adicionar o header de API key em todas as requisições
api.interceptors.request.use(config => {
  const apiKey = localStorage.getItem('api_key');
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey;
  }
  
  // Adiciona _method para simular métodos HTTP via POST
  if (config.method !== 'get' && config.method !== 'post') {
    config.data = {
      ...config.data,
      _method: config.method?.toUpperCase()
    };
    config.method = 'post';
  }
  
  return config;
});

// Interceptor para transformar a resposta
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      console.error('Erro na requisição:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        config: error.config
      });
      throw new Error(error.response.data.message || 'Erro na requisição');
    }
    throw error;
  }
);

// Interface para criação de ticket
interface CreateTicketData {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
}

// Interface para atualização de status
interface UpdateStatusData {
  status: TicketStatus;
}

// Interface para atualização de prioridade
interface UpdatePriorityData {
  priority: TicketPriority;
}

// Interface para criação de comentário
interface CreateCommentData {
  content: string;
  userId: string;
}

export const ticketApi = {
  // Criar novo ticket
  async createTicket(data: CreateTicketData) {
    return api.post('/tickets', data);
  },

  // Atualizar status do ticket
  async updateStatus(ticketId: string, { status }: UpdateStatusData) {
    return api.post('/tickets/status', { ticketId, status });
  },

  // Atualizar prioridade do ticket
  async updatePriority(ticketId: string, { priority }: UpdatePriorityData) {
    return api.post('/tickets/priority', { ticketId, priority });
  },

  // Adicionar comentário ao ticket
  async addComment(ticketId: string, data: CreateCommentData) {
    return api.post('/tickets/comments', { ticketId, ...data });
  },

  // Excluir ticket
  async deleteTicket(ticketId: string) {
    return api.post('/tickets/delete', { ticketId, _method: 'DELETE' });
  }
};

// Função para configurar a API key
export const setApiKey = (apiKey: string) => {
  localStorage.setItem('api_key', apiKey);
};

// Função para remover a API key
export const removeApiKey = () => {
  localStorage.removeItem('api_key');
};

// Função para testar a API key
export const testApiKey = async (apiKey: string) => {
  try {
    return api.post('/test', null, {
      headers: {
        'X-API-Key': apiKey
      }
    });
  } catch (error) {
    throw new Error('API key inválida');
  }
};

export default api;