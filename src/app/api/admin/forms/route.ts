import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/forms
export async function GET() {
  const forms = await db.form.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { submissions: true } } },
  });
  return NextResponse.json({ forms });
}

// POST /api/admin/forms — create
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
  const exists = await db.form.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  const form = await db.form.create({
    data: {
      slug,
      title: body.title || slug,
      description: body.description || null,
      submitLabel: body.submitLabel || '提交',
      successMsg: body.successMsg || '提交成功',
      status: body.status || 'draft',
    },
  });
  return NextResponse.json({ form });
}
