'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import Link from 'next/link';
import { useState } from 'react';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      router.push('/feed');
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const message = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(message)
          ? message.join(', ')
          : message || 'Invalid email or password',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
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
          backgroundColor: 'var(--bg-primary)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                fontSize: '28px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-1px',
              }}
            >
              Inno<span style={{ color: 'var(--accent)' }}>gram</span>
            </Link>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginTop: '24px',
                marginBottom: '8px',
              }}
            >
              Log in
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Welcome back! Enter your credentials.
            </p>
          </div>

          {/* Form Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '24px',
              border: '1px solid var(--border)',
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Email
                </label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value:
                        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  type="email"
                  placeholder="Enter your email"
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: 'var(--bg-input)',
                    border: errors.email
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    if (!errors.email) {
                      e.currentTarget.style.borderColor =
                        'var(--text-muted)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.email) {
                      e.currentTarget.style.borderColor =
                        'var(--border)';
                    }
                  }}
                />
                {errors.email && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--accent)',
                      marginTop: '4px',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '16px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Password
                </label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                  })}
                  type="password"
                  placeholder="Enter your password"
                  style={{
                    width: '100%',
                    height: '44px',
                    backgroundColor: 'var(--bg-input)',
                    border: errors.password
                      ? '1px solid var(--accent)'
                      : '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '0 12px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor =
                        'var(--text-muted)';
                    }
                  }}
                  onBlur={(e) => {
                    if (!errors.password) {
                      e.currentTarget.style.borderColor =
                        'var(--border)';
                    }
                  }}
                />
                {errors.password && (
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--accent)',
                      marginTop: '4px',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div
                style={{
                  textAlign: 'right',
                  marginBottom: '20px',
                }}
              >
                <Link
                  href="/auth/forgot-password"
                  style={{
                    fontSize: '12px',
                    color: 'var(--link)',
                    textDecoration: 'none',
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: 'rgba(254, 44, 85, 0.1)',
                    border: '1px solid rgba(254, 44, 85, 0.3)',
                    borderRadius: '4px',
                    padding: '10px 12px',
                    marginBottom: '16px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--accent)',
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  height: '44px',
                  backgroundColor: isLoading
                    ? 'rgba(254, 44, 85, 0.6)'
                    : 'var(--accent)',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      'var(--accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor =
                      'var(--accent)';
                  }
                }}
              >
                {isLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          </div>

          {/* Sign Up Link */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '20px',
            }}
          >
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Don&#39;t have an account?{' '}
              <Link
                href="/auth/signup"
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
