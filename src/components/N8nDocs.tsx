import React, { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import { n8nService } from '../services/n8nService';

export function N8nDocs() {
  const [copiedWorkflow, setCopiedWorkflow] = useState<string | null>(null);
  const workflows = n8nService.getWorkflowExamples();
  const baseUrl = window.location.origin;

  const copyToClipboard = async (text: string, workflowName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedWorkflow(workflowName);
      setTimeout(() => setCopiedWorkflow(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-2 mb-4">
          <Code2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Integração com n8n</h2>
        </div>

        <div className="prose max-w-none">
          <h3>Configuração do Webhook</h3>
          <p>
            Para integrar com o n8n, configure um novo webhook no seu workflow com as seguintes informações:
          </p>
          <ul>
            <li>
              <strong>URL Base:</strong> <code>{baseUrl}/api</code>
            </li>
            <li>
              <strong>Header de Autenticação:</strong> <code>X-API-Key: sua-api-key</code>
            </li>
            <li>
              <strong>Formato do Payload:</strong> <code>application/json</code>
            </li>
          </ul>

          <h3 className="mt-8">Exemplos de Workflows</h3>
          
          {Object.entries(workflows).map(([name, workflow]) => (
            <div key={name} className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">{name}</h4>
                <button
                  onClick={() => copyToClipboard(workflow, name)}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {copiedWorkflow === name ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <pre className="mt-2 p-4 bg-gray-50 rounded-md overflow-auto text-sm">
                {workflow}
              </pre>
            </div>
          ))}

          <h3 className="mt-8">Eventos Disponíveis</h3>
          <p>O sistema envia webhooks para o n8n nos seguintes eventos:</p>
          <ul>
            <li><code>ticket.created</code> - Quando um novo ticket é criado</li>
            <li><code>ticket.updated</code> - Quando um ticket é atualizado</li>
            <li><code>ticket.status_changed</code> - Quando o status de um ticket é alterado</li>
            <li><code>ticket.comment_added</code> - Quando um comentário é adicionado</li>
            <li><code>ticket.assigned</code> - Quando um ticket é atribuído</li>
            <li><code>ticket.deleted</code> - Quando um ticket é excluído</li>
          </ul>
        </div>
      </div>
    </div>
  );
}