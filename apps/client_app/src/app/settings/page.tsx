'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import { Profile } from '@/types';
import { getAvatarUrl } from '@/lib/url-helper';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, getCurrentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [blockedUsers, setBlockedUsers] = useState<Profile[]>([]);
  const [blockedLoading, setBlockedLoading] = useState(false);
  const [unblockLoading, setUnblockLoading] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profiles/me');
        const p: Profile = res.data;
        setProfile(p);
        setDisplayName(p.displayName || '');
        setBio(p.bio || '');
        setUsername(p.username || '');
        setIsPublic(p.isPublic ?? true);
        setAvatarPreview(getAvatarUrl(p.avatarUrl));
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchBlocked = async () => {
      setBlockedLoading(true);
      try {
        const res = await api.get('/profiles/me/blocked');
        setBlockedUsers(res.data || []);
      } catch (err) {
        console.error('Failed to load blocked users', err);
      } finally {
        setBlockedLoading(false);
      }
    };
    fetchBlocked();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({
        type: 'error',
        text: 'File size must be less than 5MB',
      });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        await api.patch('/profiles/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAvatarFile(null);
      }

      const updateData: Record<string, unknown> = {
        displayName,
        bio,
        isPublic,
      };

      if (username !== profile?.username) {
        updateData.username = username;
      }

      const res = await api.patch('/profiles/me', updateData);
      setProfile(res.data);
      setSaveMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
      await getCurrentUser();

      if (username !== profile?.username && res.data.username) {
        router.replace(`/profile/${res.data.username}`);
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string | string[] }>;
      const msg =
        axiosError.response?.data?.message || 'Failed to update profile';
      setSaveMessage({
        type: 'error',
        text: Array.isArray(msg) ? msg[0] : msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (blockedProfile: Profile) => {
    setUnblockLoading(blockedProfile.id);
    try {
      await api.delete(`/profiles/${blockedProfile.username}/block`);
      setBlockedUsers((prev) =>
        prev.filter((u) => u.id !== blockedProfile.id),
      );
    } catch (err) {
      console.error('Unblock failed', err);
    } finally {
      setUnblockLoading(null);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete('/profiles/me');
      await logout();
      router.push('/auth/login');
    } catch (err) {
      console.error('Delete account failed', err);
      setSaveMessage({
        type: 'error',
        text: 'Failed to delete account',
      });
      setDeleteLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="max-w-2xl mx-auto"
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="flex items-center gap-3 mb-8">
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
          <h1 className="text-2xl font-bold">Settings</h1>
          <p
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Manage your account and preferences
          </p>
        </div>
      </div>

      {saveMessage && (
        <div
          className="mb-6 p-3 rounded-lg text-sm font-medium"
          style={{
            background:
              saveMessage.type === 'success'
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
            color:
              saveMessage.type === 'success' ? '#22c55e' : '#ef4444',
            border: `1px solid ${
              saveMessage.type === 'success'
                ? 'rgba(34, 197, 94, 0.3)'
                : 'rgba(239, 68, 68, 0.3)'
            }`,
          }}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="space-y-6">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold">Profile</h2>
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer group flex-shrink-0"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '2px solid var(--border)',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Avatar"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {username?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleAvatarChange}
              />
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold transition-colors"
                  style={{ color: 'var(--accent)' }}
                >
                  Change Photo
                </button>
                {avatarFile && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    New photo selected - save to apply
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="username"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-lg px-3 py-2.5 text-sm"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Your display name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="rounded-lg px-3 py-2.5 h-20 resize-none text-sm"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
                placeholder="Tell something about yourself..."
                maxLength={500}
              />
              <div
                className="text-right text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                {bio.length}/500
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="rounded-lg px-3 py-2.5 text-sm cursor-not-allowed opacity-60"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              style={{
                background: 'var(--accent)',
                color: '#fff',
              }}
            >
              {saving && (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin"
                  style={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                  }}
                />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold">Privacy & Safety</h2>
          </div>

          <div
            className="divide-y"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Private Account</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Only approved followers can see your posts
                </p>
              </div>
              <button
                onClick={() => setIsPublic(!isPublic)}
                className="relative w-11 h-6 rounded-full transition-colors flex-shrink-0"
                style={{
                  background: !isPublic
                    ? 'var(--accent)'
                    : 'var(--bg-secondary)',
                }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: 'white',
                    transform: !isPublic
                      ? 'translateX(22px)'
                      : 'translateX(2px)',
                  }}
                />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">Blocked Users</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {blockedUsers.length} blocked
                  </p>
                </div>
              </div>
              {blockedLoading ? (
                <div className="flex justify-center py-4">
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
                </div>
              ) : blockedUsers.length === 0 ? (
                <p
                  className="text-xs py-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  You havent blocked anyone
                </p>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map((blockedUser) => {
                    const bAvatarUrl = getAvatarUrl(
                      blockedUser.avatarUrl,
                    );
                    return (
                      <div
                        key={blockedUser.id}
                        className="flex items-center gap-3 p-2 rounded-lg"
                        style={{ background: 'var(--bg-elevated)' }}
                      >
                        <Link
                          href={`/profile/${blockedUser.username}`}
                          className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                          style={{
                            background: bAvatarUrl
                              ? 'transparent'
                              : 'var(--accent)',
                          }}
                        >
                          {bAvatarUrl ? (
                            <Image
                              src={bAvatarUrl}
                              alt=""
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-white text-xs font-bold">
                              {blockedUser.username
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </Link>
                        <Link
                          href={`/profile/${blockedUser.username}`}
                          className="flex-1 min-w-0"
                        >
                          <p className="text-sm font-semibold truncate">
                            @{blockedUser.username}
                          </p>
                        </Link>
                        <button
                          onClick={() => handleUnblock(blockedUser)}
                          disabled={
                            unblockLoading === blockedUser.id
                          }
                          className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                          style={{
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          Unblock
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {profile && (
              <Link
                href={`/profile/${profile.username}/followers`}
                className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">
                    Manage Followers
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    View and remove followers
                  </p>
                </div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-lg font-bold">Account</h2>
          </div>

          <div
            className="divide-y"
            style={{ borderColor: 'var(--border)' }}
          >
            <Link
              href="/friends"
              className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
                <p className="font-medium text-sm">Friends</p>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            <Link
              href="/notifications"
              className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                <p className="font-medium text-sm">Notifications</p>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--text-secondary)' }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>

        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}
          >
            <h2
              className="text-lg font-bold"
              style={{ color: '#ef4444' }}
            >
              Danger Zone
            </h2>
          </div>

          <div className="p-6">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                }}
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Are you sure? This action will deactivate your
                  account. This cannot be easily undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-60"
                    style={{ background: '#ef4444' }}
                  >
                    {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors"
                    style={{
                      background: 'var(--bg-elevated)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full py-3 rounded-xl font-bold text-sm transition-opacity disabled:opacity-60"
          style={{
            background: 'var(--bg-card)',
            color: '#ef4444',
            border: '1px solid var(--border)',
          }}
        >
          {isLoading ? 'Logging out...' : 'Log Out'}
        </button>

        <div
          className="text-center text-xs pb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <p>Innogram v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
