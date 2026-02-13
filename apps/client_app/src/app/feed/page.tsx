'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CreatePostWidget } from '@/components/feed/CreatePostWidget';
import { PostCard } from '@/components/feed/PostCard';
import { Post, PaginationMeta } from '@/types';
import { api } from '@/lib/axios';

export default function FeedPage() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const limit = 10;

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const res = await api.get('/posts/feed', {
          params: { page: pageNum, limit },
        });
        const { data, meta: responseMeta } = res.data as {
          data: Post[];
          meta: PaginationMeta;
        };
        setPosts((prev) => (append ? [...prev, ...data] : data));
        setMeta(responseMeta);
        setPage(pageNum);
      } catch (error) {
        console.error('Failed to fetch feed', error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    fetchPosts(1);
  }, [fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !meta || page >= meta.totalPages) return;
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300;
      if (scrolledToBottom) {
        fetchPosts(page + 1, true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, meta, page, fetchPosts]);

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
      }),
    );
  };

  const handlePostCreated = () => {
    fetchPosts(1);
  };

  const handlePostDelete = async (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId)
    );
  };

  const handlePostUpdate = (updatedPost: any) => {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  const hasMore = meta ? page < meta.totalPages : false;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
      <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
        <CreatePostWidget
          onPostCreated={handlePostCreated}
          userAvatar={profile?.avatarUrl}
          userName={profile?.displayName || user?.email || 'User'}
        />

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
                Loading feed...
              </p>
            </div>
          ) : (
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

              {posts.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-5xl mb-4">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="mx-auto"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
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
                    Be the first to share something!
                  </p>
                </div>
              )}

              {hasMore && (
                <div className="flex justify-center py-6">
                  <button
                    onClick={() => fetchPosts(page + 1, true)}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all"
                    style={{
                      background: loadingMore
                        ? 'var(--bg-elevated)'
                        : 'var(--accent)',
                      color: 'var(--text-primary)',
                      opacity: loadingMore ? 0.7 : 1,
                    }}
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
                          style={{
                            borderColor: 'var(--text-primary)',
                            borderTopColor: 'transparent',
                          }}
                        />
                        Loading...
                      </span>
                    ) : (
                      'Load more'
                    )}
                  </button>
                </div>
              )}

              {loadingMore && !hasMore && (
                <p
                  className="text-center py-4 text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  You have seen all posts
                </p>
              )}
            </div>
          )}
      </main>
    </div>
  );
}
