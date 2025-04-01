import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import type { Comment } from '../types/ticket';

export class YjsProvider {
  private doc: Y.Doc;
  private provider: WebrtcProvider;
  private persistence: IndexeddbPersistence;
  private awareness: Awareness;
  private commentsArray: Y.Array<Comment>;
  private roomId: string;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private retryCount = 0;
  private retryDelay = 2000;

  constructor(roomId: string, userId: string, userName: string) {
    this.roomId = roomId;
    this.doc = new Y.Doc();
    
    // Inicializar array de comentários
    this.commentsArray = this.doc.getArray('comments');
    
    // Configurar persistência local
    this.persistence = new IndexeddbPersistence(roomId, this.doc);
    
    // Configurar sincronização em tempo real
    this.provider = new WebrtcProvider(roomId, this.doc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      password: null,
      awareness: new Awareness(this.doc),
      maxConns: 20,
      filterBcConns: true,
      peerOpts: {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' },
            { 
              urls: 'turn:numb.viagenie.ca',
              username: 'webrtc@live.com',
              credential: 'muazkh'
            }
          ]
        },
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require',
        iceCandidatePoolSize: 10
      }
    });

    this.awareness = this.provider.awareness;

    // Configurar informações do usuário
    this.awareness.setLocalStateField('user', {
      name: userName,
      id: userId,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    });

    // Monitorar conexões
    this.provider.on('status', ({ status }: { status: string }) => {
      console.log(`[YJS] Connection status (${roomId}):`, status);
      
      if (status === 'connected') {
        this.retryCount = 0;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
      } else if (status === 'disconnected') {
        this.tryReconnect();
      }
    });

    // Iniciar conexão
    this.connect();

    // Debug: Monitorar mudanças no array de comentários
    this.commentsArray.observe(() => {
      console.log(`[YJS] Comments updated (${roomId}):`, this.commentsArray.toArray());
    });
  }

  private connect() {
    console.log(`[YJS] Initiating connection (${this.roomId})...`);
    try {
      this.provider.connect();
      
      // Definir timeout para verificar se a conexão foi estabelecida
      this.connectionTimeout = setTimeout(() => {
        if (!this.provider.connected) {
          console.log(`[YJS] Connection timeout (${this.roomId}), attempting reconnect...`);
          this.tryReconnect();
        }
      }, 5000);
    } catch (error) {
      console.error(`[YJS] Connection error (${this.roomId}):`, error);
      this.tryReconnect();
    }
  }

  private tryReconnect() {
    if (this.retryCount >= this.maxRetries) {
      console.log(`[YJS] Max retries reached (${this.roomId})`);
      return;
    }

    this.retryCount++;
    const delay = this.retryDelay * Math.pow(2, this.retryCount - 1);
    
    console.log(`[YJS] Attempting reconnect ${this.retryCount}/${this.maxRetries} in ${delay}ms (${this.roomId})`);
    
    setTimeout(() => {
      if (!this.provider.connected) {
        this.connect();
      }
    }, delay);
  }

  public getDoc() {
    return this.doc;
  }

  public getAwareness() {
    return this.awareness;
  }

  public destroy() {
    console.log(`[YJS] Destroying provider (${this.roomId})...`);
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }
    this.provider.disconnect();
    this.provider.destroy();
    this.persistence.destroy();
    this.doc.destroy();
  }

  public getCommentsArray() {
    return this.commentsArray;
  }

  public observeComments(callback: (event: Y.YArrayEvent<any>) => void) {
    console.log(`[YJS] Adding comments observer (${this.roomId})`);
    this.commentsArray.observe(callback);
    return () => {
      console.log(`[YJS] Removing comments observer (${this.roomId})`);
      this.commentsArray.unobserve(callback);
    };
  }

  public addComment(comment: Comment) {
    if (!this.provider.connected) {
      throw new Error('Não é possível adicionar comentário sem conexão');
    }

    console.log(`[YJS] Adding comment (${this.roomId}):`, comment);
    try {
      this.commentsArray.push([comment]);
      console.log(`[YJS] Comment added successfully (${this.roomId})`);
      return true;
    } catch (error) {
      console.error(`[YJS] Error adding comment (${this.roomId}):`, error);
      throw error;
    }
  }

  public getActiveUsers() {
    const states = this.awareness.getStates();
    return Array.from(states.entries())
      .map(([clientId, state]) => ({
        clientId,
        user: state.user
      }))
      .filter(({ user }) => user);
  }

  public isConnected() {
    return this.provider.connected;
  }

  public reconnect() {
    console.log(`[YJS] Manual reconnect requested (${this.roomId})`);
    this.retryCount = 0;
    this.connect();
  }
}