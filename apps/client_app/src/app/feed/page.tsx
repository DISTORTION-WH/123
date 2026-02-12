'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Post } from '@/types';
import Navbar from '@/components/Navbar';
import PostCard from '@/components/PostCard';
import { useRouter } from 'next/navigation';

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const response = await api.get('/posts/feed');
        setPosts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch feed', error);
        const err = error as { response?: { status?: number } };
        if (err.response?.status === 401) {
          router.push('/auth/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-xl mx-auto py-8 px-4">
        {loading ? (
           <div className="flex justify-center pt-20">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center pt-20">
            <p className="text-gray-500 text-lg">No posts yet.</p>
            <p className="text-gray-400 text-sm mt-2">Follow someone or create a post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </main>
    </div>
  );
}