import { functions } from '../lib/firebase';

export const emailService = {
  async sendTicketNotification(email: string, ticket: unknown) {
    try {
      const sendEmail = functions.httpsCallable('sendTicketNotification');
      const result = await sendEmail({ to: email, ticket });
      
      if (!result.data.success) {
        throw new Error('Falha no envio da notificação');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro do Firebase (${error.name}): ${error.message}`);
      }
      throw error;
    }
  },

  async sendStatusUpdateNotification(email: string, ticket: unknown) {
    try {
      const sendEmail = functions.httpsCallable('sendStatusUpdateNotification');
      const result = await sendEmail({ to: email, ticket });
      
      if (!result.data.success) {
        throw new Error('Falha no envio da notificação de atualização');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro do Firebase (${error.name}): ${error.message}`);
      }
      throw error;
    }
  }
};