// apps/client_app/src/components/chat/ChatWindow.tsx

import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/axios';
import { Chat, Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Socket } from 'socket.io-client';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string; // ID текущего юзера (для определения "своих" сообщений)
  socket: Socket | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUserId, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Загрузка истории сообщений при смене чата
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
      // Join room via socket (если еще не джойнились глобально, но лучше делать это тут)
      socket?.emit('join_chat', { chatId: chat.id });
    }
    
    return () => {
        socket?.emit('leave_chat', { chatId: chat.id });
    }
  }, [chat.id, socket]);

  // 2. Слушаем новые сообщения
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      // Добавляем сообщение, только если оно относится к текущему открытому чату
      if (message.chatId === chat.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
    };

    // Название события должно совпадать с ChatsGateway (receiveMessage или new_message)
    // В твоем коде ChatsGateway: this.server.to(...).emit('receiveMessage', message);
    socket.on('receiveMessage', handleNewMessage);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket, chat.id]);

  // Скролл вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Отправка сообщения
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      // Оптимистичное обновление UI можно добавить здесь, но пока ждем ответа сервера
      await api.post(`/chats/${chat.id}/messages`, {
        content: inputText,
      });
      setInputText('');
      // Сообщение придет через сокет 'receiveMessage', поэтому тут вручную добавлять не обязательно,
      // но для быстрого UX можно. Пока полагаемся на сокет.
    } catch (error) {
      console.error('Failed to send', error);
    }
  };

  return (
    <div className="flex flex-col h-full w-2/3 bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b shadow-sm flex justify-between items-center">
        <h3 className="font-bold text-lg">{chat.name || 'Chat'}</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center mt-10">Loading messages...</div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMyMessage={msg.profile?.userId === currentUserId} // ВАЖНО: проверить структуру profile в message
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};