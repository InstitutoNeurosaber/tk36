import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { ticketApi, setApiKey } from '../services/api';

vi.mock('axios');

describe('API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('deve criar um ticket com sucesso', async () => {
    const mockResponse = {
      data: {
        id: '123',
        title: 'Teste de Ticket',
        description: 'Descrição do teste',
        category: 'software',
        priority: 'medium',
        status: 'open'
      }
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    const ticketData = {
      title: 'Teste de Ticket',
      description: 'Descrição do teste',
      category: 'software',
      priority: 'medium'
    };

    const result = await ticketApi.createTicket(ticketData);
    expect(result).toEqual(mockResponse.data);
  });

  it('deve atualizar o status de um ticket', async () => {
    const mockResponse = {
      data: {
        id: '123',
        status: 'in_progress'
      }
    };

    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    const result = await ticketApi.updateStatus('123', { status: 'in_progress' });
    expect(result).toEqual(mockResponse.data);
  });

  it('deve incluir o header X-API-Key em todas as requisições', async () => {
    const apiKey = 'test-api-key';
    setApiKey(apiKey);

    const mockResponse = { data: {} };
    vi.mocked(axios.post).mockResolvedValueOnce(mockResponse);

    await ticketApi.createTicket({
      title: 'Teste',
      description: 'Teste',
      category: 'software',
      priority: 'medium'
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-API-Key': apiKey
        })
      })
    );
  });

  it('deve lidar com erros da API corretamente', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Erro ao criar ticket'
        }
      }
    };

    vi.mocked(axios.post).mockRejectedValueOnce(mockError);

    const ticketData = {
      title: 'Teste',
      description: 'Teste',
      category: 'software',
      priority: 'medium'
    };

    await expect(ticketApi.createTicket(ticketData)).rejects.toThrow('Erro ao criar ticket');
  });
});