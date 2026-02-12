// apps/client_app/src/app/profile/[username]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation'; // Важно для App Router
import Navbar from '@/components/Navbar';
import { api } from '@/lib/axios';
import { Profile, Post } from '@/types';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostsGrid } from '@/components/profile/PostsGrid';

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string; // 'me' или реальный username

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. Кто я?
        const meRes = await api.get<Profile>('/profiles/me');
        setMyProfile(meRes.data);

        // 2. Чей профиль смотрим?
        // Если username == 'me', используем myProfile, иначе грузим по username
        const targetUsername = username === 'me' ? meRes.data.username : username;
        
        const profileRes = await api.get<Profile>(`/profiles/${targetUsername}`);
        setProfile(profileRes.data);

        // 3. Посты юзера
        // Убедись что бэкенд поддерживает /posts/user/:username
        const postsRes = await api.get<Post[]>(`/posts/user/${targetUsername}`);
        setPosts(postsRes.data);
        setStats(prev => ({ ...prev, posts: postsRes.data.length }));

        // 4. Подписки/Подписчики (для статистики)
        const followersRes = await api.get(`/profiles/${targetUsername}/followers`);
        const followingRes = await api.get(`/profiles/${targetUsername}/following`);
        
        setStats(prev => ({ 
            ...prev, 
            followers: followersRes.data.length,
            following: followingRes.data.length
        }));

        // 5. Подписан ли я? (Если это не я)
        if (username !== 'me' && meRes.data.username !== targetUsername) {
            // Проверяем, есть ли я в списке его фолловеров
            // В реальном проекте лучше отдельное поле isFollowing в GET /profile
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const amIFollowing = followersRes.data.some((f: any) => f.follower.id === meRes.data.id);
            setIsFollowing(amIFollowing);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [username]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!profile || !myProfile) return <div className="text-center p-10">Profile not found</div>;

  const isMyProfile = myProfile.id === profile.id;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-4xl mx-auto pt-8 px-4 pb-20">
        <ProfileHeader 
            profile={profile} 
            isMyProfile={isMyProfile}
            isFollowing={isFollowing}
            stats={stats}
            onProfileUpdate={() => {
            window.location.reload();
    }}
            onFollowToggle={() => {
                setIsFollowing(!isFollowing);
                setStats(prev => ({
                    ...prev,
                    followers: !isFollowing ? prev.followers + 1 : prev.followers - 1
                }));
            }}
        />
        <PostsGrid posts={posts} />
      </main>
    </div>
  );
}