import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/forms/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.form.findUnique({
    where: { id },
    include: { fields: { orderBy: { order: 'asc' } }, _count: { select: { submissions: true } } },
  });
  if (!form) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  return NextResponse.json({
    form: {
      ...form,
      fields: form.fields.map((f) => ({ ...f, config: safeParse(f.config) })),
    },
  });
}

// PATCH /api/admin/forms/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const cur = await db.form.findUnique({ where: { id } });
  if (!cur) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  let newSlug = cur.slug;
  if (body.slug && body.slug !== cur.slug) {
    newSlug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!newSlug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
    const exists = await db.form.findUnique({ where: { slug: newSlug } });
    if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  }
  try {
    const form = await db.form.update({
      where: { id },
      data: {
        slug: newSlug,
        title: body.title ?? cur.title,
        description: body.description ?? cur.description,
        submitLabel: body.submitLabel ?? cur.submitLabel,
        successMsg: body.successMsg ?? cur.successMsg,
        status: body.status ?? cur.status,
        notifyEmail: body.notifyEmail ?? cur.notifyEmail,
      },
    });
    return NextResponse.json({ form });
  } catch (e: any) {
    return NextResponse.json({ error: `保存失败：${e?.message || String(e)}` }, { status: 500 });
  }
}

// DELETE /api/admin/forms/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.form.findUnique({ where: { id } });
  if (!form) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  await db.form.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
