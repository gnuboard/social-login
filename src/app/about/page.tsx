import { FaGoogle, FaComment } from 'react-icons/fa';
import Link from 'next/link';
import { SiNaver } from 'react-icons/si';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            소셜 로그인 서비스
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            간편하고 안전한 소셜 미디어 계정으로 로그인하세요
          </p>
        </div>

        {/* 특징 섹션 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaGoogle className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Google 로그인</h3>
            <p className="text-gray-600">
              Google 계정을 사용하여 빠르고 안전하게 로그인하세요. 별도의 회원가입이 필요 없습니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <FaComment className="text-yellow-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Kakao 로그인</h3>
            <p className="text-gray-600">
              카카오톡 계정으로 간편하게 로그인하세요. 국내에서 가장 많이 사용되는 메신저 기반 인증입니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <SiNaver className="text-green-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Naver 로그인</h3>
            <p className="text-gray-600">
              네이버 계정으로 안전하게 로그인하세요. 국내 최대 포털 사이트의 신뢰할 수 있는 인증 시스템입니다.
            </p>
          </div>
        </div>

        {/* 장점 섹션 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">소셜 로그인의 장점</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">간편한 로그인</h3>
                <p className="text-gray-600">별도의 아이디와 비밀번호를 기억할 필요 없이 이미 사용중인 계정으로 빠르게 로그인할 수 있습니다.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">높은 보안성</h3>
                <p className="text-gray-600">검증된 플랫폼의 보안 시스템을 활용하여 안전하게 인증할 수 있습니다.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">추가 정보 연동</h3>
                <p className="text-gray-600">프로필 정보를 자동으로 가져와 별도의 정보 입력 없이 서비스를 시작할 수 있습니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center">
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            지금 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
} 