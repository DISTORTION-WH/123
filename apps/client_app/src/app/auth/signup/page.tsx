'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/axios';

interface SignupFormData {
  username: string;
  displayName: string;
  email: string;
  birthday: string;
  password: string;
}

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await api.post('/auth/signup', {
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        birthday: data.birthday,
        password: data.password,
      });
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
          : message || 'Registration failed',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    height: '44px',
    backgroundColor: 'var(--bg-input)',
    border: hasError
      ? '1px solid var(--accent)'
      : '1px solid var(--border)',
    borderRadius: '4px',
    padding: '0 12px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--accent)',
    margin: '4px 0 0 0',
  };

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    hasError: boolean,
  ) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = 'var(--text-muted)';
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    hasError: boolean,
  ) => {
    if (!hasError) {
      e.currentTarget.style.borderColor = 'var(--border)';
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
              Sign up
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Create an account to get started.
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
              {/* Username */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Username</label>
                <input
                  {...register('username', {
                    required: 'Username is required',
                  })}
                  type="text"
                  placeholder="Choose a username"
                  style={inputStyle(!!errors.username)}
                  onFocus={(e) =>
                    handleFocus(e, !!errors.username)
                  }
                  onBlur={(e) =>
                    handleBlur(e, !!errors.username)
                  }
                />
                {errors.username && (
                  <p style={errorStyle}>
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* Display Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Display Name</label>
                <input
                  {...register('displayName', {
                    required: 'Display name is required',
                  })}
                  type="text"
                  placeholder="e.g. John Doe"
                  style={inputStyle(!!errors.displayName)}
                  onFocus={(e) =>
                    handleFocus(e, !!errors.displayName)
                  }
                  onBlur={(e) =>
                    handleBlur(e, !!errors.displayName)
                  }
                />
                {errors.displayName && (
                  <p style={errorStyle}>
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Email</label>
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
                  style={inputStyle(!!errors.email)}
                  onFocus={(e) =>
                    handleFocus(e, !!errors.email)
                  }
                  onBlur={(e) =>
                    handleBlur(e, !!errors.email)
                  }
                />
                {errors.email && (
                  <p style={errorStyle}>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Birthday */}
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  {...register('birthday', {
                    required: 'Date of birth is required',
                  })}
                  type="date"
                  style={{
                    ...inputStyle(!!errors.birthday),
                    colorScheme: 'dark',
                  }}
                  onFocus={(e) =>
                    handleFocus(e, !!errors.birthday)
                  }
                  onBlur={(e) =>
                    handleBlur(e, !!errors.birthday)
                  }
                />
                {errors.birthday && (
                  <p style={errorStyle}>
                    {errors.birthday.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Password</label>
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message:
                        'Password must be at least 8 characters',
                    },
                  })}
                  type="password"
                  placeholder="Create a password"
                  style={inputStyle(!!errors.password)}
                  onFocus={(e) =>
                    handleFocus(e, !!errors.password)
                  }
                  onBlur={(e) =>
                    handleBlur(e, !!errors.password)
                  }
                />
                {errors.password && (
                  <p style={errorStyle}>
                    {errors.password.message}
                  </p>
                )}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
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
                {isLoading && (
                  <svg
                    style={{
                      animation: 'spin 1s linear infinite',
                      width: '18px',
                      height: '18px',
                    }}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      style={{ opacity: 0.25 }}
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      style={{ opacity: 0.75 }}
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
          </div>

          {/* Login Link */}
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
              Already have an account?{' '}
              <Link
                href="/auth/login"
                style={{
                  color: 'var(--accent)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Spinner keyframes via style tag */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
