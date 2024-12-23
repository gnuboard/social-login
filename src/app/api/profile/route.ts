import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name } = await req.json();
    if (!name) {
      return new NextResponse('이름을 입력해주세요', { status: 400 });
    }

    const [result] = await pool.execute(
      'UPDATE users SET name = ? WHERE email = ?',
      [name, session.user.email]
    );

    // MySQL 결과 타입 정의
    const updateResult = result as mysql.ResultSetHeader;
    
    if (updateResult.affectedRows === 0) {
      return new NextResponse('사용자를 찾을 수 없습니다', { status: 404 });
    }

    return NextResponse.json({ success: true, name });
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse('서버 오류가 발생했습니다', { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.execute(
        'SELECT created_at FROM users WHERE email = ?',
        [session.user.email]
      );

      if (Array.isArray(users) && users.length > 0) {
        return NextResponse.json({ createdAt: users[0].created_at });
      } else {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 