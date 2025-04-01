import React, { useState, useEffect } from 'react';
import { Code2, AlertTriangle, Plus, Copy, Check, Key, RefreshCw, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../stores/authStore';
import { Toast } from './Toast';

interface ApiKey {
  id: string;
  key: string;
  name: string;
  createdAt: Date;
  lastUsed?: Date;
}

export function ApiDocs() {
  const { user } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const baseUrl = window.location.origin;

  const endpoints = [
    {
      method: 'POST',
      path: '/api/tickets',
      description: 'Criar novo ticket',
      example: {
        title: 'Novo Ticket',
        description: 'Descrição do ticket',
        category: 'software',
        priority: 'medium'
      }
    },
    {
      method: 'POST',
      path: '/api/tickets/:id/status',
      description: 'Atualizar status do ticket (substitua :id pelo ID do ticket)',
      example: {
        status: 'in_progress',
        _method: 'PUT'
      }
    },
    {
      method: 'POST',
      path: '/api/tickets/:id/priority',
      description: 'Atualizar prioridade do ticket (substitua :id pelo ID do ticket)',
      example: {
        priority: 'high',
        _method: 'PUT'
      }
    },
    {
      method: 'POST',
      path: '/api/tickets/:id/comments',
      description: 'Adicionar comentário ao ticket (substitua :id pelo ID do ticket)',
      example: {
        content: 'Novo comentário',
        userId: 'user-id'
      }
    },
    {
      method: 'POST',
      path: '/api/tickets/:id/delete',
      description: 'Excluir ticket (substitua :id pelo ID do ticket)',
      example: {
        _method: 'DELETE'
      }
    }
  ];

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const apiKeysRef = collection(db, 'api_keys');
      const q = query(apiKeysRef, where('userId', '==', user?.uid));
      const snapshot = await getDocs(q);
      
      const keys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        lastUsed: doc.data().lastUsed?.toDate()
      })) as ApiKey[];

      setApiKeys(keys);
    } catch (error) {
      console.error('Erro ao buscar API keys:', error);
      setToast({
        type: 'error',
        message: 'Erro ao carregar as API keys'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setToast({
        type: 'error',
        message: 'Digite um nome para a API key'
      });
      return;
    }

    try {
      setLoading(true);
      const newKey = generateApiKey();
      const apiKeysRef = collection(db, 'api_keys');
      
      await addDoc(apiKeysRef, {
        userId: user?.uid,
        name: newKeyName.trim(),
        key: newKey,
        active: true,
        createdAt: Timestamp.now()
      });

      setNewKeyName('');
      await fetchApiKeys();
      
      setToast({
        type: 'success',
        message: 'API key criada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar API key:', error);
      setToast({
        type: 'error',
        message: 'Erro ao criar API key'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta API key?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'api_keys', keyId));
      await fetchApiKeys();
      
      setToast({
        type: 'success',
        message: 'API key excluída com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir API key:', error);
      setToast({
        type: 'error',
        message: 'Erro ao excluir API key'
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar para a área de transferência:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* API Keys Management */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Key className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">API Keys</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Nome da API Key"
                className="px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={createApiKey}
                disabled={loading || !newKeyName.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Gerar API Key
              </button>
            </div>
            <button
              onClick={fetchApiKeys}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Atualizar lista"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  API Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criada em
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último uso
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {apiKey.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <code className="bg-gray-100 px-2 py-1 rounded">
                        {apiKey.key.substring(0, 32)}...
                      </code>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="text-gray-400 hover:text-gray-600"
                        title="Copiar API key"
                      >
                        {copiedKey === apiKey.key ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {apiKey.createdAt.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {apiKey.lastUsed ? apiKey.lastUsed.toLocaleString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteApiKey(apiKey.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Excluir API key"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {apiKeys.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Nenhuma API key encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* API Documentation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-3 mb-4">
          <Code2 className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Documentação da API</h2>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Autenticação</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Todas as requisições devem incluir o header:</p>
                <pre className="mt-2 bg-yellow-100 p-2 rounded">
                  X-API-Key: sua-api-key
                </pre>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border-b border-gray-200 pb-8 last:border-0">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                  endpoint.method === 'PUT' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {endpoint.method}
                </span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {baseUrl}{endpoint.path}
                </code>
              </div>

              <p className="text-gray-600 mb-4">{endpoint.description}</p>

              {endpoint.example && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Exemplo de Payload:</h4>
                  <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                    {JSON.stringify(endpoint.example, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Exemplo de Uso (cURL):</h4>
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                  {`curl -X ${endpoint.method} \\
  ${baseUrl}${endpoint.path} \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: sua-api-key"${endpoint.example ? ` \\
  -d '${JSON.stringify(endpoint.example)}'` : ''}`}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Códigos de Resposta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium text-gray-600">200</span>
              <span className="text-sm text-gray-600">Sucesso</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium text-gray-600">201</span>
              <span className="text-sm text-gray-600">Criado com sucesso</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium text-gray-600">400</span>
              <span className="text-sm text-gray-600">Requisição inválida</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium text-gray-600">401</span>
              <span className="text-sm text-gray-600">Não autorizado</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium text-gray-600">404</span>
              <span className="text-sm text-gray-600">Não encontrado</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-16 text-sm font-medium text-gray-600">500</span>
              <span className="text-sm text-gray-600">Erro interno do servidor</span>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}