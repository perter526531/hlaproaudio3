import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/forms/:slug — public form definition
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const form = await db.form.findUnique({
    where: { slug },
    include: { fields: { orderBy: { order: 'asc' } } },
  });
  if (!form) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  return NextResponse.json({
    form: {
      slug: form.slug,
      title: form.title,
      description: form.description,
      submitLabel: form.submitLabel,
      successMsg: form.successMsg,
      fields: form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        name: f.name,
        type: f.type,
        required: f.required,
        config: safeParse(f.config),
      })),
    },
  });
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}
