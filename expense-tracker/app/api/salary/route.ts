export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../db';

// GET monthly salary for a specific month/year
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));
  
  const result = await pool.query(
    'SELECT salary FROM monthly_salary WHERE user_id = $1 AND month = $2 AND year = $3',
    [userId, month, year]
  );
  
  if (result.rows.length === 0) {
    return NextResponse.json({ salary: 0 });
  }
  
  return NextResponse.json({ salary: result.rows[0].salary });
}

// POST/PUT update monthly salary
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const { month, year, salary } = body;
  
  // Upsert (insert or update)
  const result = await pool.query(
    `INSERT INTO monthly_salary (user_id, month, year, salary, updated_at)
     VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id, month, year)
     DO UPDATE SET salary = $4, updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [userId, month, year, salary]
  );
  
  return NextResponse.json(result.rows[0]);
}
