'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { Profile, Post, ProfileFollow } from '@/types';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostsGrid } from '@/components/profile/PostsGrid';
import { ExploreBar } from '@/components/ExploreBar';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const meRes = await api.get('/profiles/me');
      setMyProfile(meRes.data);

      let targetUsername = username;
      if (username === 'me') {
        targetUsername = meRes.data.username;
        router.replace(`/profile/${targetUsername}`);
        return;
      }

      const profileRes = await api.get(`/profiles/${targetUsername}`);
      setProfile(profileRes.data);

      const [postsRes, followersRes, followingRes] = await Promise.all([
        api.get(`/posts/user/${targetUsername}`),
        api.get(`/profiles/${targetUsername}/followers`),
        api.get(`/profiles/${targetUsername}/following`),
      ]);

      const postsData = Array.isArray(postsRes.data)
        ? postsRes.data
        : postsRes.data.data;
      // Enrich posts with user ID from profile
      const enrichedPosts = postsData.map((post: Post) => ({
        ...post,
        profile: {
          ...post.profile,
          userId: profileRes.data.userId,
        },
      }));
      setPosts(enrichedPosts);

      const followersList = Array.isArray(followersRes.data)
        ? followersRes.data
        : followersRes.data.data || [];
      const followingList = Array.isArray(followingRes.data)
        ? followingRes.data
        : followingRes.data.data || [];

      setStats({
        posts: postsData.length,
        followers: followersList.length,
        following: followingList.length,
      });

      if (meRes.data.username !== targetUsername) {
        const amIFollowing = followersList.some(
          (f: ProfileFollow) => f.follower.id === meRes.data.id,
        );
        setIsFollowing(amIFollowing);
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [username, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile || !myProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)]">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <p className="text-lg font-semibold text-[var(--text-secondary)]">
          Profile not found
        </p>
      </div>
    );
  }

  const isMyProfile = myProfile.id === profile.id;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ExploreBar />
      <main className="max-w-4xl mx-auto px-4 pb-20">
        <ProfileHeader
          profile={profile}
          isMyProfile={isMyProfile}
          isFollowing={isFollowing}
          stats={stats}
          onProfileUpdate={() => {
            loadData();
          }}
          onFollowToggle={() => {
            setIsFollowing(!isFollowing);
            setStats((prev) => ({
              ...prev,
              followers: !isFollowing
                ? prev.followers + 1
                : prev.followers - 1,
            }));
          }}
        />
        <PostsGrid
          posts={posts}
          currentUserId={myProfile?.userId}
          onPostDelete={(postId) => {
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setStats((prev) => ({
              ...prev,
              posts: prev.posts - 1,
            }));
          }}
          onPostUpdate={(updatedPost) => {
            setPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
            );
          }}
        />
      </main>
    </div>
  );
}
