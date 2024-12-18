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

    // 댓글 조회 쿼리는 그대로 유지
    const [rows] = await connection.query(
      `SELECT 
        c.*,
        u.name as author_name,
        u.id as user_id,
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
    
    // 댓글 트리 구조로 변환하는 부분 수정
    const commentMap = new Map();
    const mainComments: any[] = [];

    (rows as any[]).forEach(comment => {
      // 기본 댓글 객체 구조 생성
      const commentObj = {
        ...comment,
        replies: [],
        author: comment.author_name || comment.author // author_name이 없으면 author 사용
      };
      
      commentMap.set(comment.id, commentObj);
      
      if (comment.parent_id === null) {
        mainComments.push(commentObj);
      } else {
        const parentComment = commentMap.get(comment.parent_id);
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(commentObj);
        }
      }
    });

    // 디버깅을 위한 로그 추가
    console.log('Total comments:', rows.length);
    console.log('Main comments:', mainComments.length);
    console.log('Comments with replies:', mainComments.map(c => ({
      id: c.id,
      repliesCount: c.replies.length
    })));
    
    return NextResponse.json({
      comments: mainComments,
      comments_count: rows.length
    });
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

    // 댓글 저장 후 게시글의 댓글 수 업데이트
    await connection.query(
      'UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?',
      [postId]
    );

    // 새로 작성된 댓글과 함께 업데이트된 댓글 수를 조회
    const [newComment] = await connection.query(
      `SELECT 
        c.*,
        u.name as author_name,
        mu.name as mentioned_user_name,
        (SELECT comments_count FROM posts WHERE id = ?) as comments_count
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       LEFT JOIN users mu ON c.mentioned_user_id = mu.id
       WHERE c.id = ?`,
      [postId, (result as any).insertId]
    );

    await connection.commit();
    return NextResponse.json({
      ...newComment[0],
      comments_count: newComment[0].comments_count
    });
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
