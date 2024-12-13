"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

const Header = () => {
  const { data: session, status } = useSession();

  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/next.svg"
                alt="Next.js Logo"
                width={100}
                height={20}
                className="dark:invert"
                priority
              />
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/about" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                소개
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin/dashboard" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  관리자
                </Link>
              )}
            </nav>
          </div>

          <nav className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : session ? (
              <>
                <span className="text-sm text-gray-600">
                  {session.user?.email}
                </span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  로그인
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 