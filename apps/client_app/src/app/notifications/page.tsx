'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Notification } from '@/types';
import { ExploreBar } from '@/components/ExploreBar';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent)">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        );
      case 'comment':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        );
      case 'follow':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="9.5" cy="7" r="4" />
            <path d="M22 16c0-1-1-2-2-2m2 0a3 3 0 010 6m0-6v6" />
          </svg>
        );
      default:
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        );
    }
  };

  const getMessage = (type: string) => {
    switch (type) {
      case 'like':
        return 'liked your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'started following you';
      case 'subscription':
        return 'subscribed to you';
      default:
        return 'interacted with you';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ExploreBar />
      <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
          Notifications
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{
                borderColor: 'var(--accent)',
                borderTopColor: 'transparent',
              }}
            />
            <p
              className="mt-4 text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Loading notifications...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
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
              <path d="M18 8a6 6 0 0 0-6-6H6a6 6 0 0 0-6 6v10a6 6 0 0 0 6 6h6a6 6 0 0 0 6-6v-3" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
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
              You&apos;ll see notifications when people interact with you
            </p>
          </div>
        ) : (
          <div className="space-y-0 rounded-xl overflow-hidden border border-[var(--border)]">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-[var(--bg-elevated)]">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm">
                      <span className="font-semibold">
                        {typeof notif.data === 'object' && notif.data?.actorName ? String(notif.data.actorName) : 'Someone'}
                      </span>{' '}
                      {getMessage(notif.type)}
                    </p>
                    {notif.message && (
                      <p className="text-[var(--text-secondary)] text-sm mt-1 truncate">
                        {notif.message}
                      </p>
                    )}
                    <p className="text-[var(--text-muted)] text-xs mt-2">
                      {formatDistanceToNow(new Date(notif.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {notif.data && typeof notif.data === 'object' && 'link' in notif.data && (
                    <Link
                      href={String((notif.data as Record<string, unknown>).link)}
                      className="flex-shrink-0 text-[var(--accent)] hover:text-[var(--accent-hover)]"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
