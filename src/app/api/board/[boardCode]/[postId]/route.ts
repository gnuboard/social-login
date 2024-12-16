import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { boardCode: string; postId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const [posts] = await connection.execute(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.updated_at,
        u.author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN boards b ON p.board_id = b.id
      WHERE p.id = ? AND b.code = ?
    `, [params.postId, params.boardCode]);

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(posts[0], { status: 200 });

  } catch (error) {
    console.error('게시글 조회 에러:', error);
    return NextResponse.json(
      { error: '게시글 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 