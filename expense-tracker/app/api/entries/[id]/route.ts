export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../db';

// PATCH update an entry
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  const entryId = Number(id);
  const body = await req.json();
  const { title, amount, date, notes } = body;
  const result = await pool.query(
    'UPDATE entries SET title = $1, amount = $2, date = $3, notes = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
    [title, amount, date, notes, entryId, userId]
  );
  return NextResponse.json(result.rows[0]);
}

// DELETE an entry
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  const entryId = Number(id);
  await pool.query('DELETE FROM entries WHERE id = $1 AND user_id = $2', [entryId, userId]);
  return NextResponse.json({ success: true });
}
