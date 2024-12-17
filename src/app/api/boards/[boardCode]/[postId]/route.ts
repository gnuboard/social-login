import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { boardCode: string; postId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    console.log('Current session:', session);

    const [userResult] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [session?.user?.email]
    );
    const userId = userResult?.[0]?.id;
    console.log('User lookup:', { 
      email: session?.user?.email, 
      foundUserId: userId 
    });

    const { boardCode, postId } = params;
    console.log('Request params:', { boardCode, postId });

    const [posts] = await connection.execute(`
      SELECT 
        p.*,
        v.user_id as vote_user_id,
        v.vote_type as raw_vote_type,
        CASE 
          WHEN v.vote_type = 1 THEN true
          WHEN v.vote_type = 0 THEN false
          ELSE NULL 
        END as user_vote
      FROM posts p
      LEFT JOIN votes v ON p.id = v.post_id AND v.user_id = ?
      WHERE p.id = ?
    `, [userId, postId]);

    console.log('Query result:', {
      userId,
      postData: posts[0],
      voteInfo: {
        vote_user_id: posts[0]?.vote_user_id,
        raw_vote_type: posts[0]?.raw_vote_type,
        user_vote: posts[0]?.user_vote
      }
    });

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(posts[0]);

  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { boardCode: string; postId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const { boardCode, postId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), {
        status: 401,
      });
    }

    // 기존 게시글 조회
    const [posts] = await connection.execute(`
      SELECT p.*, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.board_id = (
        SELECT id FROM boards WHERE code = ?
      )
    `, [postId, boardCode]);

    if (!Array.isArray(posts) || posts.length === 0) {
      return new Response(JSON.stringify({ error: '게시글을 찾을 수 없습니다.' }), {
        status: 404,
      });
    }

    const post = posts[0];

    // 작성자 권한 확인
    if (post.user_email !== session.user.email) {
      return new Response(JSON.stringify({ error: '���시글을 수정할 권한이 없습니다.' }), {
        status: 403,
      });
    }

    const body = await request.json();

    // 게시글 업데이트
    await connection.execute(`
      UPDATE posts 
      SET 
        title = ?,
        content = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [body.title, body.content, postId]);

    return new Response(JSON.stringify({ message: '게시글이 수정되었습니다.' }), { 
      status: 200 
    });
    
  } catch (error) {
    console.error('게시글 수정 중 오류 발생:', error);
    return new Response(JSON.stringify({ error: '게시글 수정에 실패했습니다.' }), {
      status: 500,
    });
  } finally {
    connection.release();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { boardCode: string; postId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const { boardCode, postId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 게시글 조회 및 작성자 확인
    const [posts] = await connection.execute(`
      SELECT p.*, u.email as user_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ? AND p.board_id = (
        SELECT id FROM boards WHERE code = ?
      )
    `, [postId, boardCode]);

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 작성자 권한 확인
    if (posts[0].user_email !== session.user.email) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 삭제
    await connection.execute(`
      DELETE FROM posts 
      WHERE id = ?
    `, [postId]);

    return NextResponse.json(
      { message: '게시글이 성공적으로 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('게시글 삭제 에러:', error);
    return NextResponse.json(
      { error: '게시글 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
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

    // 사용자 정보 조회 부분 수정
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

    // 게시글 작성 쿼리 수정
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