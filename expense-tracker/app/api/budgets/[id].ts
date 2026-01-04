export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import pool from '../db';

// PATCH update a budget
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const { name, type, total } = body;
  const result = await pool.query(
    'UPDATE budgets SET name = $1, type = $2, total = $3 WHERE id = $4 RETURNING *',
    [name, type, total, id]
  );
  return NextResponse.json(result.rows[0]);
}

// DELETE a budget
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await pool.query('DELETE FROM budgets WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
