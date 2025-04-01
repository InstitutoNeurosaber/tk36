import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emailService } from '../services/emailService';
import { functions } from '../lib/firebase';

vi.mock('../lib/firebase', () => ({
  functions: {
    httpsCallable: vi.fn()
  }
}));

describe('Email Notification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('deve enviar email quando um ticket é criado', async () => {
    const mockCallable = vi.fn().mockResolvedValue({ data: { success: true } });
    vi.mocked(functions.httpsCallable).mockReturnValue(mockCallable);

    const testEmail = 'test@example.com';
    const testTicket = {
      id: '123',
      title: 'Teste de Ticket',
      description: 'Descrição do teste',
      status: 'open',
      priority: 'high',
      category: 'software'
    };

    const result = await emailService.sendTicketNotification(testEmail, testTicket);
    expect(result).toEqual({ success: true });
  });

  it('deve tratar erros do Firebase Functions corretamente', async () => {
    const mockError = new Error('Invalid email address');
    mockError.name = 'functions/invalid-argument';
    
    const mockCallable = vi.fn().mockRejectedValue(mockError);
    vi.mocked(functions.httpsCallable).mockReturnValue(mockCallable);

    const testEmail = 'invalid-email';
    const testTicket = {
      id: '123',
      title: 'Teste de Ticket',
      status: 'resolved'
    };

    await expect(emailService.sendStatusUpdateNotification(testEmail, testTicket))
      .rejects.toThrow(`Erro do Firebase (functions/invalid-argument): Invalid email address`);
  });
});