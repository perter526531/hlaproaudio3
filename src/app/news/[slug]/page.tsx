import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { SiteShell } from '@/components/site/shell';
import { Button } from '@/components/ui/button';
import { imageOrPlaceholder } from '@/lib/blocks/utils';

export const dynamic = 'force-dynamic';

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await db.newsArticle.findUnique({ where: { slug } });
  if (!article || article.status !== 'published') return notFound();

  const more = await db.newsArticle.findMany({
    where: { status: 'published', slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take: 4,
    select: { id: true, slug: true, title: true, excerpt: true, publishedAt: true, cover: true },
  });

  return (
    <SiteShell>
      <article className="container-page py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2">
            <Link href="/news">← 返回新闻列表</Link>
          </Button>
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{article.category}</span>
            <span>{article.publishedAt.toISOString().slice(0, 10)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-balance">{article.title}</h1>
          {article.excerpt && <p className="mt-4 text-lg text-muted-foreground text-pretty">{article.excerpt}</p>}
          {article.cover && (
            <div className="mt-8 overflow-hidden rounded-xl bg-muted aspect-video">
              { }
              <img src={imageOrPlaceholder(article.cover, article.title)} alt={article.title} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none whitespace-pre-line leading-relaxed">
            {article.body}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="border-t border-border bg-muted/30">
          <div className="container-page py-12">
            <h2 className="text-xl font-bold mb-6">相关阅读</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {more.map((n) => (
                <Link key={n.id} href={`/news/${n.slug}`} className="group block">
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted mb-3">
                    { }
                    <img src={imageOrPlaceholder(n.cover, n.title)} alt={n.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="text-xs text-muted-foreground">{n.publishedAt.toISOString().slice(0, 10)}</div>
                  <h3 className="mt-1 font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm">{n.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await db.newsArticle.findUnique({ where: { slug } });
  if (!a) return {};
  return { title: a.title, description: a.excerpt || undefined };
}
