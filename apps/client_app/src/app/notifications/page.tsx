// apps/client_app/src/app/notifications/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string; // 'LIKE_ON_POST', 'COMMENT_ON_POST', 'FOLLOW'
  actorProfile?: {
    username: string;
    avatarUrl: string | null;
  };
  createdAt: string;
  // Добавь другие поля если нужно
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        // Бэкенд может не возвращать actorProfile (пока нет связи в entity), 
        // проверь структуру ответа. Если нет - нужно будет доделать на бэке.
        // Предположим, что данные есть.
        setNotifications(res.data.data);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getMessage = (type: string) => {
    switch (type) {
      case 'LIKE_ON_POST': return 'liked your post';
      case 'COMMENT_ON_POST': return 'commented on your post';
      case 'FOLLOW': return 'started following you';
      default: return 'interacted with you';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto pt-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {notifications.length === 0 && (
                <div className="p-6 text-center text-gray-500">No notifications yet</div>
            )}
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 border-b last:border-none flex items-center gap-3 hover:bg-gray-50 transition">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                   {/* Внимание: если бэкенд не джойнит профиль инициатора, тут будет пусто */}
                   {/* Для MVP можно показывать иконку типа уведомления */}
                   {notif.type.includes('LIKE') ? '❤️' : '💬'}
                </div>
                <div className="flex-1 text-sm">
                  <span className="font-bold mr-1">User</span>
                  {getMessage(notif.type)}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}