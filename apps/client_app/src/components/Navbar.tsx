'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/auth/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/profile/${search.trim()}`);
      setSearch('');
      setShowSearch(false);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20"
          style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="w-full max-w-md px-4 animate-slide-down">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search users..."
                autoFocus
                className="w-full rounded-xl border border-[var(--border)] px-5 py-3.5 text-base"
                style={{ background: 'var(--bg-card)' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="button"
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-[72px] flex-col items-center py-6 z-40 border-r"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <Link href="/feed" className="mb-8 text-2xl font-black"
          style={{ color: 'var(--accent)' }}>
          I
        </Link>

        <div className="flex-1 flex flex-col items-center gap-2">
          <NavItem href="/feed" icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          } active={isActive('/feed')} label="Home" />

          <button onClick={() => setShowSearch(true)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors hover:bg-[var(--bg-elevated)]"
            style={{ color: 'var(--text-muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <span className="text-[10px]">Search</span>
          </button>

          <NavItem href="/posts/create" icon={
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
              style={{ background: 'var(--accent)', color: 'white' }}>+</div>
          } active={isActive('/posts/create')} label="Create" />

          <NavItem href="/chat" icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          } active={isActive('/chat')} label="Chat" />

          <NavItem href="/notifications" icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          } active={isActive('/notifications')} label="Alerts" />

          <NavItem href="/profile/me" icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          } active={pathname.startsWith('/profile')} label="Profile" />
        </div>

        <button onClick={handleLogout}
          className="p-3 rounded-xl transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-muted)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around py-2 border-t"
        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)' }}>
        <MobileNavItem href="/feed" active={isActive('/feed')} icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive('/feed') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
        } />
        <button onClick={() => setShowSearch(true)} className="p-2" style={{ color: 'var(--text-muted)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>
        <Link href="/posts/create" className="w-10 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: 'var(--accent)' }}>+</Link>
        <MobileNavItem href="/chat" active={isActive('/chat')} icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive('/chat') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        } />
        <MobileNavItem href="/profile/me" active={pathname.startsWith('/profile')} icon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill={pathname.startsWith('/profile') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        } />
      </nav>
    </>
  );
}

function NavItem({ href, icon, active, label }: { href: string; icon: React.ReactNode; active: boolean; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 p-3 rounded-xl transition-colors"
      style={{ color: active ? 'var(--accent)' : 'var(--text-muted)', background: active ? 'var(--accent-light)' : 'transparent' }}>
      {icon}
      <span className="text-[10px]">{label}</span>
    </Link>
  );
}

function MobileNavItem({ href, active, icon }: { href: string; active: boolean; icon: React.ReactNode }) {
  return (
    <Link href={href} className="p-2" style={{ color: active ? 'white' : 'var(--text-muted)' }}>
      {icon}
    </Link>
  );
}
