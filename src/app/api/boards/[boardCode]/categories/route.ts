import { NextRequest } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  try {
    const { boardCode } = await params;
    
    const [boardResult] = await pool.query(
      'SELECT id FROM boards WHERE code = ?',
      [boardCode]
    );

    if (!boardResult || !boardResult[0]) {
      return Response.json(
        { error: '존재하지 않는 게시판입니다.' },
        { status: 404 }
      );
    }

    const [categories] = await pool.query(
      'SELECT id, name FROM categories WHERE board_id = ? ORDER BY created_at ASC',
      [boardResult[0].id]
    );

    return Response.json(categories);
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return Response.json(
      { error: '카테고리 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
