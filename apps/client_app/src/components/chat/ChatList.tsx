// apps/client_app/src/components/chat/ChatList.tsx

import React from 'react';
import { Chat, ChatType } from '@/types';

interface ChatListProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  currentUserId: string;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  currentUserId,
}) => {
  // Хелпер для получения названия чата
  const getChatName = (chat: Chat) => {
    if (chat.type === ChatType.GROUP) return chat.name;
    // Для приватного чата ищем собеседника
    const otherMember = chat.participants.find((p) => p.profile.userId !== currentUserId);
    return otherMember ? (otherMember.profile.displayName || otherMember.profile.username) : 'Unknown';
  };

  return (
    <div className="w-1/3 border-r h-full overflow-y-auto bg-white">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Chats</h2>
      </div>
      <ul>
        {chats.map((chat) => (
          <li
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b ${
              activeChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
            }`}
          >
            <div className="font-semibold">{getChatName(chat)}</div>
            <div className="text-sm text-gray-500 truncate">
              {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
            </div>
          </li>
        ))}
        {chats.length === 0 && (
            <div className="p-4 text-center text-gray-500">No chats yet</div>
        )}
      </ul>
    </div>
  );
};