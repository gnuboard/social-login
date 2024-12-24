import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// 카테고리 수정
export async function PUT(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const { name } = await request.json();
    const resolvedParams = await params;
    const categoryId = parseInt(resolvedParams.categoryId);

    await connection.execute(
      'UPDATE categories SET name = ? WHERE id = ?',
      [name, categoryId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// 카테고리 삭제
export async function DELETE(
  request: Request,
  context: { params: { boardId: string; categoryId: string } }
) {
  try {
    const params = await context.params;
    const boardId = parseInt(params.boardId);
    const categoryId = parseInt(params.categoryId);

    await pool.query(
      'DELETE FROM categories WHERE id = ? AND board_id = ?',
      [categoryId, boardId]
    );

    return NextResponse.json({ message: '카테고리가 삭제되었습니다.' });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 