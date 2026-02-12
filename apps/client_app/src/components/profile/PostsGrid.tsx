// apps/client_app/src/components/profile/PostsGrid.tsx

import React from 'react';
import { Post } from '@/types';

interface PostsGridProps {
  posts: Post[];
}

export const PostsGrid: React.FC<PostsGridProps> = ({ posts }) => {
  if (posts.length === 0) {
    return (
      <div className="py-10 text-center border-t">
        <div className="text-4xl mb-2">📷</div>
        <h3 className="font-bold text-xl">No Posts Yet</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-4 border-t pt-4">
      {posts.map((post) => {
        const assetUrl = post.assets[0]?.asset.url 
            ? `${process.env.NEXT_PUBLIC_API_URL}${post.assets[0].asset.url}` 
            : null;
            
        return (
            <div key={post.id} className="relative aspect-square bg-gray-100 group cursor-pointer overflow-hidden">
            {assetUrl && (
                <img src={assetUrl} alt="Post" className="w-full h-full object-cover" />
            )}
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold gap-4">
                <span>❤️ {post.likesCount}</span>
                <span>💬 {post.commentsCount}</span>
            </div>
            </div>
        );
      })}
    </div>
  );
};