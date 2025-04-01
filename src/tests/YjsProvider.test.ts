import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { YjsProvider } from '../lib/yjs';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';

// Mock das dependências
vi.mock('y-webrtc', () => ({
  WebrtcProvider: vi.fn()
}));

vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: vi.fn()
}));

describe('YjsProvider', () => {
  const mockRoomId = 'test-room';
  const mockUserId = 'test-user';
  const mockUserName = 'Test User';

  beforeEach(() => {
    // Mock do WebrtcProvider
    vi.mocked(WebrtcProvider).mockImplementation(() => ({
      awareness: {
        setLocalStateField: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getStates: vi.fn().mockReturnValue(new Map())
      },
      on: vi.fn(),
      destroy: vi.fn()
    }) as any);

    // Mock do IndexeddbPersistence
    vi.mocked(IndexeddbPersistence).mockImplementation(() => ({
      destroy: vi.fn()
    }) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('inicializa corretamente', () => {
    const provider = new YjsProvider(mockRoomId, mockUserId, mockUserName);

    expect(provider).toBeDefined();
    expect(WebrtcProvider).toHaveBeenCalled();
    expect(IndexeddbPersistence).toHaveBeenCalled();
  });

  it('configura informações do usuário', () => {
    const provider = new YjsProvider(mockRoomId, mockUserId, mockUserName);
    const awareness = provider.getAwareness();

    expect(awareness.setLocalStateField).toHaveBeenCalledWith('user', {
      name: mockUserName,
      id: mockUserId,
      expect.any(String) // Cor aleatória
    });
  });

  it('gerencia comentários corretamente', () => {
    const provider = new YjsProvider(mockRoomId, mockUserId, mockUserName);
    const commentsArray = provider.getCommentsArray();

    const mockComment = {
      id: 'test-comment',
      content: 'Test content'
    };

    provider.addComment(mockComment);
    expect(commentsArray.toArray()).toContainEqual(mockComment);
  });

  it('observa mudanças nos comentários', () => {
    const provider = new YjsProvider(mockRoomId, mockUserId, mockUserName);
    const mockCallback = vi.fn();

    provider.observeComments(mockCallback);
    provider.addComment({ id: 'test', content: 'test' });

    expect(mockCallback).toHaveBeenCalled();
  });

  it('retorna usuários ativos', () => {
    const mockStates = new Map([
      [1, { user: { id: 'user1', name: 'User 1', color: '#ff0000' } }],
      [2, { user: { id: 'user2', name: 'User 2', color: '#00ff00' } }]
    ]);

    vi.mocked(WebrtcProvider).mockImplementation(() => ({
      awareness: {
        setLocalStateField: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getStates: vi.fn().mockReturnValue(mockStates)
      },
      on: vi.fn(),
      destroy: vi.fn()
    }) as any);

    const provider = new YjsProvider(mockRoomId, mockUserId, mockUserName);
    const activeUsers = provider.getActiveUsers();

    expect(activeUsers).toHaveLength(2);
    expect(activeUsers[0].user).toEqual({ id: 'user1', name: 'User 1', color: '#ff0000' });
    expect(activeUsers[1].user).toEqual({ id: 'user2', name: 'User 2', color: '#00ff00' });
  });

  it('limpa recursos ao destruir', () => {
    const provider = new YjsProvider(mockRoomId, mockUserId, mockUserName);
    provider.destroy();

    expect(provider['provider'].destroy).toHaveBeenCalled();
    expect(provider['persistence'].destroy).toHaveBeenCalled();
  });
});