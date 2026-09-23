import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/forms/:id/submissions?unread=true&page=1&pageSize=20
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await db.form.findUnique({ where: { id } });
  if (!form) return NextResponse.json({ error: '表单不存在' }, { status: 404 });
  const unread = req.nextUrl.searchParams.get('unread') === 'true';
  const page = Math.max(Number(req.nextUrl.searchParams.get('page') || '1'), 1);
  const pageSize = Math.min(Math.max(Number(req.nextUrl.searchParams.get('pageSize') || '20'), 1), 100);
  const [items, total, unreadCount] = await Promise.all([
    db.formSubmission.findMany({
      where: { formId: id, ...(unread ? { read: false } : {}) },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.formSubmission.count({ where: { formId: id, ...(unread ? { read: false } : {}) } }),
    db.formSubmission.count({ where: { formId: id, read: false } }),
  ]);
  return NextResponse.json({
    submissions: items.map((s) => ({ ...s, data: safeParse(s.data) })),
    total, unreadCount, page, pageSize,
    fields: form,
  });
}

// mark all as read — POST with body { readAll: true }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any = {};
  try { body = await req.json(); } catch {}
  if (body.readAll) {
    await db.formSubmission.updateMany({ where: { formId: id, read: false }, data: { read: true } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'unsupported' }, { status: 400 });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
