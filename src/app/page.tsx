import Image from "next/image";
import Link from "next/link";
import pool from "@/lib/db";
import { FaCode, FaUsers } from "react-icons/fa";

async function getBoards() {
  const connection = await pool.getConnection();
  try {
    const [boards] = await connection.execute(`
      SELECT 
        b.*,
        COUNT(p.id) as posts_count
      FROM boards b
      LEFT JOIN posts p ON b.id = p.board_id AND p.deleted_at IS NULL
      WHERE b.deleted_at IS NULL
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);
    return boards;
  } finally {
    connection.release();
  }
}

export default async function Home() {
  const boards = await getBoards();

  return (
    <div className="flex flex-col items-center h-full min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 sm:p-8">
      <main className="flex flex-col gap-6 items-center w-full max-w-6xl mt-6">
        <div className="w-full text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            DevWant
          </h1>
          <p className="text-lg text-gray-600">개발자를 위한 의뢰와 구인 플랫폼</p>
        </div>

        <div className="w-full grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <FaCode className="text-2xl text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">개발자가 원해요</h2>
            </div>
            <p className="text-gray-600 mb-6">프로젝트 의뢰를 찾고 계신가요? 다양한 개발 의뢰를 확인해보세요.</p>
            <Link href="/boards/requests" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              의뢰 게시판 바로가기 →
            </Link>
          </div>
          <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <FaUsers className="text-2xl text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">개발자를 원해요</h2>
            </div>
            <p className="text-gray-600 mb-6">개발자를 찾고 계신가요? 구인 공고를 등록하고 인재를 찾아보세요.</p>
            <Link href="/boards/jobs" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              구인 게시판 바로가기 →
            </Link>
          </div>
        </div>

        <div className="w-full bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">게시판 목록</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {boards.length > 0 ? (
              boards.map((board: any) => (
                <Link 
                  key={board.id}
                  href={`/boards/${board.code}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <h3 className="text-base font-medium text-gray-900">
                      {board.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {board.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>게시글 {board.posts_count}개</span>
                    <span>›</span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                등록된 게시판이 없습니다.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
