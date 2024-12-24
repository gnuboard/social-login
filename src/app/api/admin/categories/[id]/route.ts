import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// 카테고리 수정
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, order_num } = await request.json();
    const id = parseInt(params.id);

    await pool.query(
      'UPDATE categories SET name = ?, description = ?, order_num = ? WHERE id = ?',
      [name, description, order_num, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('카테고리 수정 오류:', error);
    return NextResponse.json(
      { error: '카테고리 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리 삭제
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // 해당 카테고리를 사용하는 게시판이 있는지 확인
    const [boards] = await pool.query(
      'SELECT COUNT(*) as count FROM boards WHERE category_id = ?',
      [id]
    );

    if (boards[0].count > 0) {
      return NextResponse.json(
        { error: '이 카테고리를 사용하는 게시판이 있어 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('카테고리 삭제 오류:', error);
    return NextResponse.json(
      { error: '카테고리 삭제에 실패했습니다.' },
      { status: 500 }
    );
  }
} 