import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defaultDataFor, type BlockType } from '@/lib/blocks/types';

// GET /api/admin/pages/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await db.page.findUnique({
    where: { id },
    include: { blocks: { orderBy: { order: 'asc' } } },
  });
  if (!page) return NextResponse.json({ error: '页面不存在' }, { status: 404 });
  return NextResponse.json({ page });
}

// PATCH /api/admin/pages/:id — update page meta
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const cur = await db.page.findUnique({ where: { id } });
  if (!cur) return NextResponse.json({ error: '页面不存在' }, { status: 404 });
  let newSlug = cur.slug;
  if (body.slug && body.slug !== cur.slug) {
    newSlug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!newSlug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
    if (cur.isHome) return NextResponse.json({ error: '首页 slug 不能修改' }, { status: 400 });
    const exists = await db.page.findUnique({ where: { slug: newSlug } });
    if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  }
  const page = await db.page.update({
    where: { id },
    data: {
      slug: newSlug,
      title: body.title ?? cur.title,
      subtitle: body.subtitle ?? cur.subtitle,
      description: body.description ?? cur.description,
      status: body.status ?? cur.status,
      showInNav: body.showInNav ?? cur.showInNav,
      navOrder: body.navOrder ?? cur.navOrder,
    },
  });
  return NextResponse.json({ page });
}

// DELETE /api/admin/pages/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await db.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: '页面不存在' }, { status: 404 });
  if (page.isHome) return NextResponse.json({ error: '首页不可删除' }, { status: 400 });
  await db.page.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
