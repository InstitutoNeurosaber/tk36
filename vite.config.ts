import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@tiptap/core',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-highlight',
      '@tiptap/extension-typography',
      '@tiptap/extension-text-align',
      '@tiptap/extension-task-list',
      '@tiptap/extension-task-item',
      '@tiptap/extension-table',
      '@tiptap/extension-table-row',
      '@tiptap/extension-table-cell',
      '@tiptap/extension-table-header',
      'prosemirror-commands',
      'prosemirror-keymap',
      'prosemirror-model',
      'prosemirror-schema-basic',
      'prosemirror-state',
      'prosemirror-transform',
      'prosemirror-view'
    ],
    exclude: ['lucide-react']
  },
  resolve: {
    dedupe: ['react', 'react-dom']
  }
});