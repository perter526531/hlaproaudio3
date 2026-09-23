import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/news/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await db.newsArticle.findUnique({ where: { id } });
  if (!article) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  return NextResponse.json({ article });
}

// PATCH /api/admin/news/:id
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const cur = await db.newsArticle.findUnique({ where: { id } });
  if (!cur) return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  let newSlug = cur.slug;
  if (body.slug && body.slug !== cur.slug) {
    newSlug = body.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!newSlug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
    const exists = await db.newsArticle.findUnique({ where: { slug: newSlug } });
    if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  }
  const article = await db.newsArticle.update({
    where: { id },
    data: {
      slug: newSlug,
      title: body.title ?? cur.title,
      excerpt: body.excerpt ?? cur.excerpt,
      body: body.body ?? cur.body,
      cover: body.cover ?? cur.cover,
      category: body.category ?? cur.category,
      status: body.status ?? cur.status,
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : cur.publishedAt,
    },
  });
  return NextResponse.json({ article });
}

// DELETE /api/admin/news/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.newsArticle.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
