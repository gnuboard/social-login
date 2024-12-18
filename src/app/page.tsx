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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center w-full max-w-6xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={180}
            height={38}
            priority
          />
        </div>

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

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-8">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
    </div>
  );
}
