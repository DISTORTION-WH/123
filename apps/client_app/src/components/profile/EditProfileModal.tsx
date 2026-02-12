import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { AxiosError } from 'axios'; // Добавлен импорт для типизации ошибок
import { api } from '@/lib/axios';
import { Profile } from '@/types';

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onUpdate: () => void;
}

// Интерфейс для данных обновления (DTO)
interface UpdateProfileDto {
  displayName: string;
  bio: string;
  avatarId?: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  profile, 
  onClose, 
  onUpdate 
}) => {
  // Инициализируем состояние текущими данными профиля
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [bio, setBio] = useState(profile.bio || '');
  
  // Состояния для загрузки и обработки ошибок
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Работа с файлом (аватаркой)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.avatarUrl ? `${process.env.NEXT_PUBLIC_API_URL}${profile.avatarUrl}` : null
  );

  // Обработчик выбора файла
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Ограничение 5MB
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      // Создаем локальный URL для предпросмотра
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setError(null);
    }
  };

  // Основной метод сохранения
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let uploadedAvatarId: string | null = null;

      // 1. Если выбран новый файл, сначала загружаем его
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Типизируем ответ от загрузки файла
        const uploadRes = await api.post<{ id: string }>('/assets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        uploadedAvatarId = uploadRes.data.id; 
      }

      // 2. Обновляем профиль
      // Используем типизированный объект вместо any
      const updateData: UpdateProfileDto = {
        displayName,
        bio,
      };

      // Если аватар был обновлен, добавляем его ID
      if (uploadedAvatarId) {
        updateData.avatarId = uploadedAvatarId;
      }

      await api.patch('/profiles/me', updateData);

      // 3. Уведомляем родителя и закрываем
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
      
      // Типизация ошибки через AxiosError
      const axiosError = err as AxiosError<{ message: string }>;
      setError(axiosError.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden animate-fade-in">
        
        {/* Заголовок */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-lg">Edit Profile</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          
          {/* Секция Аватара */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <div 
              className="relative w-24 h-24 rounded-full bg-gray-100 overflow-hidden cursor-pointer group border border-gray-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <Image 
                  src={previewUrl} 
                  alt="Avatar preview" 
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">?</div>
              )}
              
              {/* Оверлей при наведении */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-medium">
                Change
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-500 text-sm font-semibold hover:text-blue-600"
            >
              Change Profile Photo
            </button>
          </div>

          {/* Поля ввода */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Display Name</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              placeholder="Your name"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Bio</label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              placeholder="Tell something about yourself..."
              maxLength={150}
            />
            <div className="text-right text-xs text-gray-400">
              {bio.length}/150
            </div>
          </div>

          {/* Ошибки */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100">
              {error}
            </div>
          )}

          {/* Футер с кнопками */}
          <div className="mt-2 pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-6 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};