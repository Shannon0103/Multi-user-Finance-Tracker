export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../db';

// PATCH update a budget
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  const budgetId = Number(id);
  const body = await req.json();
  const { name, type, total } = body;
  const result = await pool.query(
    'UPDATE budgets SET name = $1, type = $2, total = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
    [name, type, total, budgetId, userId]
  );
  return NextResponse.json(result.rows[0]);
}

// DELETE a budget
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  const budgetId = Number(id);
  await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [budgetId, userId]);
  return NextResponse.json({ success: true });
}
