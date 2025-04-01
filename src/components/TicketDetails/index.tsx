import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, User, Link as LinkIcon, X } from 'lucide-react';
import { useTicketDetails } from '../../hooks/useTicketDetails';
import { useAuthStore } from '../../stores/authStore';
import { TicketHeader } from './TicketHeader';
import { TicketInfo } from './TicketInfo';
import { TicketStatus } from './TicketStatus';
import { TicketPriority } from './TicketPriority';
import { TicketComments } from './TicketComments';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { statusLabels, priorityLabels, statusColors, priorityColors } from '../../types/ticket';
import type { Ticket } from '../../types/ticket';

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => void;
  onUpdate: (ticket: Ticket) => void;
}

export function TicketDetails({ ticket, onClose, onStatusChange, onUpdate }: TicketDetailsProps) {
  const navigate = useNavigate();
  const { userData } = useAuthStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(ticket.description);

  const {
    loading,
    error,
    updateStatus,
    updatePriority,
    updateTicket,
    deleteTicket
  } = useTicketDetails(ticket.id);

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus(status);
      onStatusChange(ticket.id, status);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handlePriorityChange = async (priority: string, reason?: string) => {
    try {
      await updatePriority(priority, reason);
      onUpdate({
        ...ticket,
        priority,
        priorityLockedBy: userData?.name,
        priorityLockedAt: new Date(),
        priorityReason: reason
      });
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
    }
  };

  const handleSaveDescription = async () => {
    try {
      await updateTicket({ description });
      onUpdate({ ...ticket, description });
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTicket();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
    }
  };

  const handleViewComments = () => {
    navigate(`/comments/${ticket.id}`);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-medium text-red-600">Erro</h3>
          <p className="mt-2 text-gray-500">{error}</p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
          {/* Cabeçalho */}
          <div className="p-6 border-b border-gray-200">
            <TicketHeader
              ticket={ticket}
              onClose={onClose}
              onDelete={() => setDeleteModalOpen(true)}
            />
          </div>

          {/* Conteúdo Principal */}
          <div className="flex h-[calc(90vh-200px)]">
            {/* Coluna Principal - 70% */}
            <div className="w-[70%] p-6 overflow-y-auto border-r border-gray-200">
              {/* Descrição */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Descrição</h3>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Descreva o ticket..."
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setDescription(ticket.description);
                        }}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveDescription}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{description}</p>
                )}
              </div>

              {/* Comentários */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <TicketComments ticket={ticket} />
                <button
                  onClick={handleViewComments}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Ver Todos os Comentários
                </button>
              </div>
            </div>

            {/* Barra Lateral - 30% */}
            <div className="w-[30%] p-6 bg-gray-50 overflow-y-auto">
              <div className="space-y-6">
                {/* Informações do Ticket */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TicketInfo ticket={ticket} />
                </div>

                {/* Status */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TicketStatus
                    ticket={ticket}
                    onChange={handleStatusChange}
                    disabled={loading}
                  />
                </div>

                {/* Prioridade */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <TicketPriority
                    ticket={ticket}
                    onChange={handlePriorityChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
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