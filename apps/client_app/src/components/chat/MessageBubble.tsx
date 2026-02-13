// apps/client_app/src/components/chat/MessageBubble.tsx

import React from 'react';
import { Message } from '@/types';
import { format } from 'date-fns';
import { api } from '@/lib/axios';

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  onReactionUpdate?: () => void; // Колбэк для обновления
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMyMessage, onReactionUpdate }) => {
  
  // Метод для установки реакции
  const toggleReaction = async (emoji: string) => {
    try {
      await api.post(`/chats/messages/${message.id}/reactions`, { reaction: emoji });
      // В идеале мы ждем сокет, но можно вызвать колбэк для немедленной реакции UI, если нужно
      if (onReactionUpdate) onReactionUpdate();
    } catch (err) { console.error(err); }
  };

  // URL картинки для превью поста
  const sharedAssetUrl = message.sharedPost?.assets?.[0]?.asset?.url
    ? `${process.env.NEXT_PUBLIC_API_URL}${message.sharedPost.assets[0].asset.url}`
    : null;

  return (
    <div className={`flex flex-col mb-6 group ${isMyMessage ? 'items-end' : 'items-start'}`}>
      <div 
        className={`max-w-[70%] p-3 rounded-2xl relative shadow-sm ${
          isMyMessage 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-gray-200 text-black rounded-bl-none'
        }`}
      >
        {/* Имя автора (если чужое сообщение) */}
        {!isMyMessage && (
          <p className="text-[10px] font-bold mb-1 opacity-70">
            {message.profile?.displayName || message.profile?.username}
          </p>
        )}
        
        {/* Текст сообщения */}
        {message.content && <p className="whitespace-pre-wrap text-sm">{message.content}</p>}

        {/* ПРЕВЬЮ ПОСТА (Shared Post Logic) */}
        {message.sharedPost && (
            <div className="mt-2 bg-white/20 rounded-lg overflow-hidden border border-white/30 cursor-pointer min-w-[200px]">
                {sharedAssetUrl && (
                    <img 
                        src={sharedAssetUrl} 
                        className="w-full h-32 object-cover" 
                        alt="Shared content"
                    />
                )}
                <div className={`p-2 text-xs ${isMyMessage ? 'text-white' : 'text-black'}`}>
                    <p className="font-bold">@{message.sharedPost.profile?.username}</p>
                    <p className="truncate opacity-80">{message.sharedPost.content || 'Post'}</p>
                </div>
            </div>
        )}

        {/* Время и галочки */}
        <div className={`text-[9px] mt-1 flex justify-end gap-1 opacity-70`}>
          {format(new Date(message.createdAt), 'HH:mm')}
          {isMyMessage && <span>{message.isRead ? '✓✓' : '✓'}</span>}
        </div>

        {/* ОТОБРАЖЕНИЕ РЕАКЦИЙ */}
        {message.reactions && message.reactions.length > 0 && (
            <div className={`absolute -bottom-3 flex gap-1 bg-white shadow-sm rounded-full px-1.5 py-0.5 border text-black z-10 ${isMyMessage ? 'right-0' : 'left-0'}`}>
                {/* Группируем уникальные реакции */}
                {Array.from(new Set(message.reactions.map(r => r.reaction))).map(emoji => (
                    <span key={emoji} className="text-xs leading-none">{emoji}</span>
                ))}
                {message.reactions.length > 1 && (
                  <span className="text-[10px] text-gray-500 font-bold ml-0.5">{message.reactions.length}</span>
                )}
            </div>
        )}
      </div>

      {/* Быстрые кнопки реакций (появляются при наведении) */}
      <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2`}>
          {['❤️', '👍', '🔥', '😂'].map(emoji => (
              <button 
                key={emoji} 
                onClick={() => toggleReaction(emoji)} 
                className="text-sm hover:scale-125 transition transform bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                title={`React with ${emoji}`}
              >
                  {emoji}
              </button>
          ))}
      </div>
    </div>
  );
};