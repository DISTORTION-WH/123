// apps/client_app/src/components/feed/PostCard.tsx

import React from 'react';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/axios';

interface PostCardProps {
  post: Post;
  onLikeToggle: (postId: string, newStatus: boolean) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle }) => {
  const handleLike = async () => {
    try {
      await api.post(`/posts/${post.id}/like`);
      // Сообщаем родителю об изменении, чтобы обновить UI оптимистично
      onLikeToggle(post.id, !post.isLiked);
    } catch (error) {
      console.error('Like failed', error);
    }
  };

  const assetUrl = post.assets[0]?.asset.url 
    ? `${process.env.NEXT_PUBLIC_API_URL}${post.assets[0].asset.url}` 
    : null;

  return (
    <div className="bg-white border rounded-xl mb-6 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center p-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden mr-3">
           {/* Placeholder для аватара */}
           {post.profile.avatarUrl && (
             <img src={`${process.env.NEXT_PUBLIC_API_URL}${post.profile.avatarUrl}`} alt="avatar" className="w-full h-full object-cover" />
           )}
        </div>
        <div>
          <p className="font-bold text-sm">{post.profile.username}</p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Image */}
      {assetUrl && (
        <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
          <img src={assetUrl} alt="Post content" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Actions */}
      <div className="p-3">
        <div className="flex gap-4 mb-2">
          <button 
            onClick={handleLike} 
            className={`text-2xl transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {post.isLiked ? '❤️' : '🤍'}
          </button>
          <button className="text-2xl text-gray-400 hover:text-gray-600">
            💬
          </button>
          <button className="text-2xl text-gray-400 hover:text-gray-600 ml-auto">
            ✈️
          </button>
        </div>

        <p className="font-bold text-sm mb-1">{post.likesCount} likes</p>
        
        <div className="text-sm">
          <span className="font-bold mr-2">{post.profile.username}</span>
          {post.caption}
        </div>
        
        {post.commentsCount > 0 && (
            <p className="text-gray-400 text-sm mt-1 cursor-pointer">
                View all {post.commentsCount} comments
            </p>
        )}
      </div>
    </div>
  );
};