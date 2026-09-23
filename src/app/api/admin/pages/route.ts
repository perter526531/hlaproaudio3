import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defaultDataFor, type BlockType } from '@/lib/blocks/types';

// GET /api/admin/pages
export async function GET() {
  const pages = await db.page.findMany({
    orderBy: [{ isHome: 'desc' }, { navOrder: 'asc' }],
    include: { _count: { select: { blocks: true } } },
  });
  return NextResponse.json({ pages });
}

// POST /api/admin/pages — create page
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
  const exists = await db.page.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  const page = await db.page.create({
    data: {
      slug,
      title: body.title || slug,
      subtitle: body.subtitle || null,
      description: body.description || null,
      status: body.status || 'draft',
      isHome: false,
      showInNav: body.showInNav ?? true,
      navOrder: body.navOrder ?? 0,
    },
  });
  return NextResponse.json({ page });
}
