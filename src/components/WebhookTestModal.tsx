import React from 'react';
import { CheckCircle2, XCircle, X, Loader2 } from 'lucide-react';

interface WebhookTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  result?: {
    success: boolean;
    message: string;
    taskId?: string;
    response?: any;
  } | null;
}

export function WebhookTestModal({ isOpen, onClose, loading, result }: WebhookTestModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in slide-in">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {loading ? (
                <>
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Testando Webhook...
                  </h3>
                </>
              ) : result ? (
                <>
                  {result.success ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900">
                    {result.success ? 'Teste Concluído' : 'Erro no Teste'}
                  </h3>
                </>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {result && (
            <div className="mt-4">
              <div className={`p-4 rounded-md ${
                result.success ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <p className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
              </div>

              {result.taskId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    Detalhes da Resposta
                  </h4>
                  <p className="text-sm text-blue-700">
                    ID da Tarefa: {result.taskId}
                  </p>
                </div>
              )}

              {result.response && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Resposta Completa
                  </h4>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-xs text-gray-700">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}