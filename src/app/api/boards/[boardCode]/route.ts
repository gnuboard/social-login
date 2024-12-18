// src/app/api/board/[boardCode]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Post } from '@/types';
import { getServerSession } from 'next-auth/next';

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
    
    // console.log('게시판 조회 결과:', boardResult);
    
    if (!Array.isArray(boardResult) || boardResult.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 게시판입니다.' },
        { status: 404 }
      );
    }
    
    const board = boardResult[0];
    const boardId = board.id;
    
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
        p.view_count,
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 1) as like_count,
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 0) as dislike_count
      FROM posts p
      WHERE p.board_id = ?
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [posts] = await pool.query<Post[]>(
      query,
      [boardId, limit, offset]
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

export async function POST(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const { boardCode } = await params;
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: '제목과 내용은 필수 입력사항입니다.' },
        { status: 400 }
      );
    }

    const { title, content } = body;

    // 게시판 존재 여부 확인
    const [boards] = await connection.execute(`
      SELECT id FROM boards WHERE code = ?
    `, [boardCode]);

    if (!Array.isArray(boards) || boards.length === 0) {
      return NextResponse.json(
        { error: '게시판을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const boardId = boards[0].id;

    // 사용자 정보 조회
    const [users] = await connection.execute(`
      SELECT id, name FROM users WHERE email = ?
    `, [session.user.email]);

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = users[0].id;
    const author = users[0].name;

    // 게시글 작성
    const [result] = await connection.execute(`
      INSERT INTO posts (title, content, user_id, board_id, author, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [title, content, userId, boardId, author]);

    return NextResponse.json({
      message: '게시글이 성공적으로 작성되었습니다.',
      // @ts-ignore
      postId: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('게시글 작성 에러:', error);
    return NextResponse.json(
      { error: '게시글 작성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}