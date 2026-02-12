// apps/client_app/src/components/chat/MessageBubble.tsx

import React from 'react';
import { Message } from '@/types';
import { format } from 'date-fns'; // Рекомендую установить: npm install date-fns

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMyMessage }) => {
  return (
    <div className={`flex w-full mb-4 ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] p-3 rounded-2xl ${
          isMyMessage
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-black rounded-bl-none'
        }`}
      >
        {!isMyMessage && (
          <p className="text-xs font-bold mb-1 text-gray-600">
            {message.profile?.displayName || message.profile?.username}
          </p>
        )}
        
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Если есть вложение-пост (Sprint 3 feature) */}
        {message.sharedPost && (
            <div className="mt-2 p-2 bg-black/10 rounded">
                <p className="text-xs italic">Shared post</p>
                {/* Тут можно вывести превью поста */}
            </div>
        )}

        <div className={`text-[10px] mt-1 text-right ${isMyMessage ? 'text-blue-100' : 'text-gray-500'}`}>
          {format(new Date(message.createdAt), 'HH:mm')}
          {isMyMessage && (
             <span className="ml-1">
                {message.isRead ? '✓✓' : '✓'}
             </span>
          )}
        </div>
      </div>
    </div>
  );
};