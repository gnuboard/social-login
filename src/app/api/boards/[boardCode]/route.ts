// src/app/api/board/[boardCode]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createThumbnail } from '@/lib/thumbnailUtils';

export async function GET(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  try {
    const { boardCode } = await params;
    
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
    const limit = Number(searchParams.get('limit')) || 20;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id,
        p.title,
        p.author,
        p.created_at,
        p.view_count,
        p.depth,
        p.thumbnail,
        CONCAT(
          ' (',
          p.id,
          ', ',
          p.group_id,
          ', ',
          p.sequence,
          ', ',
          p.depth,
          ')'
        ) as display_title,
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 1) as like_count,
        (SELECT COUNT(*) FROM votes WHERE post_id = p.id AND vote_type = 0) as dislike_count,
        p.comments_count
      FROM posts p
      WHERE p.board_id = ?
      ORDER BY p.group_id DESC, p.sequence ASC
      LIMIT ? OFFSET ?
    `;

    const [posts] = await pool.query<Post[]>(
      query,
      [boardId, limit, offset]
    );

    return NextResponse.json({
      board: {
        id: board.id,
        code: board.code,
        title: board.title,
        posts_count: board.posts_count,
      },
      posts: posts.map(post => ({
        ...post,
        thumbnail: post.thumbnail || null
      })),
      total: board.posts_count
    });
    
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
  const session = await getServerSession(authOptions);
  
  if (!session) {
    console.log('인증 실패: 세션 없음');
    return NextResponse.json(
      { 
        error: '로그인이 필요합니다.',
        showAlert: true  // 경고창 표시를 위한 플래그 추가
      },
      { status: 401 }
    );
  }

  // 인증된 사용자만 DB 연결 수행
  const connection = await pool.getConnection();
  
  console.log('=== POST 요청 시작 ===');
  
  try {
    const { boardCode } = await params;
    const { title, content, parent_id } = await request.json();

    // 컨네일 처리를 함수 호출로 단순화
    const thumbnail = await createThumbnail(content);

    console.log({
      요청정보: {
        boardCode,
        title,
        parent_id,
        user: session.user?.email
      }
    });

    // 사용자 정보 조회 (이름 포함)
    const [userResult] = await connection.query(
      'SELECT id, name FROM users WHERE email = ?',
      [session.user?.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const userId = userResult[0].id;
    const userName = userResult[0].name;

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

    // 답글인 경우 부모글의 정보 회
    let groupId = null;
    let parentDepth = 0;
    let newSequence = 0;
    
    if (parent_id) {
      const [parentPost] = await connection.query(
        'SELECT group_id, sequence, depth FROM posts WHERE id = ?',
        [parent_id]
      );
      
      if (Array.isArray(parentPost) && parentPost.length > 0) {
        groupId = parentPost[0].group_id;
        parentDepth = parentPost[0].depth;

        // 부모 글의 다음 sequence부터 같은 depth의 글이 있는지 찾습니다
        const [nextSameDepthPost] = await connection.query(
          `SELECT sequence 
           FROM posts 
           WHERE group_id = ? 
           AND sequence > ? 
           AND depth <= ?
           ORDER BY sequence ASC 
           LIMIT 1`,
          [groupId, parentPost[0].sequence, parentPost[0].depth]
        );
        
        if (nextSameDepthPost && nextSameDepthPost.length > 0) {
          // 다음 같은 depth 글이 있으면 그 바로 앞에 위치
          newSequence = nextSameDepthPost[0].sequence;
        } else {
          // 없으면 현재 그룹의 마지막 sequence + 1
          const [lastPost] = await connection.query(
            'SELECT sequence FROM posts WHERE group_id = ? ORDER BY sequence DESC LIMIT 1',
            [groupId]
          );
          newSequence = lastPost[0].sequence + 1;
        }

        // 새 sequence 이상의 값을 가진 글들의 sequence를 1씩 증가
        await connection.query(
          `UPDATE posts 
           SET sequence = sequence + 1 
           WHERE group_id = ? 
           AND sequence >= ?`,
          [groupId, newSequence]
        );
      }
    }

    // 최종 저장 직전 로그 추가
    console.log('=== 최종 저장 데이터 ===');
    console.log('group_id:', groupId);
    console.log('sequence:', parent_id ? newSequence : 0);
    console.log('depth:', parent_id ? parentDepth + 1 : 0);

    // 게시글 ���장
    const [result] = await connection.query(
      `INSERT INTO posts (
        board_id, title, content, thumbnail,
        group_id, sequence, depth, 
        user_id, author, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        boardId, title, content, thumbnail,
        groupId, 
        parent_id ? newSequence : 0,
        parent_id ? parentDepth + 1 : 0,
        userId, userName
      ]
    );

    // posts_count 증가
    await connection.query(
      'UPDATE boards SET posts_count = posts_count + 1 WHERE id = ?',
      [boardId]
    );

    // 원글인 경우(parent_id가 없는 경우) group_id를 방금 생성된 게시글의 id로 업데이트
    if (!parent_id) {
      await connection.query(
        'UPDATE posts SET group_id = ? WHERE id = ?',
        [result.insertId, result.insertId]
      );
    }

    await connection.commit();
    
    console.log('게시글 저장 성공:', result.insertId);
    return NextResponse.json({ 
      id: result.insertId,
      boardCode: boardCode // 게시판 코드도 함께 반환
    });
  } catch (error) {
    await connection.rollback();
    console.error('게시글 저장 실패:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: '게시글 작성에 실패���습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { boardCode: string } }
) {
  try {
    const { boardCode } = params;
    const { id, title, content } = await request.json();

    // 썸네일 처리 추가
    const thumbnail = await createThumbnail(content);

    const [result] = await pool.query(
      `UPDATE posts 
       SET title = ?, 
           content = ?, 
           thumbnail = ?,
           updated_at = NOW() 
       WHERE id = ?`,
      [title, content, thumbnail, id]
    );

    return NextResponse.json({
      id: id,
      boardCode: boardCode
    });
  } catch (error) {
    console.error('게시글 수정 실패:', {
      message: error.message,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}