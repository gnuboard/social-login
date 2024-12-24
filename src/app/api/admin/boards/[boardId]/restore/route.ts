import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE boards SET deleted_at = NULL WHERE id = ?',
        [params.id]
      );
      
      return NextResponse.json({ message: '게시판이 복구되었습니다.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('게시판 복구 에러:', error);
    return NextResponse.json(
      { error: '게시판 복구 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 