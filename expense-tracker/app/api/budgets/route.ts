export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../db';

// GET all budgets for a month/year
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const month = Number(searchParams.get('month'));
  const year = Number(searchParams.get('year'));
  const result = await pool.query(
    'SELECT * FROM budgets WHERE month = $1 AND year = $2 AND user_id = $3 ORDER BY id',
    [month, year, userId]
  );
  return NextResponse.json(result.rows);
}

// POST create a new budget
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const { name, type, total, month, year } = body;
  const result = await pool.query(
    'INSERT INTO budgets (name, type, total, month, year, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [name, type, total, month, year, userId]
  );
  return NextResponse.json(result.rows[0]);
}
