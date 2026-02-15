// apps/client_app/src/components/chat/MessageBubble.tsx

import React from 'react';
import Link from 'next/link';
import { Message } from '@/types';
import { format } from 'date-fns';
import { api } from '@/lib/axios';
import { getAssetUrl, getAvatarUrl } from '@/lib/url-helper';

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  onReactionUpdate?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMyMessage,
  onReactionUpdate,
}) => {
  const toggleReaction = async (emoji: string) => {
    try {
      await api.post(`/chats/messages/${message.id}/reactions`, {
        reaction: emoji,
      });
      if (onReactionUpdate) onReactionUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const sharedPost = message.sharedPost;
  const sharedAssetUrl = getAssetUrl(sharedPost?.assets?.[0]?.asset?.url);
  const sharedPostAuthorAvatar = getAvatarUrl(sharedPost?.profile?.avatarUrl);
  const hasReactions = message.reactions && message.reactions.length > 0;

  if (message.isDeleted) {
    return (
      <div
        className={`flex flex-col mb-2 ${isMyMessage ? 'items-end' : 'items-start'}`}
      >
        <div
          className="max-w-[70%] px-3 py-2 rounded-2xl italic text-xs opacity-60"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
          }}
        >
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col group ${isMyMessage ? 'items-end' : 'items-start'}`}
      style={{ marginBottom: hasReactions ? '20px' : '8px' }}
    >
      {/* Bubble wrapper - this allows reactions to visually extend below
          without using overflow-hidden on the bubble itself */}
      <div className="relative max-w-[70%]">
        {/* The actual message bubble */}
        <div
          className={`${
            isMyMessage ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'
          } shadow-sm`}
          style={{
            background: isMyMessage ? 'var(--accent)' : 'var(--bg-elevated)',
            color: isMyMessage ? '#fff' : 'var(--text-primary)',
          }}
        >
          {/* Author name (group chats / other person) */}
          {!isMyMessage && (
            <p className="text-[10px] font-bold opacity-70 px-3 pt-2">
              {message.profile?.displayName || message.profile?.username}
            </p>
          )}

          {/* Message text */}
          {message.content && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed px-3 py-1.5">
              {message.content}
            </p>
          )}

          {/* Shared post preview - TikTok style */}
          {sharedPost && (
            <Link
              href={`/feed?postId=${sharedPost.id}`}
              className="block cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div
                className="overflow-hidden"
                style={{
                  background: isMyMessage
                    ? 'rgba(0,0,0,0.15)'
                    : 'var(--bg-secondary)',
                  borderTop: message.content
                    ? `1px solid ${isMyMessage ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`
                    : undefined,
                  borderRadius: message.content
                    ? undefined
                    : isMyMessage
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                }}
              >
                {/* Post image */}
                {sharedAssetUrl ? (
                  <div className="relative">
                    <img
                      src={sharedAssetUrl}
                      className="w-full h-40 object-cover"
                      alt="Shared post"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                      <div className="bg-black/40 rounded-full p-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M9 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full h-24 flex items-center justify-center"
                    style={{
                      background: isMyMessage
                        ? 'rgba(255,255,255,0.1)'
                        : 'var(--bg-elevated)',
                    }}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      style={{ opacity: 0.4 }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}

                {/* Post info footer */}
                <div className="px-3 py-2 flex items-center gap-2">
                  {sharedPostAuthorAvatar ? (
                    <img
                      src={sharedPostAuthorAvatar}
                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      alt=""
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0"
                      style={{ background: 'var(--accent)' }}
                    >
                      {(sharedPost.profile?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate">
                      @{sharedPost.profile?.username || 'user'}
                    </p>
                    {sharedPost.content && (
                      <p className="text-[10px] truncate opacity-70">
                        {sharedPost.content}
                      </p>
                    )}
                  </div>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="flex-shrink-0 opacity-50"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

          {/* Time and read status - inside bubble */}
          <div className="text-[9px] flex justify-end gap-1 opacity-60 px-3 pb-1.5 pt-0.5">
            {format(new Date(message.createdAt), 'HH:mm')}
            {isMyMessage && (
              <span>{message.isRead ? '\u2713\u2713' : '\u2713'}</span>
            )}
          </div>
        </div>

        {/* Reactions display - positioned outside the bubble overflow */}
        {hasReactions && (
          <div
            className={`absolute -bottom-3 flex gap-0.5 shadow-sm rounded-full px-1.5 py-0.5 border z-10 ${
              isMyMessage ? 'right-1' : 'left-1'
            }`}
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {Array.from(
              new Set(message.reactions!.map((r) => r.reaction)),
            ).map((emoji) => (
              <span key={emoji} className="text-xs leading-none">
                {emoji}
              </span>
            ))}
            {message.reactions!.length > 1 && (
              <span
                className="text-[10px] font-bold ml-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {message.reactions!.length}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick reaction buttons (hover) */}
      <div className="flex gap-0.5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-1">
        {['\u2764\ufe0f', '\ud83d\udc4d', '\ud83d\udd25', '\ud83d\ude02'].map(
          (emoji) => (
            <button
              key={emoji}
              onClick={() => toggleReaction(emoji)}
              className="text-sm hover:scale-125 transition transform rounded-full w-6 h-6 flex items-center justify-center"
              style={{ background: 'var(--bg-elevated)' }}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ),
        )}
      </div>
    </div>
  );
};
