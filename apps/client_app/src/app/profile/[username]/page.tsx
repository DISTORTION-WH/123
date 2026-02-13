'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/axios';
import { Profile, Post, ProfileFollow } from '@/types';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostsGrid } from '@/components/profile/PostsGrid';

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
      const meRes = await api.get<Profile>('/profiles/me');
      setMyProfile(meRes.data);

      let targetUsername = username;
      if (username === 'me') {
        targetUsername = meRes.data.username;
        router.replace(`/profile/${targetUsername}`);
        return;
      }

      const profileRes = await api.get<Profile>(
        `/profiles/${targetUsername}`,
      );
      setProfile(profileRes.data);

      const [postsRes, followersRes, followingRes] = await Promise.all([
        api.get<{ data: Post[]; meta: unknown }>(
          `/posts/user/${targetUsername}`,
        ),
        api.get<ProfileFollow[]>(
          `/profiles/${targetUsername}/followers`,
        ),
        api.get<ProfileFollow[]>(
          `/profiles/${targetUsername}/following`,
        ),
      ]);

      const postsData = Array.isArray(postsRes.data)
        ? postsRes.data
        : postsRes.data.data;
      setPosts(postsData);

      const followersList = Array.isArray(followersRes.data)
        ? followersRes.data
        : [];
      const followingList = Array.isArray(followingRes.data)
        ? followingRes.data
        : [];

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Navbar />
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'var(--border)',
            borderTopColor: 'var(--accent)',
          }}
        />
      </div>
    );
  }

  if (!profile || !myProfile) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <Navbar />
        <div
          className="text-center p-10"
          style={{ color: 'var(--text-secondary)' }}
        >
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
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p className="text-lg font-semibold">Profile not found</p>
        </div>
      </div>
    );
  }

  const isMyProfile = myProfile.id === profile.id;

  return (
    <div
      className="min-h-screen pb-16 md:pb-0"
      style={{ background: 'var(--bg-primary)' }}
    >
      <Navbar />
      <main className="max-w-4xl mx-auto pt-8 px-4 pb-20 md:pl-[72px]">
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
        <PostsGrid posts={posts} />
      </main>
    </div>
  );
}
