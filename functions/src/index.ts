import * as admin from 'firebase-admin';
import * as api from './api';
import * as webhooks from './webhooks';

admin.initializeApp();

// Exportar endpoints da API
export const clickupEvent = api.handleClickUpEvent;
export const ticketStatus = api.updateTicketStatus;
export const ticketPriority = api.updateTicketPriority;
export const ticketComment = api.addTicketComment;
export const ticketDelete = api.deleteTicket;

// Exportar funções de webhook
export const processWebhookQueue = webhooks.processWebhookQueue;
export const cleanupWebhookQueue = webhooks.cleanupWebhookQueue;