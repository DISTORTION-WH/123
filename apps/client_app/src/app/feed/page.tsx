// apps/client_app/src/app/feed/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { CreatePostWidget } from '@/components/feed/CreatePostWidget';
import { PostCard } from '@/components/feed/PostCard';
import { Post } from '@/types';
import { api } from '@/lib/axios';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      // Используем endpoint ленты. Если его нет, используем /posts (все посты)
      // Для теста: можно временно дергать /posts
      const res = await api.get<Post[]>('/posts'); 
      setPosts(res.data);
    } catch (error) {
      console.error('Failed to fetch feed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleLikeToggle = (postId: string, newStatus: boolean) => {
    setPosts(currentPosts => 
      currentPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: newStatus,
            likesCount: newStatus ? post.likesCount + 1 : post.likesCount - 1
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      
      <main className="max-w-xl mx-auto pt-6 px-4 pb-20">
        <CreatePostWidget onPostCreated={fetchPosts} />

        {loading ? (
          <div className="text-center text-gray-500 py-10">Loading feed...</div>
        ) : (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLikeToggle={handleLikeToggle}
              />
            ))}
            {posts.length === 0 && (
                <div className="text-center text-gray-400 py-10">
                    No posts yet. Be the first to share something!
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}