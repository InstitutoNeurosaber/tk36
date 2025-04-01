import React, { useRef } from 'react';
import { Paperclip, X } from 'lucide-react';
import type { Attachment } from '../types/ticket';

interface AttachmentsProps {
  attachments: Attachment[];
  ticketId: string;
  onAddAttachment: (ticketId: string, file: File) => void;
  onRemoveAttachment: (ticketId: string, attachmentId: string) => void;
}

export function Attachments({ attachments, ticketId, onAddAttachment, onRemoveAttachment }: AttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddAttachment(ticketId, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Anexos</h3>

      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
          >
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
            >
              <Paperclip className="h-4 w-4" />
              <span>{attachment.fileName}</span>
            </a>
            <button
              onClick={() => onRemoveAttachment(ticketId, attachment.id)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Adicionar Anexo
        </label>
      </div>
    </div>
  );
}