// apps/client_app/src/components/chat/ChatWindow.tsx

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/axios';
import { Chat, Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Socket } from 'socket.io-client';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  socket: Socket | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUserId, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Загрузка истории сообщений
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await api.get<Message[]>(`/chats/${chat.id}/messages`);
        setMessages(res.data);
      } catch (error) {
        console.error('Failed to fetch messages', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (chat.id) {
      fetchMessages();
      socket?.emit('join_chat', { chatId: chat.id });
    }
    
    return () => {
        socket?.emit('leave_chat', { chatId: chat.id });
    }
  }, [chat.id, socket]);

  // 2. Слушаем WebSocket события (Сообщения и Реакции)
  useEffect(() => {
    if (!socket) return;

    // Новое сообщение
    const handleNewMessage = (message: Message) => {
      if (message.chatId === chat.id) {
        setMessages((prev) => {
          // Защита от дубликатов (если API вернул, а потом сокет прилетел)
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    // Обновление реакции
    const handleReactionUpdate = (payload: { messageId: string, profileId: string, reaction: string | null, action: 'added' | 'removed' | 'updated' }) => {
      setMessages((prevMessages) => 
        prevMessages.map((msg) => {
          if (msg.id !== payload.messageId) return msg;

          // Копируем реакции или создаем пустой массив
          let newReactions = msg.reactions ? [...msg.reactions] : [];

          if (payload.action === 'added' || payload.action === 'updated') {
            // Удаляем старую реакцию этого юзера, если есть
            newReactions = newReactions.filter(r => r.profileId !== payload.profileId);
            // Добавляем новую
            if (payload.reaction) {
              newReactions.push({
                id: Math.random().toString(), // Временный ID для UI
                reaction: payload.reaction,
                profileId: payload.profileId
              });
            }
          } else if (payload.action === 'removed') {
            newReactions = newReactions.filter(r => r.profileId !== payload.profileId);
          }

          return { ...msg, reactions: newReactions };
        })
      );
    };

    socket.on('receiveMessage', handleNewMessage);
    socket.on('reactionUpdated', handleReactionUpdate); // <-- Слушаем реакции

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('reactionUpdated', handleReactionUpdate);
    };
  }, [socket, chat.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await api.post(`/chats/${chat.id}/messages`, { content: inputText });
      setInputText('');
    } catch (error) {
      console.error('Failed to send', error);
    }
  };

  return (
    <div className="flex flex-col h-full w-2/3 bg-gray-50">
      <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
        <h3 className="font-bold text-lg">{chat.name || 'Chat'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center mt-10 text-gray-400">Loading messages...</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMyMessage={msg.profile?.userId === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  );
};