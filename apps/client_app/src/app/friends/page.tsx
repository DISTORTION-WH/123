'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { Profile, ProfileFollow } from '@/types';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';

type TabType = 'friends' | 'followers' | 'following' | 'requests' | 'blocked';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<ProfileFollow[]>([]);
  const [blocked, setBlocked] = useState<Profile[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [followersRes, followingRes, requestsRes, blockedRes] =
          await Promise.all([
            api.get('/profiles/me/followers'),
            api.get('/profiles/me/following'),
            api.get('/profiles/me/follow-requests'),
            api.get('/profiles/me/blocked'),
          ]);

        const followersList: Profile[] = followersRes.data.map(
          (f: { follower: Profile }) => f.follower,
        );
        const followingList: Profile[] = followingRes.data.map(
          (f: { following: Profile }) => f.following,
        );

        const friendsList = followersList.filter((follower) =>
          followingList.some((f) => f.id === follower.id),
        );

        setFriends(friendsList);
        setFollowers(followersList);
        setFollowing(followingList);
        setRequests(requestsRes.data || []);
        setBlocked(blockedRes.data || []);
      } catch {
        // Failed to load data
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  const handleAcceptRequest = async (username: string) => {
    try {
      await api.post(`/profiles/follow-requests/${username}/accept`);
      const accepted = requests.find((r) => r.follower.username === username);
      setRequests((prev) =>
        prev.filter((r) => r.follower.username !== username),
      );
      if (accepted) {
        setFollowers((prev) => [...prev, accepted.follower]);
      }
    } catch {
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (username: string) => {
    try {
      await api.delete(`/profiles/follow-requests/${username}`);
      setRequests((prev) =>
        prev.filter((r) => r.follower.username !== username),
      );
    } catch {
      alert('Failed to reject request');
    }
  };

  const handleUnblock = async (username: string) => {
    try {
      await api.delete(`/profiles/${username}/block`);
      setBlocked((prev) => prev.filter((u) => u.username !== username));
    } catch {
      alert('Failed to unblock user');
    }
  };

  const renderUserList = (users: Profile[]) => {
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
              <Avatar
                src={user.avatarUrl}
                alt={user.username}
                size="lg"
                className="w-12 h-12"
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
              {activeTab === 'blocked' && (
                <button
                  onClick={() => handleUnblock(user.username)}
                  className="px-4 py-1 bg-green-500 text-white rounded-full text-sm hover:bg-green-600 transition-colors font-semibold"
                >
                  Unblock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRequests = () => {
    if (requests.length === 0) {
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
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <p style={{ color: 'var(--text-muted)' }}>No pending requests</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="p-4 rounded-lg flex items-center justify-between"
            style={{ background: 'var(--bg-card)' }}
          >
            <Link
              href={`/profile/${request.follower.username}`}
              className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
            >
              <Avatar
                src={request.follower.avatarUrl}
                alt={request.follower.username}
                size="lg"
                className="w-12 h-12"
              />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">
                  {request.follower.displayName || request.follower.username}
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  @{request.follower.username}
                </p>
              </div>
            </Link>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleAcceptRequest(request.follower.username)
                }
                className="px-4 py-1 bg-[var(--accent)] text-white rounded-full text-sm hover:opacity-90 transition-opacity font-semibold"
              >
                Accept
              </button>
              <button
                onClick={() =>
                  handleRejectRequest(request.follower.username)
                }
                className="px-4 py-1 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition-colors font-semibold"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'friends', label: 'Friends', count: friends.length },
    { key: 'followers', label: 'Followers', count: followers.length },
    { key: 'following', label: 'Following', count: following.length },
    { key: 'requests', label: 'Requests', count: requests.length },
    { key: 'blocked', label: 'Blocked', count: blocked.length },
  ];

  return (
    <div className="max-w-4xl mx-auto" style={{ color: 'var(--text-primary)' }}>
      <h1 className="text-3xl font-bold mb-8">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[var(--border)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-1.5 text-xs bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'friends' && renderUserList(friends)}
      {activeTab === 'followers' && renderUserList(followers)}
      {activeTab === 'following' && renderUserList(following)}
      {activeTab === 'requests' && renderRequests()}
      {activeTab === 'blocked' && renderUserList(blocked)}
    </div>
  );
}
