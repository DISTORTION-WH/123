'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios'; 
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { register, handleSubmit, setError, formState: { errors } } = useForm();

  const onSubmit = async (data: unknown) => { //2 i fix this later, i know that its a bad practice
    try {
      
const response = await api.post('/auth/login', data);      
      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      
      router.push('/feed');
    } catch (err: unknown) { //2 i fix this later, i know that its a bad practice
      console.error(err);
      setError('root', { message: 'Invalid credentials' });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">InnoTok Login</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              {...register('email', { required: true })}
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              {...register('password', { required: true })}
              type="password"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            />
          </div>

          {errors.root && <p className="text-red-500 text-sm">{errors.root.message as string}</p>}

          <button 
            type="submit"
            className="w-full flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Sign In
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">Don&apos;t have an account? <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-500">Sign Up</Link>
        </div>
      </div>
    </div>
  );
}