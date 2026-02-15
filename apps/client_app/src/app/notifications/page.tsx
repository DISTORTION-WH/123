'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import Image from 'next/image';
import { Notification } from '@/types';
import { getAvatarUrl } from '@/lib/url-helper';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.data || []);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await api.patch(`/notifications/${notifId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notifId ? { ...n, isRead: true } : n,
        ),
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true })),
      );
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIconBadge = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#ef4444' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#3b82f6' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
        );
      case 'follow':
        return (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#22c55e' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
            </svg>
          </div>
        );
      default:
        return (
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            </svg>
          </div>
        );
    }
  };

  const getNotifLink = (notif: Notification): string | null => {
    if (!notif.data || typeof notif.data !== 'object') return null;
    const data = notif.data as Record<string, unknown>;
    if (data.link) return String(data.link);
    if (data.actorUsername) return `/profile/${data.actorUsername}`;
    return null;
  };

  const getActorAvatar = (notif: Notification): string | null => {
    if (!notif.data || typeof notif.data !== 'object') return null;
    const data = notif.data as Record<string, unknown>;
    return getAvatarUrl(data.actorAvatar as string | null | undefined);
  };

  const getActorInitial = (notif: Notification): string => {
    if (!notif.data || typeof notif.data !== 'object') return '?';
    const data = notif.data as Record<string, unknown>;
    const name = (data.actorUsername || data.actorName || '?') as string;
    return name.charAt(0).toUpperCase();
  };

  return (
    <div
      className="max-w-2xl mx-auto"
      style={{ color: 'var(--text-primary)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p
              className="text-sm mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              color: 'var(--accent)',
              border: '1px solid var(--border)',
            }}
          >
            {markingAll ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
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
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
          <p
            className="text-lg font-semibold mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            No notifications yet
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            You&apos;ll see notifications when people interact with
            you
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          {notifications.map((notif) => {
            const link = getNotifLink(notif);
            const actorAvatar = getActorAvatar(notif);
            const actorInitial = getActorInitial(notif);

            const content = (
              <div
                className={`flex items-start gap-3 px-4 py-3 border-b transition-colors ${
                  !notif.isRead
                    ? 'bg-[var(--bg-elevated)]'
                    : ''
                }`}
                style={{ borderColor: 'var(--border)' }}
                onClick={() => {
                  if (!notif.isRead) handleMarkAsRead(notif.id);
                }}
              >
                <div className="flex-shrink-0 relative">
                  {actorAvatar ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={actorAvatar}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: 'var(--accent)' }}
                    >
                      {actorInitial}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1">
                    {getIconBadge(notif.type)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    {notif.message}
                  </p>
                  {(() => {
                    const d = notif.data as Record<string, unknown> | undefined;
                    if (d?.commentText) {
                      return (
                        <p
                          className="text-xs mt-1 truncate"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          &quot;{String(d.commentText)}&quot;
                        </p>
                      );
                    }
                    return null;
                  })()}
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {formatDistanceToNow(
                      new Date(notif.createdAt),
                      { addSuffix: true },
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notif.isRead && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                  {link && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{
                        color: 'var(--text-muted)',
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              </div>
            );

            if (link) {
              return (
                <Link
                  key={notif.id}
                  href={link}
                  className="block hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={notif.id}
                className="cursor-default"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
