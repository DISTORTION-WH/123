/* eslint-disable @typescript-eslint/no-explicit-any */ //i know
'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import axios from 'axios';

const AUTH_SERVICE_URL = 'http://localhost:3001';

export default function SignupPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
  } = useForm();
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: any) => { //i know
    setIsLoading(true);
    setErrorMsg('');
    try {
      await axios.post(`${AUTH_SERVICE_URL}/auth/signup`, {
        email: data.email,
        password: data.password,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
      });

      router.push('/auth/login');
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message;
      setErrorMsg(Array.isArray(message) ? message[0] : (message || 'Registration failed'));
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
            <input
              type="text"
              placeholder="Username"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              {...register('username', { required: true })}
            />
            <input
              type="email"
              placeholder="Email address"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              {...register('email', { required: true })}
            />
            <div className="flex gap-2">
                <input
                type="text"
                placeholder="First Name"
                className="block w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register('firstName', { required: true })}
                />
                <input
                type="text"
                placeholder="Last Name"
                className="block w-1/2 rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register('lastName', { required: true })}
                />
            </div>
            <div>
                <label className="text-xs text-gray-500">Date of Birth</label>
                <input
                type="date"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                {...register('dateOfBirth', { required: true })}
                />
            </div>
            <input
              type="password"
              placeholder="Password"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              {...register('password', { required: true, minLength: 6 })}
            />
          </div>

          {errorMsg && (
            <div className="text-sm text-red-500 text-center">{errorMsg}</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400"
          >
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