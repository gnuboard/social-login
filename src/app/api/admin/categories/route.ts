import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// 카테고리 목록 조회
export async function GET() {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, order_num FROM categories ORDER BY order_num ASC, name ASC'
    );

    return NextResponse.json({ categories: rows });
  } catch (error) {
    console.error('카테고리 조회 오류:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 카테고리 생성
export async function POST(request: Request) {
  try {
    const { name, description, order_num } = await request.json();

    const [result] = await pool.query(
      'INSERT INTO categories (name, description, order_num, board_id) VALUES (?, ?, ?, 0)',
      [name, description, order_num]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('카테고리 생성 오류:', error);
    return NextResponse.json(
      { error: '카테고리 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
} 