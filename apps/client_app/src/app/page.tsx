'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/feed');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[var(--bg-primary)] via-[#0a0a0a] to-[var(--bg-primary)] relative overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-20 left-1/4 w-72 h-72 bg-[var(--accent)] opacity-10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[var(--link)] opacity-5 rounded-full blur-3xl" />

      <div className="relative z-10 text-center px-4">
        <h1 className="text-6xl md:text-7xl font-bold text-[var(--text-primary)] mb-4">
          Inno<span className="text-[var(--accent)]">gram</span>
        </h1>

        <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-12 max-w-lg mx-auto">
          Share your moments. Connect with creators. Discover whats trending.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center mb-12">
          <Link
            href="/auth/login"
            className="px-8 py-3 bg-[var(--accent)] text-white font-bold rounded-full hover:bg-[var(--accent-hover)] transition-colors"
          >
            Sign In
          </Link>

          <Link
            href="/auth/signup"
            className="px-8 py-3 border border-[var(--border)] text-[var(--text-primary)] font-bold rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Sign Up
          </Link>
        </div>

        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          By continuing, you agree to Innograms Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
