// apps/client_app/src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react'; // 1. Импортируем useState

export default function Navbar() {
  const router = useRouter();
  const [search, setSearch] = useState(''); // 2. Состояние для поиска

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/auth/login');
  };

  // 3. Обработчик поиска
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      // Переходим на профиль пользователя по введенному юзернейму
      router.push(`/profile/${search.trim()}`);
      setSearch(''); // Очищаем поле
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Логотип */}
          <div className="flex items-center shrink-0">
            <Link href="/feed" className="text-2xl font-bold text-indigo-600">
              Innogram
            </Link>
          </div>
          
          {/* 4. Поле поиска (по центру) */}
          <form onSubmit={handleSearch} className="hidden md:block mx-8 flex-1 max-w-md">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search users (enter username)..."
                    className="w-full bg-gray-100 border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500">
                    🔍
                </button>
            </div>
          </form>

          {/* Меню справа */}
          <div className="flex items-center space-x-6">
             {/* Ссылка на Ленту */}
             <Link 
              href="/feed"
              className="text-gray-600 hover:text-indigo-600 font-medium text-xl"
              title="Feed"
            >
              🏠
            </Link>

            {/* Ссылка на Чат (Добавлено) */}
            <Link 
              href="/chat"
              className="text-gray-600 hover:text-indigo-600 font-medium text-xl"
              title="Messages"
            >
              💬
            </Link>
            
            <Link 
              href="/profile/me"
              className="text-gray-600 hover:text-indigo-600 font-medium"
            >
              Profile
            </Link>

            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500 text-sm font-medium border-l pl-4 ml-2"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}