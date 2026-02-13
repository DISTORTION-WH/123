'use client';

import { TikTokNavbar } from '@/components/TikTokNavbar';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex">
        <TikTokNavbar />
        <main className="flex-1 ml-24 lg:ml-64 min-h-screen bg-[var(--bg-primary)]">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
