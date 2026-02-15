'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { AxiosError } from 'axios';
import { Profile, Chat } from '@/types';
import { Avatar } from '@/components/ui/Avatar';

interface SharePostModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SharePostModal: React.FC<SharePostModalProps> = ({
  postId,
  isOpen,
  onClose,
}) => {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const loadFriends = async () => {
      setLoading(true);
      try {
        const res = await api.get('/profiles/me/friends');
        setFriends(res.data || []);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    loadFriends();
    setSent([]);
    setSearch('');
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFriends = search.trim()
    ? friends.filter(
        (f) =>
          f.username.toLowerCase().includes(search.toLowerCase()) ||
          (f.displayName?.toLowerCase().includes(search.toLowerCase()) ??
            false),
      )
    : friends;

  const handleSend = async (friend: Profile) => {
    if (sending || sent.includes(friend.id)) return;
    setSending(friend.id);
    try {
      const chatRes = await api.post<Chat>('/chats', {
        type: 'private',
        targetUsername: friend.username,
      });

      await api.post(`/chats/${chatRes.data.id}/messages`, {
        postId: postId,
      });

      setSent((prev) => [...prev, friend.id]);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const msg = axiosError.response?.data?.message || 'Failed to send';
      alert(msg);
    } finally {
      setSending(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/posts/${postId}`,
    );
    alert('Link copied!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div
        className="relative w-full max-w-md max-h-[80vh] rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <h3
            className="font-bold text-lg"
            style={{ color: 'var(--text-primary)' }}
          >
            Share to...
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-4 pb-2">
          <input
            type="text"
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div
              className="text-center py-8 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {search ? 'No friends found' : 'No friends to share with'}
            </div>
          ) : (
            filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Avatar
                    src={friend.avatarUrl}
                    alt={friend.username}
                    size="md"
                    className="w-10 h-10"
                  />
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {friend.displayName || friend.username}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      @{friend.username}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleSend(friend)}
                  disabled={
                    sending === friend.id || sent.includes(friend.id)
                  }
                  className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all disabled:opacity-60"
                  style={{
                    background: sent.includes(friend.id)
                      ? '#22c55e'
                      : 'var(--accent)',
                    color: '#fff',
                  }}
                >
                  {sending === friend.id
                    ? 'Sending...'
                    : sent.includes(friend.id)
                      ? 'Sent!'
                      : 'Send'}
                </button>
              </div>
            ))
          )}
        </div>

        <div
          className="p-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
};
