'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { api } from '../../../lib/axios';

interface SignupFormData {
  email: string;
  password: string;
  username: string;
  displayName: string;
  birthday: string;
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
    console.log('Sending registration data:', data); // Для отладки
    setIsLoading(true);
    setErrorMsg('');
    try {
      await api.post('/auth/signup', {
        email: data.email,
        password: data.password,
        username: data.username,
        displayName: data.displayName,
        birthday: data.birthday,
      });
      
      console.log('Registration success');
      router.push('/auth/login');
    } catch (err) {
      console.error('Registration error:', err);
      const error = err as { response?: { data?: { message?: string | string[] } } };
      const message = error.response?.data?.message;
      setErrorMsg(Array.isArray(message) ? message.join(', ') : (message || 'Registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md shadow-sm">
            
            {/* Username */}
            <div>
              <input
                type="text"
                placeholder="Username"
                className={`block w-full rounded-md border px-3 py-2 focus:ring-indigo-500 sm:text-sm ${
                  errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <input
                type="text"
                placeholder="Display Name (e.g. John Doe)"
                className={`block w-full rounded-md border px-3 py-2 focus:ring-indigo-500 sm:text-sm ${
                  errors.displayName ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                {...register('displayName', { required: 'Display name is required' })}
              />
              {errors.displayName && (
                <p className="mt-1 text-xs text-red-500">{errors.displayName.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                className={`block w-full rounded-md border px-3 py-2 focus:ring-indigo-500 sm:text-sm ${
                  errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Birthday */}
            <div>
              <label className="text-xs text-gray-500 ml-1">Date of Birth</label>
              <input
                type="date"
                className={`block w-full rounded-md border px-3 py-2 focus:ring-indigo-500 sm:text-sm ${
                  errors.birthday ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                {...register('birthday', { required: 'Date of birth is required' })}
              />
              {errors.birthday && (
                <p className="mt-1 text-xs text-red-500">{errors.birthday.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                placeholder="Password"
                className={`block w-full rounded-md border px-3 py-2 focus:ring-indigo-500 sm:text-sm ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500'
                }`}
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* General API Error */}
          {errorMsg && (
            <div className="rounded-md bg-red-50 p-3">
              <div className="text-sm text-red-700 text-center">{errorMsg}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {isLoading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}