import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Configurar axios com retry
const axiosInstance = axios.create({
  timeout: 30000
});

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => {
    return retryCount * 1000;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.code === 'ECONNABORTED' ||
           (error.response?.status && error.response.status >= 500);
  }
});

// Inicializar admin se ainda não foi feito
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Processar webhooks da fila a cada 1 minuto
export const processWebhookQueue = functions.scheduler
  .onSchedule('every 1 minutes', {
    timeoutSeconds: 540,
    memory: '256MB'
  })
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Buscar webhooks pendentes
      const queueRef = db.collection('webhook_queue');
      const pendingWebhooks = await queueRef
        .where('status', '==', 'pending')
        .where('nextAttempt', '<=', now)
        .where('attempts', '<', 3)
        .limit(10)
        .get();

      if (pendingWebhooks.empty) {
        console.log('Nenhum webhook pendente para processar');
        return null;
      }

      const batch = db.batch();
      const processPromises = [];

      pendingWebhooks.forEach(doc => {
        const webhook = doc.data();
        
        const processPromise = axiosInstance({
          method: 'POST',
          url: webhook.webhook.url,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...webhook.webhook.headers
          },
          data: webhook.data
        })
        .then(() => {
          batch.update(doc.ref, {
            status: 'completed',
            completedAt: now,
            error: null
          });
          console.log(`Webhook ${doc.id} processado com sucesso`);
        })
        .catch(error => {
          const nextAttempt = new Date();
          nextAttempt.setMinutes(nextAttempt.getMinutes() + (webhook.attempts + 1) * 5);

          batch.update(doc.ref, {
            status: webhook.attempts >= 2 ? 'failed' : 'pending',
            attempts: webhook.attempts + 1,
            nextAttempt: admin.firestore.Timestamp.fromDate(nextAttempt),
            error: {
              message: error.message,
              code: error.code,
              response: error.response?.data
            }
          });
          console.error(`Erro ao processar webhook ${doc.id}:`, error);
        });

        processPromises.push(processPromise);
      });

      await Promise.all(processPromises);
      await batch.commit();

      console.log(`Processados ${pendingWebhooks.size} webhooks`);
      return null;

    } catch (error) {
      console.error('Erro ao processar fila de webhooks:', error);
      return null;
    }
  });

// Limpar webhooks antigos completados/falhados
export const cleanupWebhookQueue = functions.scheduler
  .onSchedule('every 24 hours', {
    timeoutSeconds: 540,
    memory: '256MB'
  })
  .onRun(async (context) => {
    const cutoff = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    try {
      const queueRef = db.collection('webhook_queue');
      const oldWebhooks = await queueRef
        .where('status', 'in', ['completed', 'failed'])
        .where('createdAt', '<=', cutoff)
        .limit(100)
        .get();

      if (oldWebhooks.empty) {
        return null;
      }

      const batch = db.batch();
      oldWebhooks.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Removidos ${oldWebhooks.size} webhooks antigos`);
      return null;

    } catch (error) {
      console.error('Erro ao limpar fila de webhooks:', error);
      return null;
    }
  });