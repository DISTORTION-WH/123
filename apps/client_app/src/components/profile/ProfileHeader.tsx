import React, { useState } from 'react';
import Image from 'next/image'; 
import { Profile } from '@/types';
import { EditProfileModal } from './EditProfileModal';

interface ProfileHeaderProps {
  profile: Profile;
  isMyProfile: boolean;
  isFollowing: boolean;
  stats: { posts: number; followers: number; following: number };
  onFollowToggle: () => void;
  onProfileUpdate?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, isMyProfile, isFollowing, stats, onFollowToggle, onProfileUpdate 
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleFollowAction = async () => {
    onFollowToggle();
  };

  const avatarUrl = profile.avatarUrl 
    ? `${process.env.NEXT_PUBLIC_API_URL}${profile.avatarUrl}` 
    : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-4">
    
      <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100 shadow-sm shrink-0">
        {avatarUrl ? (
          <Image 
            src={avatarUrl} 
            alt={profile.username} 
            fill
            className="object-cover"
            sizes="(max-width: 768px) 128px, 160px"
            priority 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">?</div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center md:items-start">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-light">{profile.username}</h2>
          
          {isMyProfile ? (
            <button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50 transition"
            >
              Edit Profile
            </button>
          ) : (
             <div className="flex gap-2">
                <button 
                  onClick={handleFollowAction} 
                  className={`px-6 py-1.5 rounded font-semibold text-sm transition text-white ${
                    isFollowing 
                      ? 'bg-gray-500 hover:bg-gray-600' 
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50 transition">
                  Message
                </button>
            </div>
          )}
        </div>

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