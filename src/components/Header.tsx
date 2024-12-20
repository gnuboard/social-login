"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { Menu, ChevronDown } from 'lucide-react';

const Header = () => {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isAdmin = session?.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  const handleLogout = () => {
    signOut({ 
      callbackUrl: '/',
      redirect: true
    });
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg shadow-md" />
                <span className="text-xl font-bold text-gray-900">DevWant</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/boards/requests" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                의뢰
              </Link>
              <Link 
                href="/boards/jobs" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                구인
              </Link>
              <Link 
                href="/about" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                About
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

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <nav className="hidden md:flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse">
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : session ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <span>{session.user?.name || '사용자'}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      프로필
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
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

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 bg-white/80 backdrop-blur-md absolute left-0 right-0">
            <div className="flex flex-col space-y-3 px-4 text-right">
              <Link 
                href="/boards/requests" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                의뢰
              </Link>
              <Link 
                href="/boards/jobs" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                구인
              </Link>
              <Link 
                href="/about" 
                className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                About
              </Link>
              {isAdmin && (
                <Link 
                  href="/admin/dashboard" 
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  관리자
                </Link>
              )}
              {session && (
                <button 
                  onClick={handleLogout}
                  className="w-full text-right text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  로그아웃
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 