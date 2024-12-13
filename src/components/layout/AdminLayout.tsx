import Link from 'next/link';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      {/* 왼쪽 사이드바 */}
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">관리자 대시보드</h1>
        </div>
        <nav className="mt-4">
          <ul className="space-y-2">
            <li>
              <Link href="/admin" className="block px-4 py-2 hover:bg-gray-700">
                대시보드
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className="block px-4 py-2 hover:bg-gray-700">
                회원관리
              </Link>
            </li>
            <li>
              <Link href="/admin/boards" className="block px-4 py-2 hover:bg-gray-700">
                게시판관리
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="block px-4 py-2 hover:bg-gray-700">
                환경설정
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
