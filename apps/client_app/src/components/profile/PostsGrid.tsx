'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getAssetUrl } from '@/lib/url-helper';
import { Post } from '@/types';

interface PostsGridProps {
  posts: Post[];
}

export const PostsGrid: React.FC<PostsGridProps> = ({ posts }) => {
  const router = useRouter();

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
    <div
      className="grid grid-cols-3 gap-1 md:gap-3 pt-4"
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {posts.map((post) => {
        // Get asset from post assets array
        let assetUrl: string | null = null;
        let thumbnailUrl: string | null = null;
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
              // Get thumbnail for video
              if (isVideo && asset.thumbnailPath) {
                thumbnailUrl = getAssetUrl(asset.thumbnailPath);
              }
            }
          }
        }

        // Use thumbnail for videos, actual image for photos
        const displayUrl = isVideo && thumbnailUrl ? thumbnailUrl : assetUrl;

        return (
          <div
            key={post.id}
            className="relative aspect-square group cursor-pointer overflow-hidden rounded-sm"
            style={{ background: 'var(--bg-elevated)' }}
            onClick={() => router.push(`/posts/${post.id}`)}
          >
            {displayUrl && !isVideo ? (
              <img
                src={displayUrl}
                alt="Post"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(`Failed to load image: ${displayUrl}`, e);
                }}
              />
            ) : displayUrl && isVideo ? (
              <div className="relative w-full h-full">
                <img
                  src={displayUrl}
                  alt="Post"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(`Failed to load thumbnail: ${displayUrl}`, e);
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="white"
                    style={{ opacity: 0.9 }}
                  >
                    <path d="M23 7l-7 5 7 5V7z" />
                    <rect x="1" y="5" width="15" height="14" rx="2" fill="none" stroke="white" strokeWidth="2" />
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
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      📸 {post.assets.length} asset(s)
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Hover overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-5"
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
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
          </div>
        );
      })}
    </div>
  );
};
