import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST /api/admin/forms/:id/fields — add field
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.form.findUnique({ where: { id } });
  if (!form) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const count = await db.formField.count({ where: { formId: id } });
  const name = (body.name || `field_${Date.now()}`).trim();
  const field = await db.formField.create({
    data: {
      formId: id,
      label: body.label || '新字段',
      name,
      type: body.type || 'text',
      required: !!body.required,
      order: body.order ?? count,
      config: JSON.stringify(body.config || {}),
    },
  });
  return NextResponse.json({ field: { ...field, config: safeParse(field.config) } });
}

// PUT /api/admin/forms/:id/fields — bulk update fields
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const items: any[] = body.fields || [];
  for (const it of items) {
    await db.formField.update({
      where: { id: it.id },
      data: {
        label: it.label, name: it.name, type: it.type,
        required: !!it.required, order: it.order ?? 0,
        config: JSON.stringify(it.config || {}),
      },
    });
  }
  return NextResponse.json({ ok: true });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
