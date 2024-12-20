import Link from 'next/link';

export default async function ProjectsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 프로젝트 등록 버튼 */}
      <div className="flex justify-end mb-6">
        <Link href="/projects/new">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            프로젝트 등록
          </button>
        </Link>
      </div>

      {/* 필터 섹션 */}
      <div className="mb-6">
        <div className="flex gap-4 flex-wrap">
          <select className="border rounded-lg px-3 py-2">
            <option>기술 스택</option>
          </select>
          <select className="border rounded-lg px-3 py-2">
            <option>진행 상태</option>
          </select>
          <select className="border rounded-lg px-3 py-2">
            <option>예산 범위</option>
          </select>
        </div>
      </div>

      {/* 프로젝트 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 프로젝트 카드 */}
        <div className="border rounded-lg p-4">
          <span className="inline-block px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">모집중</span>
          <h3 className="text-lg font-semibold mt-2">프로젝트 제목</h3>
          <p className="text-sm text-gray-600 mt-1">프로젝트 설명...</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">React</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">Node.js</span>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>예산: 1000만원</p>
            <p>기간: 3개월</p>
            <p>모집인원: 2명</p>
          </div>
        </div>
      </div>
    </div>
  );
} 