'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { Profile } from '@/types';
import Link from 'next/link';
import { getAvatarUrl } from '@/lib/url-helper';

interface FriendProfile extends Profile {
  isFollowing?: boolean;
  isFollowingMe?: boolean;
  isFriend?: boolean;
}

export default function FriendsPage() {
  const { } = useAuth();
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [followers, setFollowers] = useState<FriendProfile[]>([]);
  const [following, setFollowing] = useState<FriendProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'friends' | 'followers' | 'following'>('friends');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriends = async () => {
      try {
        setLoading(true);

        // Load followers and following
        const [followersRes, followingRes] = await Promise.all([
          api.get('/profiles/me/followers'),
          api.get('/profiles/me/following'),
        ]);

        const followersList: Profile[] = followersRes.data.map((f: { follower: Profile }) => f.follower);
        const followingList: Profile[] = followingRes.data.map((f: { following: Profile }) => f.following);

        // Find friends (mutual follows)
        const friendsList = followersList.filter((follower) =>
          followingList.some((following) => following.id === follower.id)
        );

        setFriends(friendsList);
        setFollowers(followersList);
        setFollowing(followingList);
      } catch {
        // Failed to load friends
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, []);

  const handleRemoveFriend = async (profileId: string, username: string) => {
    if (!confirm(`Remove ${username} from friends?`)) return;

    try {
      await api.delete(`/profiles/${username}/follow`);
      setFriends((prev) => prev.filter((f) => f.id !== profileId));
      setFollowing((prev) => prev.filter((f) => f.id !== profileId));
    } catch {
      alert('Failed to remove friend');
    }
  };

  const handleRemoveFollower = async (username: string) => {
    if (!confirm(`Remove ${username} as follower?`)) return;

    try {
      await api.delete(`/profiles/me/followers/${username}`);
      setFollowers((prev) => prev.filter((f) => f.username !== username));
      setFriends((prev) => prev.filter((f) => f.username !== username));
    } catch {
      alert('Failed to remove follower');
    }
  };

  const renderUserList = (users: FriendProfile[]) => {
    if (users.length === 0) {
      return (
        <div className="text-center py-12">
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
          <p style={{ color: 'var(--text-muted)' }}>No users yet</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 rounded-lg flex items-center justify-between"
            style={{ background: 'var(--bg-card)' }}
          >
            <Link
              href={`/profile/${user.username}`}
              className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
            >
              <img
                src={getAvatarUrl(user.avatarUrl) || ''}
                alt={user.username}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><circle cx="12" cy="12" r="12"/><path fill="white" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle fill="white" cx="12" cy="7" r="4"/></svg>`;
                }}
              />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">
                  {user.displayName || user.username}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  @{user.username}
                </p>
              </div>
            </Link>

            <div className="flex gap-2">
              {activeTab === 'friends' && (
                <button
                  onClick={() => handleRemoveFriend(user.id, user.username)}
                  className="px-4 py-1 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors font-semibold"
                >
                  Remove
                </button>
              )}
              {activeTab === 'followers' && (
                <button
                  onClick={() => handleRemoveFollower(user.username)}
                  className="px-4 py-1 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors font-semibold"
                >
                  Remove
                </button>
              )}
              {activeTab === 'following' && (
                <button
                  onClick={() => handleRemoveFriend(user.id, user.username)}
                  className="px-4 py-1 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600 transition-colors font-semibold"
                >
                  Unfollow
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto" style={{ color: 'var(--text-primary)' }}>
        <h1 className="text-3xl font-bold mb-8">Friends</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-[var(--border)]">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'friends'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'followers'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'following'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'friends' && renderUserList(friends)}
        {activeTab === 'followers' && renderUserList(followers)}
        {activeTab === 'following' && renderUserList(following)}
    </div>
  );
}
