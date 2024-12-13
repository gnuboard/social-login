import { NextResponse } from 'next/server';
import pool from '@/utils/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { email, name, image, provider } = await request.json();
    const uuid = uuidv4();
    
    const connection = await pool.getConnection();
    
    try {
      const [result] = await connection.execute(
        'INSERT INTO users (uuid, email, name, image, provider) VALUES (?, ?, ?, ?, ?)',
        [uuid, email, name, image, provider]
      );
      
      return NextResponse.json({ 
        message: '회원가입이 완료되었습니다.',
        success: true 
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { error: '이미 가입된 이메일입니다.' },
          { status: 400 }
        );
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('회원가입 에러:', error);
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 