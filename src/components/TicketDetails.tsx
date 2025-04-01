import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, Link, Save, Edit2, AlertTriangle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTicketStore } from '../stores/ticketStore';
import { useAuthStore } from '../stores/authStore';
import type { Ticket, TicketStatus, TicketPriority } from '../types/ticket';
import { statusLabels, priorityLabels, categoryLabels, statusColors, priorityColors } from '../types/ticket';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => void;
  onUpdate: (ticket: Ticket) => void;
}

export function TicketDetails({ ticket, onClose, onStatusChange, onUpdate }: TicketDetailsProps) {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const { updateTicket } = useTicketStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TicketStatus>(ticket.status);
  const [currentPriority, setCurrentPriority] = useState<TicketPriority>(ticket.priority);
  const [description, setDescription] = useState(ticket.description);
  const [priorityReason, setPriorityReason] = useState('');
  const [userData2, setUserData2] = useState<{ name: string; email: string; role?: string } | null>(null);

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', ticket.userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData2(data as { name: string; email: string; role?: string });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };

    fetchUserData();
  }, [ticket.userId]);

  const handleDelete = async () => {
    try {
      await updateTicket(ticket.id, { status: 'closed' });
      onClose();
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      alert('Erro ao excluir ticket. Por favor, tente novamente.');
    }
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentStatus(newStatus);
      await onStatusChange(ticket.id, newStatus);
      onUpdate({
        ...ticket,
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status');
      setCurrentStatus(ticket.status);
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    if (!userData?.role === 'admin' && ticket.priorityLockedBy) {
      return;
    }
    setCurrentPriority(newPriority);
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const changes: Partial<Ticket> = {};

      if (currentStatus !== ticket.status) {
        changes.status = currentStatus;
        await onStatusChange(ticket.id, currentStatus);
      }

      if (currentPriority !== ticket.priority) {
        changes.priority = currentPriority;
        if (userData?.role === 'admin') {
          changes.priorityLockedBy = userData.name;
          changes.priorityLockedAt = new Date();
          changes.priorityReason = priorityReason || 'não foi identificada urgência na situação';
        }
      }

      if (description !== ticket.description) {
        changes.description = description;
      }

      if (Object.keys(changes).length > 0) {
        await updateTicket(ticket.id, changes);
        onUpdate({
          ...ticket,
          ...changes,
          updatedAt: new Date()
        });
      }

      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao salvar alterações');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComments = () => {
    navigate(`/comments/${ticket.id}`);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{ticket.title}</h2>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                    {statusLabels[ticket.status]}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[ticket.priority]}`}>
                    {priorityLabels[ticket.priority]}
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertTriangle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Criado por: {userData2?.name || 'Carregando...'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Em: {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {ticket.taskId && (
                    <div className="flex items-center space-x-2">
                      <Link className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-blue-600">
                        ID da Tarefa: {ticket.taskId}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Status</h3>
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    disabled={loading}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Prioridade</h3>
                  {ticket.priorityLockedBy && (
                    <div className="bg-blue-50 p-4 rounded-md mb-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            Prioridade alterada para{' '}
                            <strong>{priorityLabels[ticket.priority].toLowerCase()}</strong>
                            {ticket.priorityReason && (
                              <>, pois {ticket.priorityReason}</>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-blue-600">
                            Por {ticket.priorityLockedBy} em{' '}
                            {new Date(ticket.priorityLockedAt!).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <select
                    value={currentPriority}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    disabled={!userData?.role === 'admin' && ticket.priorityLockedBy}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Descrição</h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <textarea
                      value={description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      rows={4}
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                  )}
                </div>

                <button
                  onClick={handleViewComments}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Ver Comentários
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Fechar
            </button>
            {(isEditing || currentStatus !== ticket.status || currentPriority !== ticket.priority) && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2 inline-block" />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Ticket"
        message="Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita."
      />
    </>
  );
}