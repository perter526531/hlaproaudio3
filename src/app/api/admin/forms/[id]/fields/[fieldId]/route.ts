import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// PATCH /api/admin/forms/:id/fields/:fieldId — update single field
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; fieldId: string }> }) {
  const { id, fieldId } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const field = await db.formField.findUnique({ where: { id: fieldId } });
  if (!field || field.formId !== id) return NextResponse.json({ error: '字段不存在' }, { status: 404 });
  try {
    const updated = await db.formField.update({
      where: { id: fieldId },
      data: {
        label: body.label ?? field.label,
        name: body.name ?? field.name,
        type: body.type ?? field.type,
        required: body.required ?? field.required,
        order: body.order ?? field.order,
        config: JSON.stringify(body.config ?? JSON.parse(field.config || '{}')),
      },
    });
    return NextResponse.json({ field: { ...updated, config: safeParse(updated.config) } });
  } catch (e: any) {
    // 把真实 Prisma/SQLite 错误返回给前端，方便诊断
    const msg = e?.message || String(e);
    const isReadOnly = /readonly|read.?only|disk I\/O|SQLITE_READONLY/i.test(msg);
    return NextResponse.json({
      error: isReadOnly
        ? '数据库写入失败：SQLite 文件权限不足。请在服务器执行 chown -R www:www <DB路径>（或 chmod 666 <DB文件>）'
        : `保存失败：${msg}`,
    }, { status: 500 });
  }
}

// DELETE /api/admin/forms/:id/fields/:fieldId
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; fieldId: string }> }) {
  const { id, fieldId } = await params;
  const field = await db.formField.findUnique({ where: { id: fieldId } });
  if (!field || field.formId !== id) return NextResponse.json({ error: '字段不存在' }, { status: 404 });
  await db.formField.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
