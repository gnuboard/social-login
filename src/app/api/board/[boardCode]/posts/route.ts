import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  try {
    // 1. 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const connection = await pool.getConnection();

    try {
      // 2. 이메일로 사용자 정보 조회
      const [users] = await connection.execute(
        'SELECT id FROM users WHERE email = ?',
        [userEmail]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return NextResponse.json(
          { error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const userId = users[0].id;

      // 3. 요청 본문 파싱
      const { title, content } = await request.json();

      if (!title || !content) {
        return NextResponse.json(
          { error: '제목과 내용은 필수입니다.' },
          { status: 400 }
        );
      }

      // 4. 게시판 확인
      const { boardCode } = await params;
      const [boards] = await connection.execute(
        'SELECT id FROM boards WHERE code = ?',
        [boardCode]
      );

      if (!Array.isArray(boards) || boards.length === 0) {
        return NextResponse.json(
          { error: '존재하지 않는 게시판입니다.' },
          { status: 404 }
        );
      }

      const boardId = boards[0].id;

      // 5. 게시글 생성
      await connection.execute(
        'INSERT INTO posts (title, content, board_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [title, content, boardId, userId]
      );

      return NextResponse.json(
        { message: '게시글이 작성되었습니다.' },
        { status: 201 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('게시글 작성 에러:', error);
    return NextResponse.json(
      { error: '게시글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const { boardCode } = await params;

    // 디버깅을 위한 로그 추가
    console.log('postId:', postId);
    console.log('boardCode:', boardCode);

    if (!postId) {
      return NextResponse.json(
        { error: '게시글 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const [posts] = await connection.execute(`
      SELECT 
        p.id,
        p.title,
        p.content,
        p.created_at,
        p.updated_at,
        p.author
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN boards b ON p.board_id = b.id
      WHERE p.id = ? AND b.code = ?
    `, [postId, boardCode]);

    // 쿼리 결과 디버깅
    console.log('조회된 게시글:', posts);

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
