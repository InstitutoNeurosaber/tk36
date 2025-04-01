import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Save, 
  Share2, 
  Tag, 
  Plus, 
  Search, 
  Calendar,
  ChevronDown,
  Users,
  Globe,
  Lock,
  Trash2,
  AlertTriangle,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table as TableIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  Highlighter,
  CheckSquare,
  Heading,
  Undo,
  Redo,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useDiaryStore } from '../stores/diaryStore';
import type { DiaryEntry } from '../types/diary';

export function DiaryPage() {
  const navigate = useNavigate();
  const { user, userData } = useAuthStore();
  const { entries, createEntry, updateEntry, deleteEntry, loading, error, fetchEntries } = useDiaryStore();
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [title, setTitle] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      Typography,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: 'Comece a escrever suas ideias...'
      })
    ],
    content: selectedEntry?.content || '',
    onUpdate: ({ editor }) => {
      if (selectedEntry) {
        handleSave(editor.getHTML());
      }
    }
  });

  // Carregar entradas quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      console.log('Buscando entradas para usuário:', user.uid);
      fetchEntries(user.uid);
    }
  }, [user, fetchEntries]);

  useEffect(() => {
    if (selectedEntry) {
      setTitle(selectedEntry.title);
      setIsPublic(selectedEntry.isPublic);
      
      if (editor) {
        editor.commands.setContent(selectedEntry.content);
      }
    }
  }, [selectedEntry, editor]);

  const handleSave = async (content: string) => {
    if (!selectedEntry || !user) return;

    try {
      await updateEntry(selectedEntry.id, {
        content,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao salvar entrada:', error);
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!selectedEntry) return;
    
    setTitle(newTitle);
    
    try {
      await updateEntry(selectedEntry.id, {
        title: newTitle,
        updatedAt: new Date()
      });
      
      setSelectedEntry(prev => prev ? { ...prev, title: newTitle } : null);
    } catch (error) {
      console.error('Erro ao atualizar título:', error);
    }
  };

  const handleNewEntry = async () => {
    if (!user) return;

    try {
      const newEntry = await createEntry({
        title: 'Nova Entrada',
        content: '',
        userId: user.uid,
        sharedWith: [],
        tags: [],
        isPublic: false
      });

      setSelectedEntry(newEntry);
      setTitle(newEntry.title);
      
      if (editor) {
        editor.commands.setContent('');
      }
    } catch (error) {
      console.error('Erro ao criar nova entrada:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;

    try {
      await deleteEntry(selectedEntry.id);
      setSelectedEntry(null);
      setShowDeleteModal(false);
      
      if (editor) {
        editor.commands.setContent('');
      }
    } catch (error) {
      console.error('Erro ao excluir entrada:', error);
    }
  };

  if (!editor) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Erro ao carregar entradas: {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Botão de Voltar */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-72 z-50 flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </button>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Diário</h1>
          <button
            onClick={handleNewEntry}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar entradas..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedEntry?.id === entry.id
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {entry.title}
                </h3>
                {entry.isPublic ? (
                  <Globe className="h-4 w-4 text-gray-400" />
                ) : (
                  <Lock className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(entry.updatedAt, "d 'de' MMMM", { locale: ptBR })}
              </p>
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma entrada encontrada
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Área Principal */}
      <div className="ml-64 p-8">
        {selectedEntry ? (
          <div className="max-w-4xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-6 flex items-center justify-between">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="text-3xl font-bold bg-transparent border-0 outline-none text-gray-900 dark:text-white w-full"
                placeholder="Título da entrada"
              />
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </button>
                
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white"
                >
                  {isPublic ? (
                    <Globe className="h-4 w-4 mr-2" />
                  ) : (
                    <Lock className="h-4 w-4 mr-2" />
                  )}
                  {isPublic ? 'Público' : 'Privado'}
                </button>

                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </button>
              </div>
            </div>

            {/* Barra de Ferramentas do Editor */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-4 flex flex-wrap gap-2">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Bold className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Italic className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-2 rounded ${editor.isActive('strike') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Strikethrough className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`p-2 rounded ${editor.isActive('code') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Code className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Heading className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <ListOrdered className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`p-2 rounded ${editor.isActive('taskList') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <CheckSquare className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              
              <button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <AlignLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <AlignCenter className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <AlignRight className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              
              <button
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <TableIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const url = window.prompt('URL da imagem:');
                  if (url) {
                    editor.chain().focus().setImage({ src: url }).run();
                  }
                }}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ImageIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const url = window.prompt('URL do link:');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                className={`p-2 rounded ${editor.isActive('link') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded ${editor.isActive('highlight') ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Highlighter className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
              
              <button
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <Redo className="h-4 w-4" />
              </button>
            </div>

            {/* Editor */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto text-center py-12">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">
              Selecione uma entrada ou crie uma nova
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Suas ideias e anotações ficarão organizadas aqui
            </p>
            <button
              onClick={handleNewEntry}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nova Entrada
            </button>
          </div>
        )}
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Compartilhar Entrada
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Compartilhar com outros usuários
                  </label>
                  <select
                    multiple
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="user1">Usuário 1</option>
                    <option value="user2">Usuário 2</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Tornar público
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Implementar lógica de compartilhamento
                  setShowShareModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Compartilhar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Excluir Entrada
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}