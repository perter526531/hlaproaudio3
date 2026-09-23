import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// PATCH /api/admin/images/:id — update alt/tags
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const img = await db.image.update({
    where: { id },
    data: {
      alt: body.alt,
      tags: body.tags,
    },
  });
  return NextResponse.json({ image: img });
}

// DELETE /api/admin/images/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await db.image.findUnique({ where: { id } });
  if (!img) return NextResponse.json({ error: '不存在' }, { status: 404 });
  await db.image.delete({ where: { id } });
  if (img.source === 'upload' && img.url.startsWith('/uploads/')) {
    const full = path.join(process.cwd(), 'public', img.url);
    if (existsSync(full)) {
      try { await unlink(full); } catch {}
    }
  }
  return NextResponse.json({ ok: true });
}
