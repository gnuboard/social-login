import Image from 'next/image';
import Link from 'next/link';
import { FaHandshake, FaUsers, FaLaptopCode } from 'react-icons/fa';
import { Metadata } from 'next';

// Metadata 설정
export const metadata: Metadata = {
  title: 'DevWant - About',
  description: '개발자 의뢰 및 구인 게시판 소개',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            DevWant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            개발자 의뢰 및 구인 게시판
          </p>
        </div>

        {/* 주요 기능 섹션 */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaHandshake className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">의뢰 게시판</h3>
            <p className="text-gray-600">
              프로젝트 의뢰 글을 작성하고 개발자를 찾을 수 있습니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">구인 게시판</h3>
            <p className="text-gray-600">
              개발자 채용 공고를 작성하고 인재를 찾을 수 있습니다.
            </p>
          </div>
        </div>

        {/* 회원가입 섹션 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-16 text-center">
          <h2 className="text-2xl font-bold mb-4">소셜 로그인으로 간편 가입</h2>
          <p className="text-gray-600 mb-6">
            DevWant는 소셜 로그인을 통해 간편하게 서비스를 이용할 수 있습니다.<br/>
            아래 버튼을 클릭하여 로그인 페이지로 이동해주세요.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            로그인 페이지로 이동
          </Link>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center">
          <Link 
            href="/boards/requests" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors mr-4"
          >
            의뢰 게시판
          </Link>
          <Link 
            href="/boards/jobs" 
            className="inline-flex items-center justify-center px-8 py-3 border border-blue-600 text-base font-medium rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
          >
            구인 게시판
          </Link>
        </div>
      </div>
    </div>
  );
} 