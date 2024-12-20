"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import GoogleIcon from '@/components/icons/GoogleIcon';
import KakaoIcon from '@/components/icons/KakaoIcon';
import NaverIcon from '@/components/icons/NaverIcon';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

const SignupPage: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { handleGoogleSignIn } = useGoogleAuth();

  if (status === 'loading') {
    return null;
  }

  if (status === 'authenticated') {
    return (
      <div className="flex items-start justify-center pt-20 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-yellow-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              이미 로그인되어 있습니다
            </h2>
            <p className="text-gray-600 mb-6">
              {session.user?.email} 계정으로 로그인된 상태입니다.
            </p>
            <div className="space-y-4">
              <Link 
                href="/"
                className="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                홈으로 돌아가기
              </Link>
              <button 
                onClick={() => router.back()}
                className="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                이전 페이지로
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-center pt-20 bg-[#fafafa] dark:bg-gray-900 min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 z-0" />
      
      {/* Glass morphism effect circles */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-24 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute top-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              회원가입
            </h2>
            <p className="mt-3 text-gray-500">
              소셜 계정으로 간편하게 가입하세요
            </p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              className="group w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <GoogleIcon />
              <span className="ml-4 text-gray-700 dark:text-gray-200 font-medium">Google로 회원가입</span>
            </button>

            <button className="group w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-[#03C75A] hover:bg-[#02b351] transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg">
              <NaverIcon className="text-white" />
              <span className="ml-4 text-white font-medium">네이버로 회원가입</span>
            </button>

            <button className="group w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-[#FEE500] hover:bg-[#FDD800] transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg">
              <KakaoIcon />
              <span className="ml-4 text-gray-800 font-medium">카카오로 회원가입</span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              이미 계정이 있으신가요?{' '}
              <Link 
                href="/login" 
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 