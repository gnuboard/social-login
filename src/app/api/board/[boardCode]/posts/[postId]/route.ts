import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// GET 요청 처리
export async function GET(
  request: Request,
  { params }: { params: { boardCode: string; postId: string } }
) {
  try {
    const [rows] = await executeQuery(
      'SELECT * FROM posts WHERE id = ? AND board_code = ?',
      [params.postId, params.boardCode]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: '게시글을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// PUT 요청 처리
export async function PUT(
  request: Request,
  { params }: { params: { boardCode: string; postId: string } }
) {
  try {
    const body = await request.json();
    
    const [result] = await executeQuery(
      'UPDATE posts SET title = ?, content = ? WHERE id = ? AND board_code = ?',
      [body.title, body.content, params.postId, params.boardCode]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const [updatedRows] = await executeQuery(
      'SELECT * FROM posts WHERE id = ? AND board_code = ?',
      [params.postId, params.boardCode]
    );
    
    return NextResponse.json(updatedRows[0]);
  } catch (error) {
    return NextResponse.json(
      { error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}
