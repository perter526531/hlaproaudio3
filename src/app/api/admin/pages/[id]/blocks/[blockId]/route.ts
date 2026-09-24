import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/admin/pages/:id/blocks/:blockId — update a block
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; blockId: string }> }) {
  const { id, blockId } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const block = await db.block.findUnique({ where: { id: blockId } });
  if (!block || block.pageId !== id) return NextResponse.json({ error: 'block 不存在' }, { status: 404 });
  const data: any = {};
  if (body.data !== undefined) data.data = JSON.stringify(body.data ?? {});
  if (body.title !== undefined) data.title = body.title;
  if (body.hidden !== undefined) data.hidden = !!body.hidden;
  if (body.order !== undefined) data.order = Number(body.order);
  try {
    const updated = await db.block.update({ where: { id: blockId }, data });
    return NextResponse.json({ block: { ...updated, data: safeParse(updated.data) } });
  } catch (e: any) {
    const msg = e?.message || String(e);
    const isReadOnly = /readonly|read.?only|disk I\/O|SQLITE_READONLY/i.test(msg);
    return NextResponse.json({
      error: isReadOnly
        ? '数据库写入失败：SQLite 权限不足。请在服务器执行 chown -R www:www <DB路径>'
        : `保存失败：${msg}`,
    }, { status: 500 });
  }
}

// DELETE /api/admin/pages/:id/blocks/:blockId
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; blockId: string }> }) {
  const { id, blockId } = await params;
  const block = await db.block.findUnique({ where: { id: blockId } });
  if (!block || block.pageId !== id) return NextResponse.json({ error: 'block 不存在' }, { status: 404 });
  await db.block.delete({ where: { id: blockId } });
  return NextResponse.json({ ok: true });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
