// src/app/api/board/[boardCode]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Post } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  try {
    const { boardCode } = await params;
    console.log('요청된 게시판 코드:', boardCode);
    
    const [boardResult] = await pool.query(
      'SELECT * FROM boards WHERE code = ?',
      [boardCode]
    );
    
    console.log('게시판 조회 결과:', boardResult);
    
    if (!Array.isArray(boardResult) || boardResult.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 게시판입니다.' },
        { status: 404 }
      );
    }
    
    const board = boardResult[0];
    
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id,
        p.title,
        p.author,
        p.created_at,
        p.view_count
      FROM posts p
      INNER JOIN boards b ON p.board_id = b.id
      WHERE b.code = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [posts] = await pool.query<Post[]>(
      query,
      [boardCode, limit, offset]
    );

    return NextResponse.json(posts);
    
  } catch (error) {
    console.error('상세 에러 정보:', error);
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}