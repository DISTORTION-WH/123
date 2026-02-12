// apps/client_app/src/components/profile/EditProfileModal.tsx

import React, { useState, useRef } from 'react';
import { api } from '@/lib/axios';
import { Profile } from '@/types';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void; // Вызываем, чтобы родитель обновил данные
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Обновляем текстовые данные
      await api.patch('/profiles/me', {
        displayName,
        bio,
      });

      // 2. Обновляем аватар, если выбран файл
      if (fileInputRef.current?.files?.[0]) {
        const formData = new FormData();
        formData.append('file', fileInputRef.current.files[0]);
        await api.patch('/profiles/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onUpdate(); // Обновляем данные в родителе
      onClose();  // Закрываем модалку
    } catch (error) {
      console.error('Failed to update profile', error);
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border">
                {/* Тут можно сделать предпросмотр, но для простоты оставим старый или плейсхолдер */}
                <img 
                    src={profile.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL}${profile.avatarUrl}` : ''} 
                    className="w-full h-full object-cover"
                    alt="Current avatar"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
            </div>
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="text-blue-500 text-sm font-semibold"
            >
                Change Profile Photo
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
            />
          </div>

          {/* Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};