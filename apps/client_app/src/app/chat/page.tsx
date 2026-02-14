'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';
import { Chat, Profile } from '@/types';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ExploreBar } from '@/components/ExploreBar';
import Link from 'next/link';

export default function ChatPage() {
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
        setChats(chatsRes.data.data || []);
      } catch (err) {
        console.error('Failed to load chat data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) setActiveChat(chat);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ExploreBar />
      <div className="max-w-7xl mx-auto h-[calc(100vh-96px)] flex flex-col md:flex-row">
        {/* Left Sidebar - Chat List */}
        <div className="w-full md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Messages
              </h2>
              <Link
                href="/chat/create"
                className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
                title="Create new chat"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-[var(--accent)]"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Link>
            </div>

            {/* Search */}
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            />
          </div>

          {/* Chats List */}
          <div className="flex-1 overflow-y-auto">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mb-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <p className="text-[var(--text-secondary)] mb-4">
                  No conversations yet
                </p>
                <Link
                  href="/chat/create"
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-full font-semibold hover:bg-[var(--accent-hover)] transition-colors"
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

        {/* Right Side - Chat Window */}
        <div className="hidden md:flex flex-1 flex-col">
          {activeChat && myProfile ? (
            <ChatWindow
              chat={activeChat}
              currentUserId={myProfile.userId}
              socket={socket}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-[var(--text-secondary)] mb-2">
                Select a conversation
              </h3>
              <p className="text-[var(--text-muted)]">
                Choose a chat to start messaging
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
