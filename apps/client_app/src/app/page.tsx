'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main
      style={{
        '--bg-primary': '#000',
        '--bg-secondary': '#121212',
        '--bg-card': '#1e1e1e',
        '--bg-elevated': '#2a2a2a',
        '--bg-input': '#1a1a1a',
        '--text-primary': '#fff',
        '--text-secondary': '#a0a0a0',
        '--text-muted': '#666',
        '--accent': '#FE2C55',
        '--accent-hover': '#ff4d73',
        '--border': '#2a2a2a',
        '--link': '#69C9D0',
      } as React.CSSProperties}
    >
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, var(--bg-primary) 0%, #0a0a0a 40%, #120a10 60%, var(--bg-primary) 100%)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '24px',
        }}
      >
        {/* Decorative gradient orbs */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(254,44,85,0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '10%',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(105,201,208,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-2px',
              lineHeight: 1.1,
            }}
          >
            Inno
            <span style={{ color: 'var(--accent)' }}>gram</span>
          </h1>

          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              marginTop: '16px',
              marginBottom: '48px',
              maxWidth: '400px',
              lineHeight: 1.6,
            }}
          >
            Share your moments. Connect with creators.
            Discover what&#39;s trending.
          </p>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            <Link
              href="/auth/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '48px',
                borderRadius: '4px',
                backgroundColor: 'var(--accent)',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget.style.backgroundColor =
                  'var(--accent-hover)');
              }}
              onMouseLeave={(e) => {
                (e.currentTarget.style.backgroundColor =
                  'var(--accent)');
              }}
            >
              Log in
            </Link>

            <Link
              href="/auth/signup"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '48px',
                borderRadius: '4px',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid var(--border)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Sign up
            </Link>
          </div>

          {/* Footer text */}
          <p
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '48px',
              lineHeight: 1.5,
            }}
          >
            By continuing, you agree to Innogram&#39;s Terms of
            Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}
