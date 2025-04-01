import * as admin from 'firebase-admin';
import { clickupStatusReverseMap, clickupPriorityReverseMap } from '../types/ticket';

export const ticketService = {
  async handleClickUpEvent(payload: any): Promise<void> {
    try {
      const { event_type, task_id, history_items } = payload;

      // Buscar ticket pelo taskId
      const ticketsRef = admin.firestore().collection('tickets');
      const snapshot = await ticketsRef.where('taskId', '==', task_id).get();

      if (snapshot.empty) {
        console.log('Nenhum ticket encontrado para a tarefa:', task_id);
        return;
      }

      const ticketDoc = snapshot.docs[0];
      const ticketRef = ticketDoc.ref;

      switch (event_type) {
        case 'taskStatusUpdated': {
          const newStatus = history_items[0]?.after?.status;
          if (newStatus && clickupStatusReverseMap[newStatus]) {
            await ticketRef.update({
              status: clickupStatusReverseMap[newStatus],
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
          break;
        }

        case 'taskDeleted': {
          await ticketRef.delete();
          break;
        }

        case 'taskUpdated': {
          const updates: any = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          history_items.forEach((item: any) => {
            if (item.field === 'name') {
              updates.title = item.after;
            }
            if (item.field === 'description') {
              updates.description = item.after;
            }
            if (item.field === 'priority') {
              const priorityValue = parseInt(item.after.priority);
              if (clickupPriorityReverseMap[priorityValue]) {
                updates.priority = clickupPriorityReverseMap[priorityValue];
              }
            }
            if (item.field === 'due_date') {
              updates.deadline = admin.firestore.Timestamp.fromMillis(parseInt(item.after));
            }
          });

          if (Object.keys(updates).length > 1) { // > 1 porque sempre terá updatedAt
            await ticketRef.update(updates);
          }
          break;
        }

        case 'taskCommentPosted': {
          const comment = history_items[0]?.comment;
          if (comment) {
            await ticketRef.update({
              comments: admin.firestore.FieldValue.arrayUnion({
                id: comment.id,
                content: comment.text_content,
                userId: comment.user.id,
                userName: comment.user.username,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
              }),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
          break;
        }

        case 'taskAssigned': {
          const assignee = history_items[0]?.after?.assignees?.[0];
          if (assignee) {
            await ticketRef.update({
              assignedToId: assignee.id,
              assignedToName: assignee.username,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error('Erro ao processar evento do ClickUp:', error);
      throw error;
    }
  },

  async updateTicketStatus(ticketId: string, status: string): Promise<void> {
    const ticketRef = admin.firestore().collection('tickets').doc(ticketId);
    await ticketRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  async updateTicket(ticketId: string, data: any): Promise<void> {
    const ticketRef = admin.firestore().collection('tickets').doc(ticketId);
    await ticketRef.update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  async addComment(ticketId: string, comment: any): Promise<void> {
    const ticketRef = admin.firestore().collection('tickets').doc(ticketId);
    await ticketRef.update({
      comments: admin.firestore.FieldValue.arrayUnion({
        id: admin.firestore.Timestamp.now().toMillis().toString(),
        ...comment,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  async deleteTicket(ticketId: string): Promise<void> {
    const ticketRef = admin.firestore().collection('tickets').doc(ticketId);
    await ticketRef.delete();
  }
};