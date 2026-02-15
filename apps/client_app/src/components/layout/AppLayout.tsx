'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { TikTokNavbar } from '@/components/TikTokNavbar';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isPublicPage =
    pathname === '/' || pathname?.startsWith('/auth');

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, isPublicPage, router]);

  // Public pages: no sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Loading state: show sidebar + spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <TikTokNavbar />
        <main className="flex-1 ml-24 lg:ml-64 min-h-screen bg-[var(--bg-primary)]">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  // Not authenticated on protected page: show nothing (redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated: show sidebar + content
  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <TikTokNavbar />
      <main className="flex-1 ml-24 lg:ml-64 min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-20" style={{ color: 'var(--text-primary)' }}>
          {children}
        </div>
      </main>
    </div>
  );
};
