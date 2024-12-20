import Image from 'next/image';
import Link from 'next/link';
import { FaHandshake, FaUsers, FaLaptopCode } from 'react-icons/fa';

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
            개발자를 위한 신뢰할 수 있는 의뢰와 구인 플랫폼
          </p>
        </div>

        {/* 특징 섹션 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <FaHandshake className="text-blue-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">프로젝트 매칭</h3>
            <p className="text-gray-600">
              검증된 클라이언트와 개발자를 연결하여 신뢰할 수 있는 프로젝트 매칭을 제공합니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">인재 채용</h3>
            <p className="text-gray-600">
              실력있는 개발자와 좋은 기업을 연결하는 최적의 채용 플랫폼입니다.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <FaLaptopCode className="text-green-600 text-xl" />
            </div>
            <h3 className="text-lg font-semibold mb-2">기술 중심</h3>
            <p className="text-gray-600">
              다양한 기술 스택과 전문성을 바탕으로 최적의 매칭을 제공합니다.
            </p>
          </div>
        </div>

        {/* 장점 섹션 */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">DevWant의 특별함</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">검증된 프로젝트</h3>
                <p className="text-gray-600">모든 프로젝트는 검토 과정을 거쳐 신뢰할 수 있는 프로젝트만 등록됩니다.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">실력 있는 개발자</h3>
                <p className="text-gray-600">포트폴리오와 경력을 검증하여 실력 있는 개발자들이 활동합니다.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">안전한 계약과 정산</h3>
                <p className="text-gray-600">표준 계약서와 에스크로 시스템으로 안전한 거래를 보장합니다.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center">
          <Link 
            href="/projects" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors mr-4"
          >
            프로젝트 둘러보기
          </Link>
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center px-8 py-3 border border-blue-600 text-base font-medium rounded-full text-blue-600 hover:bg-blue-50 transition-colors"
          >
            회원가입하기
          </Link>
        </div>
      </div>
    </div>
  );
} 