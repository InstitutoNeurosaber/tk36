import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  getDocs,
  query,
  where,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { WebhookConfig, WebhookEvent, WebhookPayload } from '../types/webhook';

interface WebhookState {
  webhooks: WebhookConfig[];
  loading: boolean;
  error: string | null;
  fetchWebhooks: (userId: string) => Promise<void>;
  createWebhook: (webhook: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWebhook: (id: string, data: Partial<WebhookConfig>) => Promise<void>;
  deleteWebhook: (id: string) => Promise<void>;
  sendWebhookNotification: (event: WebhookEvent, data: unknown) => Promise<void>;
  testWebhook: (webhookId: string, payload: WebhookPayload) => Promise<void>;
}

export const useWebhookStore = create<WebhookState>((set, get) => ({
  webhooks: [],
  loading: false,
  error: null,

  fetchWebhooks: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      const webhooksRef = collection(db, 'webhooks');
      
      const q = query(
        webhooksRef, 
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const webhooks = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        })) as WebhookConfig[];

      webhooks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      set({ webhooks, loading: false });
    } catch (error) {
      console.error('Erro ao buscar webhooks:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao buscar webhooks', loading: false });
    }
  },

  createWebhook: async (webhookData) => {
    try {
      set({ loading: true, error: null });
      const now = Timestamp.now();
      
      const webhooksRef = collection(db, 'webhooks');
      const docRef = await addDoc(webhooksRef, {
        ...webhookData,
        createdAt: now,
        updatedAt: now
      });

      const newWebhook: WebhookConfig = {
        id: docRef.id,
        ...webhookData,
        createdAt: now.toDate(),
        updatedAt: now.toDate()
      };

      set(state => ({
        webhooks: [newWebhook, ...state.webhooks],
        loading: false
      }));
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao criar webhook', loading: false });
      throw error;
    }
  },

  updateWebhook: async (id: string, data: Partial<WebhookConfig>) => {
    try {
      set({ loading: true, error: null });
      const webhookRef = doc(db, 'webhooks', id);
      
      await updateDoc(webhookRef, {
        ...data,
        updatedAt: Timestamp.now()
      });

      set(state => ({
        webhooks: state.webhooks.map(webhook =>
          webhook.id === id
            ? { ...webhook, ...data, updatedAt: new Date() }
            : webhook
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao atualizar webhook', loading: false });
      throw error;
    }
  },

  deleteWebhook: async (id: string) => {
    try {
      set({ loading: true, error: null });
      await deleteDoc(doc(db, 'webhooks', id));
      
      set(state => ({
        webhooks: state.webhooks.filter(webhook => webhook.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Erro ao deletar webhook:', error);
      set({ error: error instanceof Error ? error.message : 'Erro ao deletar webhook', loading: false });
      throw error;
    }
  },

  testWebhook: async (webhookId: string, payload: WebhookPayload) => {
    try {
      const webhook = get().webhooks.find(w => w.id === webhookId);
      if (!webhook) {
        throw new Error('Webhook não encontrado');
      }

      const url = webhook.testUrl || webhook.url;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhook.headers || {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      throw error;
    }
  },

  sendWebhookNotification: async (event: WebhookEvent, data: unknown) => {
    const { webhooks } = get();
    const activeWebhooks = webhooks.filter(webhook => 
      webhook.active && webhook.events.includes(event)
    );

    if (activeWebhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      event,
      data,
      timestamp: new Date().toISOString()
    };

    const results = await Promise.allSettled(
      activeWebhooks.map(async webhook => {
        try {
          const url = (data as any).isTest && webhook.testUrl ? webhook.testUrl : webhook.url;

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(webhook.headers || {})
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
          }

          return {
            webhookId: webhook.id,
            success: true
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to send webhook to ${webhook.url}: ${errorMessage}`);
        }
      })
    );

    const errors = results
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason.message);

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }
  }
}));