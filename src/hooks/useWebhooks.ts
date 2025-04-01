import { useEffect } from 'react';
import { useWebhookStore } from '../stores/webhookStore';
import { useAuthStore } from '../stores/authStore';

export function useWebhooks() {
  const { user } = useAuthStore();
  const { webhooks, loading, error, fetchWebhooks } = useWebhookStore();

  useEffect(() => {
    if (user) {
      fetchWebhooks(user.uid);
    }
  }, [user, fetchWebhooks]);

  return {
    webhooks,
    loading,
    error
  };
}