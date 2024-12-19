// src/app/api/board/[boardCode]/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
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
        CONCAT(
          REPEAT('　', p.depth),
          CASE 
            WHEN p.depth > 0 THEN CONCAT('↳ ')
            ELSE ''
          END,
          p.title,
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
    const { title, content, parent_id, group_id, sequence, depth } = await request.json();

    // 요청 데이터 로그 추가
    console.log('=== 게시글 작성 요청 데이터 ===');
    console.log('parent_id:', parent_id);
    console.log('title:', title);
    console.log('content:', content);

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

    // 답글인 경우 부모글의 정보 조회
    let groupId = null;
    let parentDepth = 0;
    let newSequence = 0;
    
    if (parent_id) {
      // connection.query()의 결과는 [rows, fields] 형태의 배열을 반환합니다.
      // 구조 ��해 할당으로 첫 번째 요소(rows)만 parentPost 변수에 할당합니다.
      const [parentPost] = await connection.query(
        'SELECT group_id, sequence, depth FROM posts WHERE id = ?',
        [parent_id]
      );
      
      if (Array.isArray(parentPost) && parentPost.length > 0) {
        groupId = parentPost[0].group_id;
        parentDepth = parentPost[0].depth;
        const parentSequence = parentPost[0].sequence;

        console.log('=== 부모 게시글 정보 ===');
        console.log('group_id:', groupId);
        console.log('parent depth:', parentDepth);
        console.log('parent sequence:', parentSequence);

        // 같은 depth의 마지막 sequence 찾기
        const [lastSiblingResult] = await connection.query(
          `SELECT COALESCE(MAX(sequence), 0) as maxSeq 
           FROM posts 
           WHERE group_id = ? 
           AND depth = ?
           AND sequence > ?`,
          [groupId, parentDepth + 1, parentSequence]
        );

        const lastSiblingSequence = lastSiblingResult[0].maxSeq;
        newSequence = lastSiblingSequence > 0 ? lastSiblingSequence + 1 : parentSequence + 1;

        console.log('=== 계산된 새 시퀀스 정보 ===');
        console.log('last sibling sequence:', lastSiblingSequence);
        console.log('new sequence:', newSequence);

        // 새로운 sequence 이상의 값을 가진 게시글들의 sequence를 1씩 증가
        await connection.query(
          `UPDATE posts 
           SET sequence = sequence + 1 
           WHERE group_id = ? AND sequence >= ?
           ORDER BY sequence DESC`,
          [groupId, newSequence]
        );
      }
    }

    // 최종 저장 직전 로그 추가
    console.log('=== 최종 저장 데이터 ===');
    console.log('group_id:', groupId);
    console.log('sequence:', parent_id ? newSequence : 0);
    console.log('depth:', parent_id ? parentDepth + 1 : 0);

    // 게시글 저장
    const [result] = await connection.query(
      `INSERT INTO posts (
        board_id, title, content,
        group_id, sequence, depth, 
        user_id, author, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        boardId, title, content,
        groupId, 
        parent_id ? newSequence : 0,
        parent_id ? parentDepth + 1 : 0,
        userId, userName
      ]
    );

    // 원글인 경우(parent_id가 없는 경우) group_id를 방금 생성된 게시글의 id로 업데이트
    if (!parent_id) {
      await connection.query(
        'UPDATE posts SET group_id = ? WHERE id = ?',
        [result.insertId, result.insertId]
      );
    }

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