'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/axios';
import { getAssetUrl } from '@/lib/url-helper';
import { CommentSection } from './CommentSection';
import { EditPostModal } from './EditPostModal';
import { SharePostModal } from './SharePostModal';

interface PostCardProps {
  post: Post;
  onLikeToggle: (postId: string, newStatus: boolean) => void;
  onDelete?: (postId: string) => Promise<void>;
  onUpdate?: (updatedPost: Post) => void;
  isAuthor?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLikeToggle, onDelete, onUpdate, isAuthor }) => {
  const [showComments, setShowComments] = useState(false);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const lastTapRef = useRef<number>(0);

  const assetUrl = getAssetUrl(
    post.assets[0]?.asset?.url || post.assets[0]?.asset?.filePath
  );

  const avatarUrl = getAssetUrl(post.profile.avatarUrl);

  const handleLike = useCallback(async () => {
    try {
      await api.post(`/posts/${post.id}/like`);
      onLikeToggle(post.id, !post.isLiked);
    } catch (error) {
      console.error('Like failed', error);
    }
  }, [post.id, post.isLiked, onLikeToggle]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      if (!post.isLiked) {
        handleLike();
      }
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 800);
    }
  }, [post.isLiked, handleLike]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  };

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${post.id}`);
      if (onDelete) await onDelete(post.id);
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete post');
    }
  }, [post.id, onDelete]);

  return (
    <div
      className="rounded-xl overflow-hidden mb-4"
      style={{ background: 'var(--bg-card)' }}
    >
      {/* Image/Video area with overlay */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          minHeight: assetUrl ? '400px' : '120px',
        }}
        onClick={handleDoubleTap}
      >
        {assetUrl && (
          <>
            {assetUrl.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? (
              <video
                src={assetUrl}
                controls
                className="w-full h-full object-cover"
                style={{ maxHeight: '600px' }}
              />
            ) : (
              <img
                src={assetUrl}
                alt="Post content"
                className="w-full h-full object-cover"
                style={{ maxHeight: '600px' }}
              />
            )}
          </>
        )}

        {/* Double-tap like animation */}
        {showLikeAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="var(--accent)"
              className="animate-ping"
              style={{ animationDuration: '0.6s' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}

        {/* Bottom overlay with username and content */}
        <div
          className="absolute bottom-0 left-0 right-16 p-4"
          style={{
            background:
              'linear-gradient(transparent, rgba(0,0,0,0.7))',
          }}
        >
          <Link
            href={`/profile/${post.profile.username}`}
            className="flex items-center gap-2 mb-2"
          >
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: 'var(--accent)' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={post.profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >
                  {post.profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span
              className="font-bold text-sm"
              style={{ color: 'var(--text-primary)' }}
            >
              {post.profile.displayName || post.profile.username}
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              {formatDistanceToNow(new Date(post.createdAt), {
                addSuffix: true,
              })}
            </span>
          </Link>
          {post.content && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              {post.content}
            </p>
          )}
        </div>

        {/* Right side vertical action bar */}
        <div className="absolute right-2 bottom-4 flex flex-col items-center gap-5">
          {/* Like button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="flex flex-col items-center gap-1 transition-transform active:scale-125"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={post.isLiked ? 'var(--accent)' : 'none'}
                stroke={post.isLiked ? 'var(--accent)' : 'white'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatCount(post.likesCount)}
            </span>
          </button>

          {/* Comment button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
            className="flex flex-col items-center gap-1 transition-transform active:scale-125"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {formatCount(post.commentsCount)}
            </span>
          </button>

          {/* Share button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            className="flex flex-col items-center gap-1 transition-transform active:scale-125"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Share
            </span>
          </button>

          {isAuthor && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="flex flex-col items-center gap-1 transition-transform active:scale-125"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(0,150,255,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M3 12a9 9 0 010-18 9 9 0 010 18zm0 0a9 9 0 0018 0 9 9 0 00-18 0z" />
                    <path d="M9 15l6-6m0 6l-6-6" />
                  </svg>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Edit
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="flex flex-col items-center gap-1 transition-transform active:scale-125"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </div>
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Delete
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* No-image fallback content */}
      {!assetUrl && post.content && (
        <div className="p-4">
          <Link
            href={`/profile/${post.profile.username}`}
            className="flex items-center gap-2 mb-3"
          >
            <div
              className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: 'var(--accent)' }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={post.profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                >
                  {post.profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <span
                className="font-bold text-sm block"
                style={{ color: 'var(--text-primary)' }}
              >
                {post.profile.displayName || post.profile.username}
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {formatDistanceToNow(new Date(post.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </Link>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-primary)' }}
          >
            {post.content}
          </p>
          <div className="flex items-center gap-6 mt-3 pt-3"
            style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 text-sm transition-transform active:scale-110"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={post.isLiked ? 'var(--accent)' : 'none'}
                stroke={post.isLiked ? 'var(--accent)' : 'var(--text-secondary)'}
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              <span style={{ color: post.isLiked ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {formatCount(post.likesCount)}
              </span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span style={{ color: 'var(--text-secondary)' }}>
                {formatCount(post.commentsCount)}
              </span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm ml-auto"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--text-secondary)"
                strokeWidth="2"
              >
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Comment section */}
      {showComments && (
        <div
          className="px-4 pb-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <CommentSection postId={post.id} />
        </div>
      )}

      <EditPostModal
        post={post}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updatedPost) => {
          if (onUpdate) onUpdate(updatedPost);
        }}
      />

      <SharePostModal
        postId={post.id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
};
