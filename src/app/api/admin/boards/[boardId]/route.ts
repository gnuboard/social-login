import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';

// 게시판 수정
export async function PUT(
  request: Request,
  {params}: {params: Promise<{boardId: string}>}
) {
  const connection = await pool.getConnection();
  
  try {
    const { code, title, description, category } = await request.json();
    const {boardId} = await params;
    const boardIdNum = parseInt(boardId);

    // 카테고리 정보 조회 (category가 있을 때만)
    let categoryName = null;
    if (category) {
      const [categoryResult] = await connection.execute(
        'SELECT name FROM categories WHERE id = ?',
        [category]
      );
      if (Array.isArray(categoryResult) && categoryResult.length > 0) {
        categoryName = categoryResult[0].name;
      }
    }

    // SQL 쿼리와 파라미터 개수 일치시킴
    const updateQuery = category 
      ? 'UPDATE boards SET code = ?, title = ?, description = ?, category = ? WHERE id = ?'
      : 'UPDATE boards SET code = ?, title = ?, description = ? WHERE id = ?';
    
    const updateParams = category 
      ? [code, title, description, categoryName, boardIdNum]
      : [code, title, description, boardIdNum];

    // 게시판 정보 업데이트
    await connection.execute(updateQuery, updateParams);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('게시판 수정 오류:', error);
    return NextResponse.json(
      { error: '게시판 수정에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// 게시판 삭제
export async function DELETE(
  request: Request,
  context: { params: { boardId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const params = await context.params;
    const boardId = params.boardId;
    
    // 게시판 삭제 쿼리 실행
    await connection.execute(
      'DELETE FROM boards WHERE id = ?',
      [boardId]
    );

    return new Response(JSON.stringify({ message: '게시판이 삭제되었습니다.' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('게시판 삭제 중 오류:', error);
    return new Response(
      JSON.stringify({ error: '게시판 삭제 중 오류가 발생했습니다.' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    connection.release();
  }
}

// 게시판 조회
export async function GET(
  request: Request,
  context: { params: { boardId: string } }
) {
  const connection = await pool.getConnection();
  
  try {
    const params = await context.params;
    const boardId = params.boardId;

    // 게시판 정보 조회
    const [boardResult] = await connection.execute(
      'SELECT b.*, c.name as category_name FROM boards b LEFT JOIN categories c ON b.id = c.board_id WHERE b.id = ? AND b.deleted_at IS NULL',
      [boardId]
    );

    if (!Array.isArray(boardResult) || boardResult.length === 0) {
      return NextResponse.json(
        { error: '게시판을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(boardResult[0]);
  } catch (error) {
    console.error('게시판 조회 오류:', error);
    return NextResponse.json(
      { error: '게시판 조회에 실패했습니다.' },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 