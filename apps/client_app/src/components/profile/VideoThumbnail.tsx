'use client';

import React, { useState, useEffect } from 'react';
import { getVideoThumbnail } from '@/lib/video-thumbnail';

interface VideoThumbnailProps {
  videoUrl: string;
  alt?: string;
  className?: string;
  onError?: (error: Error) => void;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoUrl,
  alt = 'Video thumbnail',
  className = '',
  onError,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const generateThumbnail = async () => {
      try {
        setLoading(true);
        const thumb = await getVideoThumbnail(videoUrl, 1);
        if (mounted) {
          setThumbnail(thumb);
        }
      } catch (error) {
        console.error('Failed to generate video thumbnail:', error);
        if (onError && error instanceof Error) {
          onError(error);
        }
        if (mounted) {
          setThumbnail(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    generateThumbnail();

    return () => {
      mounted = false;
    };
  }, [videoUrl, onError]);

  if (loading) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gray-900 ${className}`}
      >
        <div className="animate-spin">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            style={{ opacity: 0.5 }}
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
      </div>
    );
  }

  if (!thumbnail) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="white"
          style={{ opacity: 0.8 }}
        >
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" fill="none" stroke="white" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={thumbnail}
      alt={alt}
      className={`w-full h-full object-cover ${className}`}
    />
  );
};
