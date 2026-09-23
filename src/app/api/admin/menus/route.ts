import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/menus
export async function GET() {
  const menus = await db.menu.findMany({ include: { items: { include: { children: true }, orderBy: { order: 'asc' } } } });
  return NextResponse.json({ menus });
}

// POST /api/admin/menus — create menu
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const slug = (body.slug || '').trim();
  if (!slug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
  const exists = await db.menu.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  const menu = await db.menu.create({ data: { slug, title: body.title || slug } });
  return NextResponse.json({ menu });
}
