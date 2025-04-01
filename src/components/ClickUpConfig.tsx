import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Clock } from 'lucide-react';
import { useClickUpStore } from '../stores/clickupStore';
import { useAuthStore } from '../stores/authStore';
import { ClickUpAPI } from '../lib/clickup';

const configSchema = z.object({
  apiKey: z.string().min(1, 'API Key é obrigatória'),
  workspaceId: z.string().min(1, 'Workspace é obrigatório'),
  spaceId: z.string().min(1, 'Space é obrigatório'),
  listId: z.string().min(1, 'Lista é obrigatória'),
  active: z.boolean()
});

type ConfigFormData = z.infer<typeof configSchema>;

export function ClickUpConfig() {
  const { user } = useAuthStore();
  const { config, fetchConfig, saveConfig, loading } = useClickUpStore();
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([]);
  const [spaces, setSpaces] = useState<Array<{ id: string; name: string }>>([]);
  const [lists, setLists] = useState<Array<{ id: string; name: string }>>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      active: true,
      apiKey: config?.apiKey || '',
      workspaceId: config?.workspaceId || '',
      spaceId: config?.spaceId || '',
      listId: config?.listId || ''
    }
  });

  const apiKey = watch('apiKey');
  const selectedWorkspaceId = watch('workspaceId');
  const selectedSpaceId = watch('spaceId');

  // Carregar configuração existente
  useEffect(() => {
    if (user) {
      fetchConfig(user.uid);
    }
  }, [user, fetchConfig]);

  // Preencher formulário com configuração existente
  useEffect(() => {
    if (config) {
      setValue('apiKey', config.apiKey);
      setValue('workspaceId', config.workspaceId);
      setValue('spaceId', config.spaceId);
      setValue('listId', config.listId);
      setValue('active', config.active);

      // Carregar workspaces, spaces e lists quando houver configuração
      const loadData = async () => {
        try {
          const clickup = new ClickUpAPI(config.apiKey);
          
          // Carregar workspaces
          const { teams } = await clickup.getWorkspaces();
          setWorkspaces(teams);

          // Carregar spaces se houver workspaceId
          if (config.workspaceId) {
            const { spaces } = await clickup.getSpaces(config.workspaceId);
            setSpaces(spaces);
          }

          // Carregar lists se houver spaceId
          if (config.spaceId) {
            const { lists } = await clickup.getLists(config.spaceId);
            setLists(lists);
          }
        } catch (error) {
          console.error('Erro ao carregar dados do ClickUp:', error);
        }
      };

      loadData();
    }
  }, [config, setValue]);

  // Carregar workspaces quando a API key mudar
  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!apiKey) return;

      try {
        const clickup = new ClickUpAPI(apiKey);
        const { teams } = await clickup.getWorkspaces();
        setWorkspaces(teams);
      } catch (error) {
        console.error('Erro ao buscar workspaces:', error);
        setWorkspaces([]);
      }
    };

    fetchWorkspaces();
  }, [apiKey]);

  // Carregar spaces quando o workspace mudar
  useEffect(() => {
    const fetchSpaces = async () => {
      if (!apiKey || !selectedWorkspaceId) return;

      try {
        const clickup = new ClickUpAPI(apiKey);
        const { spaces } = await clickup.getSpaces(selectedWorkspaceId);
        setSpaces(spaces);
      } catch (error) {
        console.error('Erro ao buscar spaces:', error);
        setSpaces([]);
      }
    };

    fetchSpaces();
  }, [apiKey, selectedWorkspaceId]);

  // Carregar lists quando o space mudar
  useEffect(() => {
    const fetchLists = async () => {
      if (!apiKey || !selectedSpaceId) return;

      try {
        const clickup = new ClickUpAPI(apiKey);
        const { lists } = await clickup.getLists(selectedSpaceId);
        setLists(lists);
      } catch (error) {
        console.error('Erro ao buscar listas:', error);
        setLists([]);
      }
    };

    fetchLists();
  }, [apiKey, selectedSpaceId]);

  const onSubmit = async (data: ConfigFormData) => {
    if (!user) return;

    try {
      await saveConfig({
        ...data,
        userId: user.uid
      });
      setTestResult({
        success: true,
        message: 'Configuração salva com sucesso!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao salvar configuração'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-medium text-gray-900">Configuração do ClickUp</h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              {...register('apiKey')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            {errors.apiKey && (
              <p className="mt-1 text-sm text-red-600">{errors.apiKey.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Workspace
            </label>
            <select
              {...register('workspaceId')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Selecione um workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
            {errors.workspaceId && (
              <p className="mt-1 text-sm text-red-600">{errors.workspaceId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Space
            </label>
            <select
              {...register('spaceId')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Selecione um space</option>
              {spaces.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
            {errors.spaceId && (
              <p className="mt-1 text-sm text-red-600">{errors.spaceId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Lista
            </label>
            <select
              {...register('listId')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Selecione uma lista</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.name}
                </option>
              ))}
            </select>
            {errors.listId && (
              <p className="mt-1 text-sm text-red-600">{errors.listId.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('active')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-900">
              Ativo
            </label>
          </div>

          {testResult && (
            <div className={`p-4 rounded-md ${
              testResult.success ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className={`text-sm ${
                testResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {testResult.message}
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}