import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from 'mysql2';
import { createThumbnail, deleteThumbnail } from '@/lib/thumbnailUtils';

interface UserResult extends RowDataPacket {
  id: number;
  email: string;
  name: string;
}

interface PostResult extends RowDataPacket {
  id: number;
  user_email: string;
  vote_user_id: number;
  raw_vote_type: number;
  user_vote: boolean | null;
  // 다른 필요한 필드들도 추가
}

export async function GET(
  request: NextRequest,
  { params }: { params: { boardCode: string; postId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    const { boardCode, postId } = await Promise.resolve(params);
    
    // 세션 기반 조회수 중복 방지를 위한 키 생성
    const viewKey = `post_${postId}_viewed`;
    const hasViewed = request.cookies.get(viewKey);

    const [userResult] = await connection.execute<UserResult[]>(
      'SELECT id FROM users WHERE email = ?',
      [session?.user?.email]
    );
    const userId = userResult?.[0]?.id;

    // 게시글 데이터 먼저 조회
    const [posts] = await connection.execute<PostResult[]>(`
      SELECT 
        p.*,
        v.user_id as vote_user_id,
        v.vote_type as raw_vote_type,
        CASE 
          WHEN v.vote_type = 1 THEN true
          WHEN v.vote_type = 0 THEN false
          ELSE NULL 
        END as user_vote,
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 1) as like_count,
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 0) as dislike_count
      FROM posts p
      LEFT JOIN votes v ON p.id = v.post_id AND v.user_id = ?
      WHERE p.id = ?
    `, [userId, postId]);

    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' }, 
        { status: 404 }
      );
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    try {
      // 조회수 업데이트를 위한 락 획득과 함께 조회
      const [viewCheckResult] = await connection.execute(`
        SELECT view_count 
        FROM posts 
        WHERE id = ? 
        FOR UPDATE
      `, [postId]);

      // 조회 기록이 없을 경우에만 조회수 증가
      if (!hasViewed) {
        await connection.execute(`
          UPDATE posts 
          SET view_count = view_count + 1 
          WHERE id = ?
        `, [postId]);
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

    if (posts[0]) {
      const post = posts[0];
      post.user_vote = post.raw_vote_type === null ? null :
                       post.raw_vote_type === 1 ? true : false;
    }

    const response = NextResponse.json(posts[0]);
    
    // 쿠키 설정 (24시간 유효)
    if (!hasViewed) {
      response.cookies.set(viewKey, 'true', {
        maxAge: 86400,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    }

    return response;

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

    // 현재 로그인한 사용자의 ID 조회
    const [userResult] = await connection.execute<UserResult[]>(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!userResult || userResult.length === 0) {
      return new Response(JSON.stringify({ error: '사용자를 찾을 수 없습니다.' }), {
        status: 404,
      });
    }

    const currentUserId = userResult[0].id;
    console.log('현재 사용자 ID:', currentUserId);

    // 게시글 조회 시 user_id 비교를 위해 수정
    const [posts] = await connection.execute<PostResult[]>(`
      SELECT p.*
      FROM posts p
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
    console.log('게시글 정보:', post);
    console.log('게시글 작성자 ID:', post.user_id);

    // user_id로 권한 확인
    if (post.user_id !== currentUserId) {
      console.log('권한 검사 실패 - 게시글 작성자 ID:', post.user_id, '현재 사용자 ID:', currentUserId);
      return new Response(JSON.stringify({ error: '게시글을 수정할 권한이 없습니다.' }), {
        status: 403,
      });
    }

    // 기존 썸네일 삭제
    const [existingPost] = await connection.execute(
      'SELECT thumbnail FROM posts WHERE id = ?',
      [postId]
    );
    
    if (Array.isArray(existingPost) && existingPost.length > 0) {
      await deleteThumbnail(existingPost[0].thumbnail);
    }

    const body = await request.json();
    const thumbnail = await createThumbnail(body.content);

  // 게시글 업데이트 쿼리
  await connection.execute(`
    UPDATE posts 
    SET 
      title = ?,
      content = ?,
      thumbnail = ?,
      category_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [body.title, body.content, thumbnail, body.category_id, postId]);

    return new Response(JSON.stringify({ message: '게시글이 성공적으로 수정되었습니다.' }), { 
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

    // 작자 권한 확인
    if (posts[0].user_email !== session.user.email) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    try {
      // 게시글 삭제
      await connection.execute(`
        DELETE FROM posts 
        WHERE id = ?
      `, [postId]);

      // posts_count 감소
      await connection.execute(`
        UPDATE boards 
        SET posts_count = posts_count - 1 
        WHERE code = ?
      `, [boardCode]);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }

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
