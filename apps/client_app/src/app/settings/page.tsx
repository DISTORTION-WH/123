'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface SettingItem {
  label: string;
  value?: string;
  icon: string;
  toggle?: boolean;
  editable?: boolean;
  danger?: boolean;
}

interface SettingSection {
  category: string;
  items: SettingItem[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
  };

  const settings: SettingSection[] = [
    {
      category: 'Account',
      items: [
        { label: 'Email Address', value: user?.email || '', icon: '✉️', editable: false },
        { label: 'Username', value: user?.username || '', icon: '👤', editable: false },
      ],
    },
    {
      category: 'Privacy & Safety',
      items: [
        { label: 'Private Account', icon: '🔒', toggle: true },
        { label: 'Block Users', icon: '🚫' },
        { label: 'Manage Followers', icon: '👥' },
      ],
    },
    {
      category: 'Display',
      items: [
        { label: 'Theme', value: 'Dark', icon: '🌙' },
        { label: 'Language', value: 'English', icon: '🌐' },
      ],
    },
    {
      category: 'Data & Privacy',
      items: [
        { label: 'Download Your Data', icon: '💾' },
        { label: 'Delete Account', icon: '⚠️', danger: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" style={{ color: 'var(--text-primary)' }}>
      <main className="max-w-2xl mx-auto pt-6 px-4 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your account and preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settings.map((section) => (
            <div
              key={section.category}
              className="rounded-xl overflow-hidden"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              {/* Section Header */}
              <div
                className="px-6 py-4 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <h2 className="text-lg font-bold">{section.category}</h2>
              </div>

              {/* Section Items */}
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {section.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="font-medium">{item.label}</p>
                        {item.value && (
                          <p
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>

                    {item.toggle ? (
                      <button
                        className="relative w-11 h-6 rounded-full bg-[var(--bg-secondary)]"
                        style={{ background: 'var(--bg-secondary)' }}
                      >
                        <div
                          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
                          style={{ background: 'var(--text-secondary)' }}
                        />
                      </button>
                    ) : item.value ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full mt-8 px-6 py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60"
          style={{
            background: 'var(--error)',
            color: '#fff',
          }}
        >
          {isLoading ? 'Logging out...' : 'Logout'}
        </button>

        {/* Version Info */}
        <div className="mt-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>Innogram v1.0.0</p>
          <p className="mt-2">© 2026 Innogram. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
