'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { getAvatarUrl } from '@/lib/url-helper';
import { Profile } from '@/types';
import { EditProfileModal } from './EditProfileModal';

interface ProfileHeaderProps {
  profile: Profile;
  isMyProfile: boolean;
  isFollowing: boolean;
  stats: { posts: number; followers: number; following: number };
  onFollowToggle: () => void;
  onProfileUpdate?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isMyProfile,
  isFollowing,
  stats,
  onFollowToggle,
  onProfileUpdate,
}) => {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const avatarUrl = getAvatarUrl(profile.avatarUrl);

  // Check if this user is blocked
  useEffect(() => {
    if (isMyProfile) return;
    const checkBlocked = async () => {
      try {
        const res = await api.get('/profiles/me/blocked');
        const blockedList: Profile[] = res.data || [];
        setIsBlocked(blockedList.some((b) => b.id === profile.id));
      } catch {
        // ignore
      }
    };
    checkBlocked();
  }, [profile.id, isMyProfile]);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMessageClick = async () => {
    if (messageLoading) return;
    setMessageLoading(true);
    try {
      const response = await api.post('/chats', {
        type: 'private',
        targetUsername: profile.username,
      });
      router.push(`/chat?chatId=${response.data.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Cannot start chat';
      alert(errorMessage);
      router.push('/chat');
    } finally {
      setMessageLoading(false);
    }
  };

  const handleFollowAction = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/profiles/${profile.username}/follow`);
      } else {
        await api.post(`/profiles/${profile.username}/follow`);
      }
      onFollowToggle();
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (blockLoading) return;
    setBlockLoading(true);
    setShowMenu(false);
    try {
      if (isBlocked) {
        await api.delete(`/profiles/${profile.username}/block`);
        setIsBlocked(false);
      } else {
        if (!confirm(`Block @${profile.username}? This will also remove any follow connections.`)) {
          setBlockLoading(false);
          return;
        }
        await api.post(`/profiles/${profile.username}/block`);
        setIsBlocked(true);
        if (onProfileUpdate) onProfileUpdate();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Action failed';
      alert(msg);
    } finally {
      setBlockLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col md:flex-row items-center gap-8 mb-8 p-6 rounded-2xl animate-fade-in"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Avatar */}
      <div
        className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shrink-0"
        style={{
          background: 'var(--bg-elevated)',
          border: '3px solid var(--border)',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={profile.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-5xl font-bold"
            style={{ color: 'var(--text-muted)' }}
          >
            {profile.username?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col items-center md:items-start">
        {/* Username row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap justify-center md:justify-start">
          <h2
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {profile.username}
          </h2>

          {isMyProfile ? (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background =
                    'var(--bg-input)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background =
                    'var(--bg-elevated)';
                }}
              >
                Edit Profile
              </button>
              <Link
                href="/settings"
                className="p-1.5 rounded-lg transition-colors flex items-center justify-center"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="flex gap-2 items-center">
              {!isBlocked && (
                <>
                  <button
                    onClick={handleFollowAction}
                    disabled={followLoading}
                    className="px-6 py-1.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
                    style={{
                      background: isFollowing
                        ? 'var(--bg-elevated)'
                        : 'var(--accent)',
                      color: isFollowing
                        ? 'var(--text-primary)'
                        : '#fff',
                      border: isFollowing
                        ? '1px solid var(--border)'
                        : 'none',
                    }}
                  >
                    {followLoading ? (
                      <div
                        className="w-4 h-4 border-2 rounded-full animate-spin mx-auto"
                        style={{
                          borderColor: 'transparent',
                          borderTopColor: 'currentColor',
                        }}
                      />
                    ) : isFollowing ? (
                      'Following'
                    ) : (
                      'Follow'
                    )}
                  </button>
                  <button
                    onClick={handleMessageClick}
                    disabled={messageLoading}
                    className="px-4 py-1.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {messageLoading ? 'Loading...' : 'Message'}
                  </button>
                </>
              )}

              {/* More options menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>

                {showMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <button
                      onClick={handleBlockToggle}
                      disabled={blockLoading}
                      className="w-full text-left px-4 py-3 text-sm font-semibold transition-colors hover:opacity-80 disabled:opacity-50"
                      style={{
                        color: isBlocked
                          ? 'var(--text-primary)'
                          : '#ef4444',
                      }}
                    >
                      {blockLoading
                        ? 'Loading...'
                        : isBlocked
                          ? 'Unblock user'
                          : 'Block user'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Blocked banner */}
        {isBlocked && !isMyProfile && (
          <div
            className="w-full mb-4 px-4 py-2 rounded-lg text-sm font-semibold text-center"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            You have blocked this user
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-8 mb-4 text-sm md:text-base">
          <div style={{ color: 'var(--text-primary)' }}>
            <span className="font-bold">{stats.posts}</span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              posts
            </span>
          </div>
          <Link
            href={`/profile/${profile.username}/followers`}
            className="transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="font-bold">{stats.followers}</span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              followers
            </span>
          </Link>
          <Link
            href={`/profile/${profile.username}/following`}
            className="transition-opacity hover:opacity-80"
            style={{ color: 'var(--text-primary)' }}
          >
            <span className="font-bold">{stats.following}</span>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              following
            </span>
          </Link>
        </div>

        {/* Display name + bio */}
        <div className="text-sm md:text-left text-center">
          {profile.displayName && (
            <p
              className="font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              {profile.displayName}
            </p>
          )}
          {profile.bio && (
            <p
              className="whitespace-pre-wrap"
              style={{ color: 'var(--text-secondary)' }}
            >
              {profile.bio}
            </p>
          )}
          {!profile.isPublic && (
            <span
              className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect
                  x="3"
                  y="11"
                  width="18"
                  height="11"
                  rx="2"
                  ry="2"
                />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Private account
            </span>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {isEditModalOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={() => {
            if (onProfileUpdate) onProfileUpdate();
          }}
        />
      )}
    </div>
  );
};
