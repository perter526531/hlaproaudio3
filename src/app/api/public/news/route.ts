import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/news?limit=N
export async function GET(req: NextRequest) {
  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit') || '6'), 1), 50);
  const items = await db.newsArticle.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    select: { id: true, slug: true, title: true, excerpt: true, cover: true, category: true, publishedAt: true },
  });
  return NextResponse.json({
    items: items.map((n) => ({
      ...n,
      date: n.publishedAt.toISOString().slice(0, 10),
    })),
  });
}
