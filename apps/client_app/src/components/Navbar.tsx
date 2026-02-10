'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/auth/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/feed" className="text-2xl font-bold text-indigo-600">
              Innogram
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
             <Link 
              href="/create"
              className="text-gray-600 hover:text-indigo-600 font-medium"
            >
              + Create Post
            </Link>
            
            <Link 
              href="/profile/me"
              className="text-gray-600 hover:text-indigo-600 font-medium"
            >
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}