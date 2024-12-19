import Image from "next/image";
import Link from "next/link";
import pool from "@/lib/db";

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
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8">
      <main className="flex flex-col gap-8 items-center w-full max-w-6xl mt-8">
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
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
                    <h3 className="text-lg font-medium text-gray-900">
                      {board.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
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
