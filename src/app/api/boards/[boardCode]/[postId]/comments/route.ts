import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { boardCode: string; postId: string } }
) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    console.log('댓글 조회 요청:', { postId });

    // 먼저 게시글이 존재하는지 확인
    const [posts] = await connection.query(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (!(posts as any[]).length) {
      return NextResponse.json(
        { error: '존재하지 않는 게시글입니다.' },
        { status: 404 }
      );
    }

    const [rows] = await connection.query(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
      [postId]
    );
    
    console.log('조회된 댓글:', rows);
    
    return NextResponse.json(rows || []);
  } catch (error) {
    console.error('댓글 조회 에러:', error);
    return NextResponse.json(
      { error: '댓글 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { boardCode: string; postId: string } }
) {
  const connection = await pool.getConnection();
  const resolvedParams = await Promise.resolve(params);
  const postId = resolvedParams.postId;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { content } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const author = session.user?.name || '익명';
    const userId = session.user?.id;

    await connection.beginTransaction();

    const [result] = await connection.query(
      'INSERT INTO comments (content, author, user_id, post_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [content, author, userId, postId]
    );

    await connection.query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
      [postId]
    );

    const [newComment] = await connection.query(
      'SELECT * FROM comments WHERE id = ?',
      [(result as any).insertId]
    );

    await connection.commit();
    return NextResponse.json(newComment[0]);
  } catch (error) {
    await connection.rollback();
    console.error('댓글 작성 에러:', error);
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
