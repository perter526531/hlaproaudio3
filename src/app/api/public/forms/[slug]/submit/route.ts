import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/public/forms/:slug/submit — submit a form
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await db.form.findUnique({
    where: { slug },
    include: { fields: true },
  });
  if (!form) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '请求体无效' }, { status: 400 });

  // server-side validation
  for (const f of form.fields) {
    const v = body[f.name];
    if (f.required && (v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0))) {
      return NextResponse.json({ error: `请填写：${f.label}`, field: f.name }, { status: 422 });
    }
    if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
      return NextResponse.json({ error: `${f.label} 邮箱格式不正确`, field: f.name }, { status: 422 });
    }
  }

  // restrict to known fields only
  const allowed = new Set(form.fields.map((f) => f.name));
  const data: Record<string, any> = {};
  for (const k of Object.keys(body)) {
    if (allowed.has(k)) data[k] = body[k];
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || null;
  const ua = req.headers.get('user-agent') || null;

  await db.formSubmission.create({
    data: {
      formId: form.id,
      data: JSON.stringify(data),
      ip, ua,
    },
  });

  return NextResponse.json({ ok: true, message: form.successMsg || '提交成功' });
}
