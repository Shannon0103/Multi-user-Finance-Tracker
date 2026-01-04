export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import pool from '../db';

// PATCH update an entry
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const body = await req.json();
  const { title, amount, date, notes } = body;
  const result = await pool.query(
    'UPDATE entries SET title = $1, amount = $2, date = $3, notes = $4 WHERE id = $5 RETURNING *',
    [title, amount, date, notes, id]
  );
  return NextResponse.json(result.rows[0]);
}

// DELETE an entry
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  await pool.query('DELETE FROM entries WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
