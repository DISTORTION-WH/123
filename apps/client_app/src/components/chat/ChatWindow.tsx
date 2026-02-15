// apps/client_app/src/components/chat/ChatWindow.tsx

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/axios';
import { Chat, Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { Socket } from 'socket.io-client';
import { getAvatarUrl } from '@/lib/url-helper';

interface ChatWindowProps {
  chat: Chat;
  currentUserId: string;
  socket: Socket | null;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUserId, socket }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // Load messages
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
    };
  }, [chat.id, socket]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (message.chatId === chat.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleReactionUpdate = (payload: {
      messageId: string;
      profileId: string;
      reaction: string | null;
      action: 'added' | 'removed' | 'updated';
    }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if (msg.id !== payload.messageId) return msg;

          let newReactions = msg.reactions ? [...msg.reactions] : [];

          if (payload.action === 'added' || payload.action === 'updated') {
            newReactions = newReactions.filter(
              (r) => r.profileId !== payload.profileId,
            );
            if (payload.reaction) {
              newReactions.push({
                id: Math.random().toString(),
                reaction: payload.reaction,
                profileId: payload.profileId,
              });
            }
          } else if (payload.action === 'removed') {
            newReactions = newReactions.filter(
              (r) => r.profileId !== payload.profileId,
            );
          }

          return { ...msg, reactions: newReactions };
        }),
      );
    };

    const handleTyping = (data: { username: string }) => {
      setTypingUsers((prev) => {
        if (prev.includes(data.username)) return prev;
        return [...prev, data.username];
      });
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== data.username));
      }, 3000);
    };

    const handleTypingStop = (data: { username: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== data.username));
    };

    socket.on('receiveMessage', handleNewMessage);
    socket.on('reactionUpdated', handleReactionUpdate);
    socket.on('typing', handleTyping);
    socket.on('typingStop', handleTypingStop);

    return () => {
      socket.off('receiveMessage', handleNewMessage);
      socket.off('reactionUpdated', handleReactionUpdate);
      socket.off('typing', handleTyping);
      socket.off('typingStop', handleTypingStop);
    };
  }, [socket, chat.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const emitTyping = useCallback(() => {
    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typingStart', { chatId: chat.id });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit('typingStop', { chatId: chat.id });
    }, 2000);
  }, [socket, chat.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    emitTyping();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText;
    setInputText('');

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket?.emit('typingStop', { chatId: chat.id });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }

    try {
      const res = await api.post(`/chats/${chat.id}/messages`, {
        content: messageText,
      });
      // Add the message from API response (gateway will also broadcast
      // but we dedup by ID in handleNewMessage)
      const sentMessage: Message = res.data;
      setMessages((prev) => {
        if (prev.find((m) => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send', error);
      // Restore input text on error
      setInputText(messageText);
    }
  };

  // Compute chat display info for private chats
  const otherParticipant = chat.type === 'private'
    ? chat.participants?.find((p) => p.profile?.userId !== currentUserId)
    : null;

  const chatDisplayName = chat.name || (
    chat.type === 'private'
      ? otherParticipant?.profile?.displayName
        || otherParticipant?.profile?.username
        || 'Chat'
      : 'Group Chat'
  );

  const chatAvatarUrl = otherParticipant
    ? getAvatarUrl(otherParticipant.profile?.avatarUrl)
    : null;

  return (
    <div
      className="flex flex-col h-full flex-1"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 border-b flex items-center gap-3"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold overflow-hidden"
          style={{
            background: chatAvatarUrl ? 'transparent' : 'var(--accent)',
          }}
        >
          {chatAvatarUrl ? (
            <img
              src={chatAvatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            chatDisplayName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {chatDisplayName}
          </h3>
          {chat.type === 'group' && (
            <span
              className="text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {chat.participants?.length || 0} members
            </span>
          )}
          {typingUsers.length > 0 && (
            <span
              className="text-xs animate-pulse"
              style={{ color: 'var(--accent)' }}
            >
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.join(', ')} are typing...`}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-3 pb-5"
        style={{ background: 'var(--bg-primary)' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center mt-10">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              width="48"
              height="48"
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
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              No messages yet. Say hello!
            </p>
          </div>
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

      {/* Input */}
      <div
        className="px-4 py-3 border-t"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border)',
        }}
      >
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Write a message..."
            className="flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-opacity flex-shrink-0"
            style={{ background: 'var(--accent)' }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
