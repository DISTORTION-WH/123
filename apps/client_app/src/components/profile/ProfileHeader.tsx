// apps/client_app/src/components/profile/ProfileHeader.tsx

import React from 'react';
import { Profile } from '@/types';
import { api } from '@/lib/axios';

interface ProfileHeaderProps {
  profile: Profile;
  isMyProfile: boolean;
  isFollowing: boolean;
  stats: { posts: number; followers: number; following: number };
  onFollowToggle: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ 
  profile, isMyProfile, isFollowing, stats, onFollowToggle 
}) => {
  
  const handleFollowAction = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/profiles/${profile.username}/follow`);
      } else {
        await api.post(`/profiles/${profile.username}/follow`);
      }
      onFollowToggle();
    } catch (err) {
      console.error('Follow action failed', err);
    }
  };

  const avatarUrl = profile.avatarUrl 
    ? `${process.env.NEXT_PUBLIC_API_URL}${profile.avatarUrl}` 
    : null;

  return (
    <div className="flex flex-col md:flex-row items-center gap-8 mb-8 p-4">
      {/* Avatar */}
      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gray-200 overflow-hidden border-2 border-gray-100 shadow-sm shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt={profile.username} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-400">?</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col items-center md:items-start">
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-2xl font-light">{profile.username}</h2>
          
          {isMyProfile ? (
            <button className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50">
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
                <button 
                    onClick={handleFollowAction}
                    className={`px-6 py-1.5 rounded font-semibold text-sm transition-colors ${
                        isFollowing 
                        ? 'bg-gray-200 text-black hover:bg-gray-300' 
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                >
                    {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button className="px-4 py-1.5 border border-gray-300 rounded font-semibold text-sm hover:bg-gray-50">
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
    </div>
  );
};