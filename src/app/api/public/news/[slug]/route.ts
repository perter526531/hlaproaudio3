import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/news/:slug
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await db.newsArticle.findUnique({ where: { slug } });
  if (!article || article.status !== 'published') {
    return NextResponse.json({ error: '文章不存在' }, { status: 404 });
  }
  return NextResponse.json({
    article: {
      ...article,
      date: article.publishedAt.toISOString().slice(0, 10),
    },
  });
}
