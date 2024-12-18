import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import pool from '@/lib/db';

interface Comment {
  id: number;
  content: string;
  author: string;
  created_at: string;
  parentId: number | null;
  replies?: Comment[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { boardCode: string; postId: string } }
) {
  let connection;
  
  try {
    connection = await pool.getConnection();
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    // 원글과 대댓글을 함께 조회
    const [rows] = await connection.query(
      `SELECT 
        c.*,
        u.name as author_name,
        mu.name as mentioned_user_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN users mu ON c.mentioned_user_id = mu.id
       WHERE c.post_id = ?
       ORDER BY 
        COALESCE(c.parent_id, c.id),
        c.created_at ASC`,
      [postId]
    );
    
    // 댓글 트리 구조로 변환
    const commentMap = new Map();
    const mainComments = [];

    (rows as any[]).forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
      
      if (comment.parent_id === null) {
        mainComments.push(comment);
      } else {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          parentComment.replies.push(comment);
        }
      }
    });
    
    return NextResponse.json(mainComments);
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
  let connection;
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { content, parentId, mentionedUserId } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;
    const userId = session.user?.id;
    const author = session.user?.name || '익명';

    // 부모 댓글이 존재하는지 확인 (대댓글인 경우)
    if (parentId) {
      const [parentComment] = await connection.query(
        'SELECT id FROM comments WHERE id = ? AND post_id = ?',
        [parentId, postId]
      );

      if (!(parentComment as any[]).length) {
        throw new Error('존재하지 않는 댓글입니다.');
      }
    }

    // 멘션된 사용자가 존재하는지 확인
    if (mentionedUserId) {
      const [mentionedUser] = await connection.query(
        'SELECT id FROM users WHERE id = ?',
        [mentionedUserId]
      );

      if (!(mentionedUser as any[]).length) {
        throw new Error('존재하지 않는 사용자입니다.');
      }
    }

    // 댓글 저장
    const [result] = await connection.query(
      `INSERT INTO comments 
        (content, author, user_id, post_id, parent_id, mentioned_user_id, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [content, author, userId, postId, parentId || null, mentionedUserId || null]
    );

    // 게시글의 댓글 수 업데이트
    await connection.query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
      [postId]
    );

    // 새로 작성된 댓글 조회
    const [newComment] = await connection.query(
      `SELECT 
        c.*,
        u.name as author_name,
        mu.name as mentioned_user_name
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN users mu ON c.mentioned_user_id = mu.id
       WHERE c.id = ?`,
      [(result as any).insertId]
    );

    await connection.commit();
    return NextResponse.json(newComment[0]);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('댓글 작성 에러:', error);
    return NextResponse.json(
      { error: error.message || '댓글 작성에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
