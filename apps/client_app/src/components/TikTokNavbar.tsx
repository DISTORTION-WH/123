'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/axios';

const navItems = [
  { href: '/feed', label: 'Home', icon: 'home' },
  { href: '/friends', label: 'Friends', icon: 'people' },
  { href: '/chat', label: 'Messages', icon: 'message' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
];

export const TikTokNavbar = () => {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications/unread-count');
        setUnreadCount(res.data.count || 0);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const getIcon = (iconType: string) => {
    const iconProps = {
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
    };

    const icons: Record<string, React.ReactNode> = {
      home: (
        <svg {...iconProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      search: (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      ),
      message: (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      bell: (
        <svg {...iconProps}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
      plus: (
        <svg {...iconProps}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
      profile: (
        <svg {...iconProps}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      logout: (
        <svg {...iconProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      ),
      people: (
        <svg {...iconProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    };

    return icons[iconType] || null;
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed left-0 top-0 h-screen w-24 lg:w-64 bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col justify-between p-4 lg:p-6 z-50">
      {/* Top Navigation */}
      <div className="flex flex-col gap-4">
        {/* Logo */}
        <Link
          href="/feed"
          className="text-2xl font-bold text-[var(--accent)] mb-8 hidden lg:block"
        >
          Innogram
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:block">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors">
            {React.cloneElement(
              (getIcon('search') as React.ReactElement),
              { width: 20, height: 20 } as any
            )}
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
            />
          </div>
        </form>

        {/* Nav Items */}
        <div className="flex lg:flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all relative ${
                isActive(item.href)
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title={item.label}
            >
              <div className="relative">
                {getIcon(item.icon)}
                {item.icon === 'bell' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="hidden lg:inline text-base font-semibold">
                {item.label}
              </span>
            </Link>
          ))}

          {/* Create Post */}
          <Link
            href="/posts/create"
            className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
              pathname === '/posts/create'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
            }`}
            title="Create"
          >
            {getIcon('plus')}
            <span className="hidden lg:inline text-base font-semibold">
              Create
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex lg:flex-col gap-4">
        {profile && (
          <>
            <Link
              href={`/profile/${profile.username}`}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                pathname === `/profile/${profile.username}`
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title="Profile"
            >
              <Avatar
                src={profile.avatarUrl}
                size="md"
              />
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {profile.displayName}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  @{profile.username}
                </p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-3 rounded-full transition-all text-[var(--error)] hover:bg-[var(--bg-elevated)]"
              title="Logout"
            >
              {getIcon('logout')}
              <span className="hidden lg:inline text-base font-semibold">
                Logout
              </span>
            </button>
          </>
        )}
      </div>
    </nav>
  );
};
