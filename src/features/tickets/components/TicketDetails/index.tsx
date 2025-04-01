import React from 'react';
import { useTicketDetails } from '../../hooks/useTicketDetails';
import { TicketHeader } from './TicketHeader';
import { TicketInfo } from './TicketInfo';
import { TicketStatus } from './TicketStatus';
import { TicketPriority } from './TicketPriority';
import { TicketComments } from './TicketComments';
import { DeleteConfirmationModal } from '../../../components/DeleteConfirmationModal';
import type { Ticket } from '../../../../types/ticket';

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
  onStatusChange: (ticketId: string, status: string) => void;
  onUpdate: (ticket: Ticket) => void;
}

export function TicketDetails({ ticket, onClose, onStatusChange, onUpdate }: TicketDetailsProps) {
  const {
    loading,
    error,
    isEditing,
    deleteModalOpen,
    setDeleteModalOpen,
    setIsEditing,
    handleDelete,
    handleSave,
    handleStatusChange,
    handlePriorityChange,
    handleDescriptionChange
  } = useTicketDetails(ticket, onStatusChange, onUpdate);

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
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <TicketHeader
              ticket={ticket}
              onClose={onClose}
              onDelete={() => setDeleteModalOpen(true)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <TicketInfo ticket={ticket} />

                <TicketStatus
                  ticket={ticket}
                  onChange={handleStatusChange}
                  disabled={loading}
                />

                <TicketPriority
                  ticket={ticket}
                  onChange={handlePriorityChange}
                  disabled={loading}
                />

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Descrição</h3>
                  {isEditing ? (
                    <textarea
                      value={ticket.description}
                      onChange={(e) => handleDescriptionChange(e.target.value)}
                      className="w-full h-32 p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva o ticket..."
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  )}
                </div>

                <TicketComments ticket={ticket} />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
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