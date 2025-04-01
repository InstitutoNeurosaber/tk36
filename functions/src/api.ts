import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { ticketService } from './services/ticketService';

// Middleware para validar token de API
const validateApiKey = async (req: functions.Request): Promise<boolean> => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return false;

  try {
    const apiKeysRef = admin.firestore().collection('api_keys');
    const snapshot = await apiKeysRef.where('key', '==', apiKey).where('active', '==', true).get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Erro ao validar API key:', error);
    return false;
  }
};

// Endpoint para criar ticket
export const createTicket = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const isValidKey = await validateApiKey(req);
    if (!isValidKey) {
      res.status(401).json({ error: 'API key inválida' });
      return;
    }

    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
      res.status(400).json({ error: 'Dados inválidos' });
      return;
    }

    const ticket = await ticketService.createTicket({
      title,
      description,
      category,
      priority,
      userId: 'system'
    });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para atualizar status
export const updateTicketStatus = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'PUT') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const isValidKey = await validateApiKey(req);
    if (!isValidKey) {
      res.status(401).json({ error: 'API key inválida' });
      return;
    }

    const { ticketId } = req.params;
    const { status } = req.body;

    if (!ticketId || !status) {
      res.status(400).json({ error: 'Dados inválidos' });
      return;
    }

    await ticketService.updateTicketStatus(ticketId, status);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para atualizar prioridade
export const updateTicketPriority = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'PUT') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const isValidKey = await validateApiKey(req);
    if (!isValidKey) {
      res.status(401).json({ error: 'API key inválida' });
      return;
    }

    const { ticketId } = req.params;
    const { priority } = req.body;

    if (!ticketId || !priority) {
      res.status(400).json({ error: 'Dados inválidos' });
      return;
    }

    await ticketService.updateTicket(ticketId, { priority });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar prioridade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para adicionar comentário
export const addTicketComment = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const isValidKey = await validateApiKey(req);
    if (!isValidKey) {
      res.status(401).json({ error: 'API key inválida' });
      return;
    }

    const { ticketId } = req.params;
    const { content, userId } = req.body;

    if (!ticketId || !content || !userId) {
      res.status(400).json({ error: 'Dados inválidos' });
      return;
    }

    const comment = await ticketService.addComment(ticketId, {
      content,
      userId
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para excluir ticket
export const deleteTicket = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'DELETE') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const isValidKey = await validateApiKey(req);
    if (!isValidKey) {
      res.status(401).json({ error: 'API key inválida' });
      return;
    }

    const { ticketId } = req.params;

    if (!ticketId) {
      res.status(400).json({ error: 'ID do ticket não fornecido' });
      return;
    }

    await ticketService.deleteTicket(ticketId);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir ticket:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});