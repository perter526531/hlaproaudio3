import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/news
export async function GET() {
  const news = await db.newsArticle.findMany({ orderBy: { publishedAt: 'desc' } });
  return NextResponse.json({ news });
}

// POST /api/admin/news — create
export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!slug) return NextResponse.json({ error: 'slug 不能为空' }, { status: 400 });
  const exists = await db.newsArticle.findUnique({ where: { slug } });
  if (exists) return NextResponse.json({ error: 'slug 已存在' }, { status: 409 });
  const article = await db.newsArticle.create({
    data: {
      slug,
      title: body.title || slug,
      excerpt: body.excerpt || null,
      body: body.body || '',
      cover: body.cover || null,
      category: body.category || '企业新闻',
      status: body.status || 'draft',
      publishedAt: body.publishedAt ? new Date(body.publishedAt) : new Date(),
    },
  });
  return NextResponse.json({ article });
}
