'use client';

import React from 'react';
import clsx from 'clsx';
import { getAvatarUrl } from '@/lib/url-helper';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar = ({
  src,
  alt = 'User avatar',
  size = 'md',
  className,
}: AvatarProps) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const assetUrl = getAvatarUrl(src);

  return (
    <div
      className={clsx(
        'rounded-full overflow-hidden flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)]',
        sizes[size],
        className,
      )}
    >
      {assetUrl ? (
        <img
          src={assetUrl}
          alt={alt}
          className="w-full h-full object-cover"
        />
      ) : (
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>
  );
};
