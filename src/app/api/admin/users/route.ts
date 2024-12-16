import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.execute(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      
      return NextResponse.json({ users });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('사용자 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '사용자 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 