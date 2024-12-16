import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

// 게시판 목록 조회
export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [boards] = await connection.execute(
        'SELECT * FROM boards ORDER BY created_at DESC'
      );
      
      return NextResponse.json({ boards });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('게시판 목록 조회 에러:', error);
    return NextResponse.json(
      { error: '게시판 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시판 생성
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const { code, title, description, category } = await request.json();
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'INSERT INTO boards (code, title, description, category, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [code, title, description, category]
      );
      
      return NextResponse.json({ message: '게시판이 생성되었습니다.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('게시판 생성 에러:', error);
    return NextResponse.json(
      { error: '게시판 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 