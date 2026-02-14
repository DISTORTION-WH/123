'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { Post } from '@/types';
import { PostCard } from '@/components/feed/PostCard';

export default function UserPostsPage() {
  const params = useParams();
  const { user } = useAuth();
  const username = params?.username as string;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(
    async (pageNum: number = 1) => {
      if (!username) return;

      try {
        if (pageNum === 1) setLoading(true);

        const res = await api.get(`/posts/user/${username}`, {
          params: { page: pageNum, limit: 20 },
        });

        const newPosts = res.data.data || [];
        const meta = res.data.meta;

        if (pageNum === 1) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }

        setHasMore(pageNum < (meta?.totalPages || 1));
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to load posts:', error);
      } finally {
        setLoading(false);
      }
    },
    [username]
  );

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  const handleLikeToggle = (postId: string, newStatus: boolean) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: newStatus,
            likesCount: newStatus
              ? post.likesCount + 1
              : post.likesCount - 1,
          };
        }
        return post;
      })
    );
  };

  const handlePostDelete = async (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId)
    );
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  return (
    <div className="px-4 pb-16" style={{ color: 'var(--text-primary)' }}>
      <main className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Posts by @{username}</h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
            />
            <p
              className="mt-4 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Loading posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
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
              className="text-lg font-semibold mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              No posts yet
            </p>
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              @{username} hasn&apos;t posted anything yet
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLikeToggle={handleLikeToggle}
                  onDelete={handlePostDelete}
                  onUpdate={handlePostUpdate}
                  isAuthor={user?.id === post.profile.userId}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => loadPosts(page + 1)}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                  }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
