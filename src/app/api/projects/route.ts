import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// 프로젝트 목록 조회
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const tech = searchParams.get('tech');
  
  const connection = await pool.getConnection();
  try {
    let query = `
      SELECT 
        p.*,
        GROUP_CONCAT(pts.tech_stack) as tech_stacks
      FROM projects p
      LEFT JOIN project_tech_stacks pts ON p.id = pts.project_id
      WHERE p.deleted_at IS NULL
    `;
    
    if (status) query += ` AND p.status = ?`;
    if (tech) query += ` AND pts.tech_stack = ?`;
    
    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;
    
    const [projects] = await connection.execute(query, [status, tech].filter(Boolean));
    return NextResponse.json(projects);
  } finally {
    connection.release();
  }
}

// 새 프로젝트 생성
export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { title, description, status, tech_stacks } = body;

    await connection.beginTransaction();

    // 프로젝트 기본 정보 저장 - null 병합 연산자 사용
    const [result]: any = await connection.execute(
      `INSERT INTO projects (title, description, status, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [title ?? null, description ?? null, status ?? null]
    );

    const projectId = result.insertId;

    // 기술 스택 저장
    if (tech_stacks && tech_stacks.length > 0) {
      const techStackValues = tech_stacks.map((tech: string) => [projectId, tech]);
      await connection.query(
        `INSERT INTO project_tech_stacks (project_id, tech_stack) VALUES ?`,
        [techStackValues]
      );
    }

    await connection.commit();
    return NextResponse.json({ message: '프로젝트가 성공적으로 등록되었습니다.' }, { status: 201 });

  } catch (error) {
    await connection.rollback();
    console.error('프로젝트 등록 오류:', error);
    return NextResponse.json({ error: '프로젝트 등록 중 오류가 발생했습니다.' }, { status: 500 });
  } finally {
    connection.release();
  }
} 