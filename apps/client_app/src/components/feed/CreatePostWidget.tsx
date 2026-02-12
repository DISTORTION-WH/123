// apps/client_app/src/components/feed/CreatePostWidget.tsx

import React, { useState, useRef } from 'react';
import { api } from '@/lib/axios';

interface CreatePostWidgetProps {
  onPostCreated: () => void;
}

export const CreatePostWidget: React.FC<CreatePostWidgetProps> = ({ onPostCreated }) => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('files', file); // Важно: имя поля 'files' должно совпадать с бэкендом (FilesInterceptor)

    try {
      await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Сброс формы
      setCaption('');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onPostCreated(); // Обновляем ленту
    } catch (error) {
      console.error('Failed to create post', error);
      alert('Error creating post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
          <textarea
            className="w-full bg-gray-50 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            placeholder="What's on your mind?"
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
        
        {file && (
            <div className="mb-3 p-2 bg-gray-100 rounded text-xs flex justify-between items-center">
                <span>Selected: {file.name}</span>
                <button type="button" onClick={() => setFile(null)} className="text-red-500">✕</button>
            </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t">
          <div className="flex gap-2">
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-500 text-sm hover:bg-blue-50 px-3 py-1 rounded-md transition"
            >
              📷 Photo
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
                className="hidden" 
                accept="image/*"
            />
          </div>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isUploading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
};