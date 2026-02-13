'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PostCard } from '@/components/feed/PostCard';
import { Post } from '@/types';
import { api } from '@/lib/axios';

export default function ExplorePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Fetch popular posts
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/posts/feed?page=1&limit=20');
        setPosts(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  const handlePostDelete = async (postId: string) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post.id !== postId)
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
      <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts, people, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-full text-sm focus:outline-none"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
            <svg
              className="absolute right-4 top-1/2 -translate-y-1/2"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* Trending Tags */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Trending</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { tag: '#Viral', count: '1.2M' },
              { tag: '#Trending', count: '890K' },
              { tag: '#Music', count: '2.5M' },
              { tag: '#Dance', count: '3.1M' },
              { tag: '#Comedy', count: '2.8M' },
              { tag: '#Creative', count: '1.9M' },
            ].map((item) => (
              <button
                key={item.tag}
                className="p-4 rounded-lg transition-all hover:opacity-80"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
              >
                <p className="font-bold" style={{ color: 'var(--accent)' }}>
                  {item.tag}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {item.count} views
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">Discover</h2>

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
                No posts found
              </p>
              <p
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                Check back later for new content
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
                  isAuthor={user?.id === post.profile.userId}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
