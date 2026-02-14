'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Не показываем сайдбар на страницах входа/регистрации
  const isAuthPage = pathname?.startsWith('/auth');

  if (!isAuthenticated || isAuthPage || isLoading) {
    return <>{children}</>;
  }

  // Определяем активный элемент
  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      {/* Fixed Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 border-r border-[var(--border)] bg-[var(--bg-secondary)] overflow-y-auto">
        <div className="sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border)] p-6">
          <Link href="/feed" className="block">
            <h1 className="text-2xl font-bold">
              <span className="text-[var(--text-primary)]">Inno</span>
              <span className="text-[var(--accent)]">gram</span>
            </h1>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="p-6 space-y-2">
          {[
            { href: '/feed', label: 'Home', icon: '🏠' },
            { href: '/explore', label: 'Explore', icon: '🔍' },
            { href: '/chat', label: 'Messages', icon: '💬' },
            { href: '/notifications', label: 'Notifications', icon: '🔔' },
            { href: '/friends', label: 'Friends', icon: '👥' },
            { href: '/profile/me', label: 'Profile', icon: '👤' },
            { href: '/settings', label: 'Settings', icon: '⚙️' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 bg-[var(--bg-primary)]">
        <div className="sticky top-0 z-40 bg-[var(--bg-primary)] border-b border-[var(--border)]">
          {/* Search Bar */}
          <div className="max-w-7xl mx-auto px-6 py-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Handled by component
              }}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-[var(--bg-input)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors"
            >
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
                className="flex-1 bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none text-sm"
              />
            </form>
          </div>
        </div>

        {/* Page Content - Remove outer padding from children */}
        <div className="max-w-7xl mx-auto px-4 pb-20" style={{ color: 'var(--text-primary)' }}>
          {children}
        </div>
      </main>
    </div>
  );
};
