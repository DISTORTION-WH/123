'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';
import { Chat, Profile } from '@/types';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import Link from 'next/link';

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/profiles/me');
        setMyProfile(profileRes.data);

        const chatsRes = await api.get('/chats');
        const raw = chatsRes.data;
        const loadedChats = Array.isArray(raw) ? raw : (raw.data || []);
        setChats(loadedChats);

        const chatId = searchParams.get('chatId');
        if (chatId) {
          const chat = loadedChats.find((c: Chat) => c.id === chatId);
          if (chat) {
            setActiveChat(chat);
          }
        }
      } catch (err) {
        console.error('Failed to load chat data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) setActiveChat(chat);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex overflow-hidden rounded-xl border"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-card)',
        height: 'calc(100vh - 120px)',
      }}
    >
      <div
        className="w-80 flex-shrink-0 flex flex-col border-r"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-secondary)',
        }}
      >
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}
        >
          <h2
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Messages
          </h2>
          <Link
            href="/chat/create"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ color: 'var(--accent)' }}
            title="New chat"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
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
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        </div>

        <div
          className="px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
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
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <p
                className="text-sm mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                No conversations yet
              </p>
              <Link
                href="/chat/create"
                className="px-5 py-2 text-white rounded-full text-sm font-semibold transition-colors"
                style={{ background: 'var(--accent)' }}
              >
                Start a chat
              </Link>
            </div>
          ) : (
            <ChatList
              chats={chats}
              activeChatId={activeChat?.id || null}
              onSelectChat={handleSelectChat}
              currentUserId={myProfile?.userId || ''}
            />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {activeChat && myProfile ? (
          <ChatWindow
            chat={activeChat}
            currentUserId={myProfile.userId}
            socket={socket}
          />
        ) : (
          <div
            className="flex-1 flex flex-col items-center justify-center text-center"
            style={{ background: 'var(--bg-primary)' }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: 'var(--text-secondary)' }}
            >
              Select a conversation
            </h3>
            <p
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Choose a chat to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
