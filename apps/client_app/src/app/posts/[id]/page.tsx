'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { Post } from '@/types';
import { PostCard } from '@/components/feed/PostCard';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const res = await api.get(`/posts/${postId}`);
        setPost(res.data);
      } catch (err) {
        console.error('Failed to load post:', err);
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId]);

  const handleLikeToggle = (postId: string, newStatus: boolean) => {
    if (post?.id === postId) {
      setPost({
        ...post,
        isLiked: newStatus,
        likesCount: newStatus ? post.likesCount + 1 : post.likesCount - 1,
      });
    }
  };

  const handlePostDelete = async () => {
    router.back();
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPost(updatedPost);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
        <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p
              className="mt-4 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Loading post...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
        <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
          <div className="text-center py-20">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {error || 'Post not found'}
            </p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-6 py-2 rounded-full font-semibold text-sm transition-all"
              style={{
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
      <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
        <PostCard
          post={post}
          onLikeToggle={handleLikeToggle}
          onDelete={handlePostDelete}
          onUpdate={handlePostUpdate}
          isAuthor={user?.id === post.profile.userId}
        />
      </main>
    </div>
  );
}
