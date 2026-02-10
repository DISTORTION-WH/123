'use client';

import { Post } from '@/types';
import { useState } from 'react';
import { api } from '@/lib/axios';

interface PostCardProps {
  post: Post;
}


const getImageUrl = (filename: string) => {
  return `http://localhost:3001/uploads/${filename}`;
};

export default function PostCard({ post }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false); 
  
  const handleLike = async () => {
    try {
      await api.put(`/posts/${post.id}/like`);
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking post', error);
    }
  };

  const mainImage = post.assets && post.assets.length > 0 ? post.assets[0].asset : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg mb-6 shadow-sm">
      <div className="p-3 flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center mr-3 text-xs font-bold text-white">
            {post.profile?.username?.[0]?.toUpperCase()}
        </div>
        <span className="font-semibold text-sm">{post.profile?.username}</span>
      </div>

      {mainImage && (
        <div className="relative w-full aspect-square bg-gray-100">
            <img 
                src={getImageUrl(mainImage.fileName)} 
                alt="Post content"
                className="w-full h-full object-cover"
            />
        </div>
      )}

      <div className="p-3">
        <div className="flex space-x-4 mb-2">
          <button onClick={handleLike} className="focus:outline-none">
            {isLiked ? (
               <span className="text-red-500 text-2xl">♥</span>
            ) : (
               <span className="text-black text-2xl">♡</span>
            )}
          </button>
          <button className="text-2xl">💬</button>
        </div>

        <div className="text-sm">
          <span className="font-semibold mr-2">{post.profile?.username}</span>
          <span>{post.caption}</span>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 uppercase">
            {new Date(post.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}