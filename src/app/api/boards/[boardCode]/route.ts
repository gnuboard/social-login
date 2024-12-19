// src/app/api/board/[boardCode]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Post } from '@/types';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

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
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 0) as dislike_count,
        p.comments_count
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
  const session = await getServerSession(authOptions);
  
  if (!session) {
    connection.release();
    return NextResponse.json(
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const { boardCode } = await params;
    const { title, content, parent_id, grp_id, grp_seq, depth } = await request.json();

    // 사용자 ID 조회
    const [userResult] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [session.user?.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const userId = userResult[0].id;

    // 게시판 ID 조회
    const [boardResult] = await connection.query(
      'SELECT id FROM boards WHERE code = ?',
      [boardCode]
    );
    
    if (!Array.isArray(boardResult) || boardResult.length === 0) {
      throw new Error('존재하지 않는 게시판입니다.');
    }
    
    const boardId = boardResult[0].id;

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 답글인 경우 grp_seq 업데이트
    if (parent_id) {
      await connection.query(
        `UPDATE posts 
         SET grp_seq = grp_seq + 1 
         WHERE board_id = ? AND grp_id = ? AND grp_seq > ?`,
        [boardId, grp_id, grp_seq - 1]
      );
    }

    // 게시글 저장
    const [result] = await connection.query(
      `INSERT INTO posts (
        board_id, title, content,
        grp_id, grp_seq, depth, 
        user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        boardId, title, content,
        grp_id || null, grp_seq, depth,
        userId
      ]
    );

    await connection.commit();
    
    return NextResponse.json({ id: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}