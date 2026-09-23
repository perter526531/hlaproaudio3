import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// DELETE /api/admin/menus/item?id=... — delete an item
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: '缺少 id' }, { status: 400 });
  await db.menuItem.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
