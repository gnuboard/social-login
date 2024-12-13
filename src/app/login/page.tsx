"use client";

import type { NextPage } from 'next';
import Link from 'next/link';
import GoogleIcon from '@/components/icons/GoogleIcon';
import KakaoIcon from '@/components/icons/KakaoIcon';
import NaverIcon from '@/components/icons/NaverIcon';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useNaverAuth } from '@/hooks/useNaverAuth';

const LoginPage: NextPage = () => {
  const { handleGoogleSignIn } = useGoogleAuth();
  const { handleNaverSignIn } = useNaverAuth();

  return (
    <div className="flex items-start justify-center pt-20 bg-[#fafafa] dark:bg-gray-900 min-h-screen">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 z-0" />
      
      {/* Glass morphism effect circles */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-24 right-1/4 w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute top-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="backdrop-blur-lg bg-white/80 dark:bg-gray-800/80 p-8 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              로그인
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              소셜 계정으로 간편하게 시작하세요
            </p>
          </div>

          <div className="space-y-5">
            <button 
              onClick={handleGoogleSignIn}
              className="group w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <GoogleIcon />
              <span className="ml-4 text-gray-700 dark:text-gray-200 font-medium">Google로 계속하기</span>
            </button>

            <button className="group w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-[#FEE500] hover:bg-[#FDD800] transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg">
              <KakaoIcon />
              <span className="ml-4 text-gray-800 font-medium">카카오로 계속하기</span>
            </button>

            <button 
              onClick={handleNaverSignIn}
              className="group w-full flex items-center justify-center px-6 py-4 rounded-2xl bg-[#03C75A] hover:bg-[#02b351] transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <NaverIcon />
              <span className="ml-4 text-white font-medium">네이버로 계속하기</span>
            </button>
          </div>

          <div className="mt-10 text-center">
            <p className="text-gray-600 dark:text-gray-300">
              계정이 없으신가요?{' '}
              <Link 
                href="/signup" 
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 