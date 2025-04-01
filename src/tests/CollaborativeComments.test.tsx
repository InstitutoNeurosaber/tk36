import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborativeComments } from '../components/CollaborativeComments';
import { useAuthStore } from '../stores/authStore';
import { YjsProvider } from '../lib/yjs';
import * as Y from 'yjs';

// Mock do useAuthStore
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn()
}));

// Mock do YjsProvider
vi.mock('../lib/yjs', () => ({
  YjsProvider: vi.fn()
}));

describe('CollaborativeComments', () => {
  const mockTicket = {
    id: 'test-ticket-123',
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'open',
    priority: 'medium',
    category: 'software',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    deadline: new Date()
  };

  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com'
  };

  const mockUserData = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };

  const mockCommentsArray = new Y.Array();
  const mockDoc = new Y.Doc();

  beforeEach(() => {
    // Mock do useAuthStore
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      userData: mockUserData
    } as any);

    // Limpar e preparar o array de comentários
    mockCommentsArray.delete(0, mockCommentsArray.length);
    mockCommentsArray.push([{
      id: 'comment-1',
      ticketId: 'test-ticket-123',
      userId: 'user-123',
      userName: 'Test User',
      content: 'Test comment 1',
      createdAt: new Date()
    }]);

    // Mock do YjsProvider
    vi.mocked(YjsProvider).mockImplementation(() => ({
      getDoc: () => mockDoc,
      getCommentsArray: () => mockCommentsArray,
      getActiveUsers: () => [{
        clientId: 1,
        user: {
          id: 'user-123',
          name: 'Test User',
          color: '#ff0000'
        }
      }],
      getAwareness: () => ({
        on: vi.fn(),
        off: vi.fn(),
        setLocalStateField: vi.fn()
      }),
      destroy: vi.fn(),
      observeComments: vi.fn(),
      addComment: vi.fn()
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza o componente corretamente', () => {
    render(<CollaborativeComments ticket={mockTicket} />);
    expect(screen.getByText('Test comment 1')).toBeInTheDocument();
  });

  it('permite enviar novo comentário', async () => {
    render(<CollaborativeComments ticket={mockTicket} />);
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    const submitButton = screen.getByRole('button', { type: 'submit' });

    fireEvent.change(input, { target: { value: 'Novo comentário' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('desabilita o botão de enviar quando o input está vazio', () => {
    render(<CollaborativeComments ticket={mockTicket} />);
    
    const submitButton = screen.getByRole('button', { type: 'submit' });
    expect(submitButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    fireEvent.change(input, { target: { value: 'Teste' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('permite enviar comentário com Enter', async () => {
    render(<CollaborativeComments ticket={mockTicket} />);
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    fireEvent.change(input, { target: { value: 'Teste com Enter' } });
    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
});