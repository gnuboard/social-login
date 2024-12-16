import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

// 게시판 수정
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const { title, description, category } = await request.json();
    const connection = await pool.getConnection();
    
    try {
      await connection.execute(
        'UPDATE boards SET title = ?, description = ?, category = ?, updated_at = NOW() WHERE id = ?',
        [title, description, category, params.id]
      );
      
      return NextResponse.json({ message: '게시판이 수정되었습니다.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('게시판 수정 에러:', error);
    return NextResponse.json(
      { error: '게시판 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시판 삭제
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: '인증되지 않은 요청입니다.' }, { status: 401 });
    }

    const { permanent } = await request.json();
    const connection = await pool.getConnection();
    
    try {
      if (permanent) {
        // 영구 삭제
        await connection.execute(
          'DELETE FROM boards WHERE id = ?',
          [params.id]
        );
      } else {
        // 소프트 삭제
        await connection.execute(
          'UPDATE boards SET deleted_at = NOW() WHERE id = ?',
          [params.id]
        );
      }
      
      return NextResponse.json({ message: '게시판이 삭제되었습니다.' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('게시판 삭제 에러:', error);
    return NextResponse.json(
      { error: '게시판 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 