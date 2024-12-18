import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RouteParams } from '@/types';

export async function POST(request: NextRequest, { params }: RouteParams) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 먼저 user_id 가져오기
    const [userResult] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [session.user.email]
    );

    if (!Array.isArray(userResult) || userResult.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userId = userResult[0].id;
    const { voteType } = await request.json();
    const resolvedParams = await Promise.resolve(params);
    const postId = resolvedParams.postId;

    // 게시글 존재 여부 확인
    const [postResult] = await connection.execute(
      'SELECT id FROM posts WHERE id = ?',
      [postId]
    );

    if (!Array.isArray(postResult) || postResult.length === 0) {
      return NextResponse.json(
        { error: '존재하지 않는 게시글입니다.' },
        { status: 404 }
      );
    }

    // ��전 투표 확인
    const [existingVote] = await connection.execute(
      'SELECT id, vote_type FROM votes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    let action = 'none';
    let likeChange = 0;
    let dislikeChange = 0;

    if (existingVote.length > 0) {
      const currentVoteType = existingVote[0].vote_type === 1;
      if (currentVoteType === voteType) {
        // 같은 투표 타입이면 취소
        await connection.execute(
          'DELETE FROM votes WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        // 취소시 카운트 감소
        likeChange = currentVoteType ? -1 : 0;
        dislikeChange = currentVoteType ? 0 : -1;
        action = 'cancel';
      } else {
        // 다른 투표 타입이면 변경
        await connection.execute(
          'UPDATE votes SET vote_type = ? WHERE post_id = ? AND user_id = ?',
          [voteType ? 1 : 0, postId, userId]
        );
        // 변경시 이전 타입 감소, 새로운 타입 증가
        likeChange = voteType ? 1 : -1;
        dislikeChange = voteType ? -1 : 1;
        action = 'change';
      }
    } else {
      // 새로운 투표
      await connection.execute(
        'INSERT INTO votes (post_id, user_id, vote_type) VALUES (?, ?, ?)',
        [postId, userId, voteType ? 1 : 0]
      );
      // 새로운 투표시 해당 타입 증가
      likeChange = voteType ? 1 : 0;
      dislikeChange = voteType ? 0 : 1;
      action = 'new';
    }

    // posts 테이블의 추천/반대 수 업데이트
    await connection.execute(`
      UPDATE posts 
      SET like_count = like_count + ?,
          dislike_count = dislike_count + ?
      WHERE id = ?`,
      [likeChange, dislikeChange, postId]
    );

    // 최신 투표 수 가져오기
    const [postCounts] = await connection.execute(
      'SELECT like_count, dislike_count FROM posts WHERE id = ?',
      [postId]
    );

    return NextResponse.json({
      likeCount: postCounts[0].like_count,
      dislikeCount: postCounts[0].dislike_count,
      userVote: action === 'cancel' ? null : voteType,
      action: action
    });

  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { error: '투표 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 