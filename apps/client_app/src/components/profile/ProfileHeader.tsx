import React, { useState } from 'react'; // Добавь useState
import { Profile } from '@/types';
import { api } from '@/lib/axios';
import { EditProfileModal } from './EditProfileModal'; // Импорт

// ... интерфейс ProfileHeaderProps (без изменений) ...
interface ProfileHeaderProps {
  profile: Profile;
  isMyProfile: boolean;
  isFollowing: boolean;
  stats: { posts: number; followers: number; following: number };
  onFollowToggle: () => void;
  onProfileUpdate?: () => void; // Новый проп для перезагрузки данных
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, isMyProfile, isFollowing, stats, onFollowToggle, onProfileUpdate 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // Состояние модалки

  // ... handleFollowAction и avatarUrl (без изменений) ...
  const handleFollowAction = async () => { /* ... код из предыдущего шага ... */ };
  const avatarUrl = profile.avatarUrl 
    ? `${process.env.NEXT_PUBLIC_API_URL}${profile.avatarUrl}` 
    : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-4">
      {/* ... Avatar (без изменений) ... */}
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100 shadow-sm shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">?</div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center md:items-start">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-light">{profile.username}</h2>
          
          {isMyProfile ? (
            <button 
                onClick={() => setIsEditModalOpen(true)} // Открываем модалку
                className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50 transition"
            >
              Edit Profile
            </button>
          ) : (
             // ... Кнопки Follow/Message (без изменений) ...
             <div className="flex gap-2">
                <button onClick={handleFollowAction} className="...">
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="...">Message</button>
            </div>
          )}
        </div>

        {/* ... Stats и Bio (без изменений) ... */}
        <div className="flex gap-8 mb-4 text-sm md:text-base">
          <div><span className="font-bold">{stats.posts}</span> posts</div>
          <div><span className="font-bold">{stats.followers}</span> followers</div>
          <div><span className="font-bold">{stats.following}</span> following</div>
        </div>

        <div className="text-sm md:text-left text-center">
          <p className="font-bold">{profile.displayName}</p>
          <p className="whitespace-pre-wrap">{profile.bio}</p>
        </div>
      </div>

      {/* Модальное окно */}
      {isEditModalOpen && (
        <EditProfileModal 
            profile={profile}
            onClose={() => setIsEditModalOpen(false)}
            onUpdate={() => {
                if (onProfileUpdate) onProfileUpdate();
            }}
        />
      )}
    </div>
  );
};