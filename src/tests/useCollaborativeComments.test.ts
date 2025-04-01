import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollaborativeComments } from '../hooks/useCollaborativeComments';
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

describe('useCollaborativeComments', () => {
  const mockTicketId = 'test-ticket-123';
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

  beforeEach(() => {
    // Mock do useAuthStore
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      userData: mockUserData
    } as any);

    // Mock do YjsProvider
    const mockYDoc = new Y.Doc();
    const mockCommentsArray = mockYDoc.getArray('comments');
    const mockProvider = {
      getDoc: () => mockYDoc,
      getCommentsArray: () => mockCommentsArray,
      getActiveUsers: () => [],
      getAwareness: () => ({
        on: vi.fn(),
        off: vi.fn(),
        setLocalStateField: vi.fn()
      }),
      destroy: vi.fn(),
      observeComments: vi.fn(),
      addComment: vi.fn()
    };

    vi.mocked(YjsProvider).mockImplementation(() => mockProvider as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa corretamente', () => {
    const { result } = renderHook(() => useCollaborativeComments(mockTicketId));

    expect(result.current.comments).toEqual([]);
    expect(result.current.activeUsers).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.addComment).toBe('function');
  });

  it('adiciona comentário corretamente', async () => {
    const { result } = renderHook(() => useCollaborativeComments(mockTicketId));

    await act(async () => {
      await result.current.addComment('Teste de comentário');
    });

    expect(result.current.comments).toHaveLength(1);
    expect(result.current.comments[0]).toMatchObject({
      ticketId: mockTicketId,
      userId: mockUser.uid,
      userName: mockUserData.name,
      content: 'Teste de comentário'
    });
  });

  it('atualiza lista de usuários ativos', () => {
    const mockActiveUsers = [
      {
        clientId: 1,
        user: {
          id: 'user-123',
          name: 'Test User',
          color: '#ff0000'
        }
      }
    ];

    vi.mocked(YjsProvider).mockImplementation(() => ({
      getDoc: () => new Y.Doc(),
      getCommentsArray: () => new Y.Array(),
      getActiveUsers: () => mockActiveUsers,
      getAwareness: () => ({
        on: (event: string, callback: () => void) => {
          if (event === 'change') callback();
        },
        off: vi.fn(),
        setLocalStateField: vi.fn()
      }),
      destroy: vi.fn(),
      observeComments: vi.fn(),
      addComment: vi.fn()
    } as any));

    const { result } = renderHook(() => useCollaborativeComments(mockTicketId));

    expect(result.current.activeUsers).toEqual(mockActiveUsers);
  });

  it('lida com erros corretamente', () => {
    const mockError = new Error('Teste de erro');
    vi.mocked(YjsProvider).mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useCollaborativeComments(mockTicketId));

    expect(result.current.error).toBe(mockError.message);
  });

  it('limpa recursos ao desmontar', () => {
    const mockDestroy = vi.fn();
    const mockUnobserve = vi.fn();
    const mockOff = vi.fn();

    vi.mocked(YjsProvider).mockImplementation(() => ({
      getDoc: () => new Y.Doc(),
      getCommentsArray: () => ({
        toArray: () => [],
        observe: () => mockUnobserve,
        unobserve: mockUnobserve
      }),
      getActiveUsers: () => [],
      getAwareness: () => ({
        on: vi.fn(),
        off: mockOff,
        setLocalStateField: vi.fn()
      }),
      destroy: mockDestroy,
      observeComments: vi.fn(),
      addComment: vi.fn()
    } as any));

    const { unmount } = renderHook(() => useCollaborativeComments(mockTicketId));

    unmount();

    expect(mockDestroy).toHaveBeenCalled();
    expect(mockUnobserve).toHaveBeenCalled();
    expect(mockOff).toHaveBeenCalled();
  });
});