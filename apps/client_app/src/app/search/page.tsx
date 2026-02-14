'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { Post, Profile } from '@/types';
import Link from 'next/link';
import { PostCard } from '@/components/feed/PostCard';
import { getAvatarUrl } from '@/lib/url-helper';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<{
    posts: Post[];
    profiles: Profile[];
  }>({ posts: [], profiles: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people'>('all');
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults({ posts: [], profiles: [] });
        return;
      }

      setLoading(true);
      try {
        const [postsRes, profilesRes] = await Promise.all([
          api.get('/posts/search', { params: { q: query, limit: 50 } }),
          api.get('/profiles/search', { params: { q: query } }),
        ]);

        const posts = postsRes.data.data || [];
        const profiles = profilesRes.data || [];

        setResults({ posts, profiles });

        // Check following status for profiles
        const statusMap: Record<string, boolean> = {};
        profiles.forEach((profile: Profile) => {
          statusMap[profile.id] = profile.isFollowing || false;
        });
        setFollowingStatus(statusMap);
      } catch (error) {
        console.error('Search failed:', error);
        setResults({ posts: [], profiles: [] });
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const handleFollow = async (username: string, profileId: string) => {
    try {
      if (followingStatus[profileId]) {
        await api.delete(`/profiles/${username}/follow`);
      } else {
        await api.post(`/profiles/${username}/follow`);
      }
      setFollowingStatus((prev) => ({
        ...prev,
        [profileId]: !prev[profileId],
      }));
    } catch (error) {
      console.error('Follow failed:', error);
    }
  };

  const handleLikeToggle = (postId: string, newStatus: boolean) => {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: newStatus,
            likesCount: newStatus ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      }),
    }));
  };

  const handlePostDelete = (postId: string) => {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
  };

  const handlePostUpdate = (updatedPost: Post) => {
    setResults((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
    }));
  };

  if (!query.trim()) {
    return (
      <div className="px-4 py-8 pb-20">
        <main className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mx-auto mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h2 className="text-2xl font-bold text-[var(--text-secondary)] mb-2">
              Search
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Use the search bar to find posts, creators, and more
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 pb-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
          Results for &quot;{query}&quot;
        </h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'posts'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Posts ({results.posts.length})
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'people'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            People ({results.profiles.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* People Results */}
            {(activeTab === 'all' || activeTab === 'people') && results.profiles.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  People
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.profiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="p-4 rounded-lg flex items-center justify-between"
                      style={{ background: 'var(--bg-card)' }}
                    >
                      <Link
                        href={`/profile/${profile.username}`}
                        className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
                      >
                        <img
                          src={getAvatarUrl(profile.avatarUrl) || ''}
                          alt={profile.username}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><circle cx="12" cy="12" r="12"/><path fill="white" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle fill="white" cx="12" cy="7" r="4"/></svg>`;
                          }}
                        />
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {profile.displayName || profile.username}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            @{profile.username}
                          </p>
                        </div>
                      </Link>

                      <button
                        onClick={() => handleFollow(profile.username, profile.id)}
                        className={`px-6 py-2 rounded-full font-semibold transition-all ${
                          followingStatus[profile.id]
                            ? 'bg-transparent border-2 border-[var(--accent)] text-[var(--accent)]'
                            : 'bg-[var(--accent)] text-white hover:opacity-90'
                        }`}
                      >
                        {followingStatus[profile.id] ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts Results */}
            {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
              <div className="mb-12">
                {activeTab === 'all' && <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Posts
                </h2>}
                <div className="space-y-4">
                  {results.posts.map((post) => (
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
              </div>
            )}

            {/* No Results */}
            {results.posts.length === 0 && results.profiles.length === 0 && (
              <div className="text-center py-20">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
                  No results found
                </p>
                <p style={{ color: 'var(--text-muted)' }}>
                  Try searching for something else
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
