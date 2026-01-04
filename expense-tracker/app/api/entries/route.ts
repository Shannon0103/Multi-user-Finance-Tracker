export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../db';

// GET all entries for a budget
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(req.url);
  const budget_id = Number(searchParams.get('budget_id'));
  const result = await pool.query(
    'SELECT * FROM entries WHERE budget_id = $1 AND user_id = $2 ORDER BY id',
    [budget_id, userId]
  );
  return NextResponse.json(result.rows);
}

// POST create a new entry
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await req.json();
  const { budget_id, title, amount, date, notes } = body;
  const result = await pool.query(
    'INSERT INTO entries (budget_id, title, amount, date, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [budget_id, title, amount, date, notes, userId]
  );
  return NextResponse.json(result.rows[0]);
}
