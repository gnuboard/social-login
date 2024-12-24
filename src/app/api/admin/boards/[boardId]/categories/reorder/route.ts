import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  context: { params: { boardId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const { categories } = await request.json();
    const { boardId: boardIdParam } = await context.params;
    const boardId = parseInt(boardIdParam);

    // 입력값 검증
    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: '올바르지 않은 데이터 형식입니다.' },
        { status: 400 }
      );
    }

    // 트랜잭션 시작
    await connection.beginTransaction();

    // 각 카테고리의 순서 업데이트
    for (const category of categories) {
      await connection.execute(
        'UPDATE categories SET order_num = ? WHERE id = ? AND board_id = ?',
        [category.order_num, category.id, boardId]
      );
    }

    // 트랜잭션 커밋
    await connection.commit();

    return NextResponse.json({ 
      success: true,
      message: '카테고리 순서가 성공적으로 업데이트되었습니다.'
    });

  } catch (error) {
    // 에러 발생 시 롤백
    await connection.rollback();
    console.error('카테고리 순서 변경 오류:', error);
    return NextResponse.json(
      { error: '카테고리 순서 변경에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 