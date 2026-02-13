'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui/Avatar';

const navItems = [
  { href: '/feed', label: 'Home', icon: 'home' },
  { href: '/explore', label: 'Explore', icon: 'search' },
  { href: '/chat', label: 'Messages', icon: 'message' },
  { href: '/notifications', label: 'Notifications', icon: 'bell' },
];

export const TikTokNavbar = () => {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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

        {/* Nav Items */}
        <div className="flex lg:flex-col gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-full transition-all ${
                isActive(item.href)
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
              title={item.label}
            >
              {getIcon(item.icon)}
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
