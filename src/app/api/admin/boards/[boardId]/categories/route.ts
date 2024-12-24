import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// 카테고리 생성
export async function POST(
  request: Request,
  context: { params: { boardId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const { name } = await request.json();
    const { boardId: boardIdParam } = await context.params;
    const boardId = parseInt(boardIdParam);

    // 입력값 검증
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '카테고리 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    // 현재 최대 order_num 조회
    const [maxOrderResult] = await connection.query(
      'SELECT MAX(order_num) as maxOrder FROM categories WHERE board_id = ?',
      [boardId]
    );
    const maxOrder = maxOrderResult[0].maxOrder || 0;

    // 카테고리 추가
    const [result] = await connection.execute(
      'INSERT INTO categories (name, board_id, order_num) VALUES (?, ?, ?)',
      [name, boardId, maxOrder + 1]
    );

    // 새로 생성된 카테고리 정보 조회
    const [newCategory] = await connection.query(
      'SELECT id, name, order_num FROM categories WHERE id = ?',
      [(result as any).insertId]
    );

    return NextResponse.json({ 
      success: true,
      message: '카테고리가 성공적으로 추가되었습니다.',
      category: newCategory[0]  // 새로 생성된 카테고리 정보 반환
    });

  } catch (error) {
    console.error('카테고리 추가 오류:', error);
    return NextResponse.json(
      { error: '카테고리 추가에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// 카테고리 조회
export async function GET(
  request: Request,
  context: { params: { boardId: string } }
) {
  try {
    // 전체 params 객체를 await
    const { boardId: boardIdParam } = await context.params;
    const boardId = parseInt(boardIdParam);
    
    // boardId 유효성 검사
    if (isNaN(boardId)) {
      return NextResponse.json(
        { error: '유효하지 않은 게시판 ID입니다.' },
        { status: 400 }
      );
    }
    
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE board_id = ? ORDER BY order_num ASC',
      [boardId]
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
} 