'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg('');
    try {
      await login(data.email, data.password);
      // Small delay to ensure auth state updates before redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/feed');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const message = error.response?.data?.message;
      setErrorMsg(
        Array.isArray(message)
          ? message.join(', ')
          : typeof message === 'string' ? message : 'Invalid email or password',
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--bg-primary)]">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] items-center justify-center p-8">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Innogram</h1>
          <p className="text-2xl opacity-90">Connect with millions of creators</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Welcome Back
            </h2>
            <p className="text-[var(--text-secondary)]">
              Sign in to your account
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-[var(--error)] bg-opacity-10 border border-[var(--error)] rounded-lg">
              <p className="text-[var(--error)] text-sm">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="your@email.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="text-right mb-6">
              <Link
                href="/auth/forgot-password"
                className="text-[var(--link)] hover:text-[var(--accent)] text-sm font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--text-secondary)]">
              Don&#39;t have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-[var(--accent)] hover:text-[var(--accent-hover)] font-semibold transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
