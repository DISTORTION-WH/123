'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export const ExploreBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isExplore = pathname === '/explore';

  return (
    <div className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border)]">
      <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ color: 'var(--text-muted)' }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search posts, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
            />
          </div>
        </form>

        <Link
          href="/explore"
          className={`px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
            isExplore
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          Explore
        </Link>
      </div>
    </div>
  );
};
