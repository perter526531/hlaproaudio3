import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/menus/:slug
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await db.menu.findUnique({
    where: { slug },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { order: 'asc' },
        include: { children: { orderBy: { order: 'asc' } } },
      },
    },
  });
  if (!menu) return NextResponse.json({ error: '菜单不存在' }, { status: 404 });
  return NextResponse.json({ menu });
}

// POST /api/admin/menus/:slug/items — add item (also accepts at /:slug root)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await db.menu.findUnique({ where: { slug } });
  if (!menu) return NextResponse.json({ error: '菜单不存在' }, { status: 404 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const count = await db.menuItem.count({ where: { menuId: menu.id, parentId: body.parentId || null } });
  const item = await db.menuItem.create({
    data: {
      menuId: menu.id,
      label: body.label || '新链接',
      url: body.url || '/',
      parentId: body.parentId || null,
      order: body.order ?? count,
      openNew: !!body.openNew,
    },
  });
  return NextResponse.json({ item });
}

// PUT /api/admin/menus/:slug — bulk update items
export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const menu = await db.menu.findUnique({ where: { slug } });
  if (!menu) return NextResponse.json({ error: '菜单不存在' }, { status: 404 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const items: any[] = body.items || [];
  for (const it of items) {
    await db.menuItem.update({
      where: { id: it.id },
      data: {
        label: it.label,
        url: it.url,
        order: it.order ?? 0,
        parentId: it.parentId || null,
        openNew: !!it.openNew,
      },
    });
  }
  return NextResponse.json({ ok: true });
}
