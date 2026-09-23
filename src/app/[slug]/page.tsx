import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { SiteShell } from '@/components/site/shell';
import { BlockRenderer } from '@/components/blocks/block-renderer';
import { parseBlockData } from '@/lib/blocks/utils';

export const dynamic = 'force-dynamic';

const RESERVED = ['admin', 'api', 'uploads'];

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVED.includes(slug)) return notFound();

  const page = await db.page.findUnique({
    where: { slug },
    include: { blocks: { where: { hidden: false }, orderBy: { order: 'asc' } } },
  });
  if (!page || page.status !== 'published') return notFound();

  return (
    <SiteShell>
      {page.blocks.map((b) => (
        <BlockRenderer key={b.id} type={b.type} data={parseBlockData(b.data, b.type)} />
      ))}
    </SiteShell>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await db.page.findUnique({ where: { slug } });
  if (!page) return {};
  return {
    title: page.subtitle ? `${page.title} — ${page.subtitle}` : page.title,
    description: page.description || undefined,
  };
}
