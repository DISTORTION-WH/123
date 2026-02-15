'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/axios';
import { Profile, ProfileFollow } from '@/types';
import { getAvatarUrl } from '@/lib/url-helper';

export default function FollowersPage() {
  const params = useParams();
  const router = useRouter();
  const username = params?.username as string;

  const [followers, setFollowers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [meRes, followersRes, myFollowingRes] = await Promise.all([
          api.get('/profiles/me'),
          api.get(`/profiles/${username}/followers`),
          api.get('/profiles/me/following'),
        ]);

        setMyProfile(meRes.data);

        const followersList: ProfileFollow[] = Array.isArray(followersRes.data)
          ? followersRes.data
          : followersRes.data.data || [];
        setFollowers(followersList.map((f) => f.follower));

        const myFollowingList: ProfileFollow[] = Array.isArray(myFollowingRes.data)
          ? myFollowingRes.data
          : myFollowingRes.data.data || [];
        const map: Record<string, boolean> = {};
        myFollowingList.forEach((f) => {
          map[f.following.id] = true;
        });
        setFollowingMap(map);
      } catch (err) {
        console.error('Failed to load followers', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const handleFollowToggle = async (profile: Profile) => {
    if (actionLoading) return;
    setActionLoading(profile.id);
    try {
      if (followingMap[profile.id]) {
        await api.delete(`/profiles/${profile.username}/follow`);
        setFollowingMap((prev) => {
          const next = { ...prev };
          delete next[profile.id];
          return next;
        });
      } else {
        await api.post(`/profiles/${profile.username}/follow`);
        setFollowingMap((prev) => ({ ...prev, [profile.id]: true }));
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFollower = async (profile: Profile) => {
    if (actionLoading) return;
    if (!confirm(`Remove @${profile.username} from your followers?`)) return;
    setActionLoading(profile.id);
    try {
      await api.delete(`/profiles/me/followers/${profile.username}`);
      setFollowers((prev) => prev.filter((f) => f.id !== profile.id));
    } catch (err) {
      console.error('Remove follower failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const isMyProfile = myProfile?.username === username;

  return (
    <div className="max-w-2xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'var(--bg-elevated)' }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-bold">Followers</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            @{username}
          </p>
        </div>
      </div>

      {/* List */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          </div>
        ) : followers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No followers yet
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {followers.map((profile) => {
              const avatarUrl = getAvatarUrl(profile.avatarUrl);
              const isMe = myProfile?.id === profile.id;
              const amFollowing = followingMap[profile.id];

              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {/* Avatar */}
                  <Link
                    href={`/profile/${profile.username}`}
                    className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                    style={{
                      background: avatarUrl ? 'transparent' : 'var(--accent)',
                    }}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {profile.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>

                  {/* User info */}
                  <Link
                    href={`/profile/${profile.username}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {profile.displayName || profile.username}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                      @{profile.username}
                    </p>
                  </Link>

                  {/* Actions */}
                  {!isMe && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleFollowToggle(profile)}
                        disabled={actionLoading === profile.id}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        style={{
                          background: amFollowing
                            ? 'var(--bg-elevated)'
                            : 'var(--accent)',
                          color: amFollowing
                            ? 'var(--text-primary)'
                            : '#fff',
                          border: amFollowing
                            ? '1px solid var(--border)'
                            : 'none',
                        }}
                      >
                        {amFollowing ? 'Following' : 'Follow'}
                      </button>
                      {isMyProfile && (
                        <button
                          onClick={() => handleRemoveFollower(profile)}
                          disabled={actionLoading === profile.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          style={{
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
