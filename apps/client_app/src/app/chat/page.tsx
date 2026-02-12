// apps/client_app/src/app/chat/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import { useSocket } from '@/hooks/useSocket';
import { Chat, Profile } from '@/types';
import { ChatList } from '@/components/chat/ChatList';
import { ChatWindow } from '@/components/chat/ChatWindow';
import Navbar from '@/components/Navbar'; // Предполагаю, что Navbar есть

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const socket = useSocket();

  // 1. Загружаем свой профиль (нужен ID для логики "свое сообщение")
  useEffect(() => {
    api.get<Profile>('/profiles/me').then((res) => {
      setMyProfile(res.data);
    });
  }, []);

  // 2. Загружаем список чатов
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get<Chat[]>('/chats/me');
        setChats(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChats();
  }, []);

  // 3. Обработчик выбора чата
  const handleSelectChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) setActiveChat(chat);
  };

  if (!myProfile) return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 h-[calc(100vh-64px)]">
        <div className="bg-white rounded-lg shadow-lg flex h-full overflow-hidden border">
          
          {/* Левая колонка: Список */}
          <ChatList 
            chats={chats} 
            activeChatId={activeChat?.id || null} 
            onSelectChat={handleSelectChat}
            currentUserId={myProfile.userId}
          />

          {/* Правая колонка: Окно чата */}
          {activeChat ? (
            <ChatWindow 
                chat={activeChat} 
                currentUserId={myProfile.userId}
                socket={socket}
            />
          ) : (
            <div className="w-2/3 flex items-center justify-center bg-gray-50 text-gray-400">
              Select a chat to start messaging
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}