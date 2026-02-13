'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { getAssetUrl } from '@/lib/url-helper';
import { Post } from '@/types';
import { VideoThumbnail } from './VideoThumbnail';
import { EditPostModal } from '@/components/feed/EditPostModal';

interface PostsGridProps {
  posts: Post[];
  currentUserId?: string;
  onPostDelete?: (postId: string) => void;
  onPostUpdate?: (updatedPost: Post) => void;
}

export const PostsGrid: React.FC<PostsGridProps> = ({
  posts,
  currentUserId,
  onPostDelete,
  onPostUpdate,
}) => {
  const router = useRouter();
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      if (onPostDelete) onPostDelete(postId);
    } catch (error) {
      console.error('Delete failed', error);
      alert('Failed to delete post');
    }
  };

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.profile.username}`,
        text: post.content,
        url: `${window.location.origin}/posts/${post.id}`,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(
        `${window.location.origin}/posts/${post.id}`,
      );
    }
  };

  if (posts.length === 0) {
    return (
      <div
        className="py-16 text-center"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="mx-auto mb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <h3
          className="font-bold text-xl mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          No Posts Yet
        </h3>
        <p
          className="text-sm"
          style={{ color: 'var(--text-muted)' }}
        >
          When posts are shared, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid grid-cols-3 gap-1 md:gap-3 pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {posts.map((post) => {
          // Get asset from post assets array
          let assetUrl: string | null = null;
          let isVideo = false;

          if (post.assets && Array.isArray(post.assets) && post.assets.length > 0) {
            const firstAssetItem = post.assets[0];
            // Asset is nested as { id, orderIndex, asset: { filePath, url, ... } }
            if (firstAssetItem && typeof firstAssetItem === 'object' && 'asset' in firstAssetItem) {
              const asset = (firstAssetItem as any).asset;
              if (asset && (asset.filePath || asset.url)) {
                const assetPath = asset.filePath || asset.url;
                assetUrl = getAssetUrl(assetPath);
                // Check if it's a video file
                isVideo = /\.(mp4|webm|mov|avi|mkv)$/i.test(assetPath);
              }
            }
          }

          const isAuthor = currentUserId && currentUserId === post.profile.userId;

          return (
            <div key={post.id}>
              <div
                className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm"
                style={{ background: 'var(--bg-elevated)' }}
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                {!isVideo && assetUrl ? (
                  <img
                    src={assetUrl}
                    alt="Post"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image: ${assetUrl}`, e);
                    }}
                  />
                ) : isVideo && assetUrl ? (
                  <div className="relative w-full h-full">
                    <VideoThumbnail videoUrl={assetUrl} />
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(0, 0, 0, 0.3)' }}
                    >
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="white"
                        style={{ opacity: 0.9 }}
                      >
                        <path d="M23 7l-7 5 7 5V7z" />
                        <rect
                          x="1"
                          y="5"
                          width="15"
                          height="14"
                          rx="2"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center p-3"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <div className="text-center">
                      <p className="text-xs text-center line-clamp-4 mb-2">
                        {post.content || 'Post'}
                      </p>
                      {post.assets && post.assets.length > 0 && (
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          📸 {post.assets.length} asset(s)
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {/* Hover overlay with stats */}
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-5"
                  style={{ background: 'rgba(0, 0, 0, 0.5)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="none"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                    </svg>
                    {post.likesCount}
                  </span>
                  <span className="flex items-center gap-1.5 text-white font-bold text-sm">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="none"
                    >
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    {post.commentsCount}
                  </span>
                </div>

                {/* Action buttons for authors */}
                {isAuthor && (
                  <div
                    className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPost(post);
                        setEditingPostId(post.id);
                      }}
                      className="p-2 rounded-full transition-all"
                      style={{
                        background: 'rgba(0, 150, 255, 0.8)',
                        color: 'white',
                      }}
                      title="Edit post"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(post.id);
                      }}
                      className="p-2 rounded-full transition-all"
                      style={{
                        background: 'rgba(255, 0, 0, 0.8)',
                        color: 'white',
                      }}
                      title="Delete post"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Share button for all users */}
                <div
                  className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(post);
                    }}
                    className="p-2 rounded-full transition-all"
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      backdropFilter: 'blur(4px)',
                    }}
                    title="Share post"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {selectedPost && (
        <EditPostModal
          post={selectedPost}
          isOpen={editingPostId === selectedPost.id}
          onClose={() => {
            setEditingPostId(null);
            setSelectedPost(null);
          }}
          onSave={(updatedPost) => {
            if (onPostUpdate) onPostUpdate(updatedPost);
            setEditingPostId(null);
            setSelectedPost(null);
          }}
        />
      )}
    </>
  );
};
