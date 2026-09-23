import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { SiteShell } from '@/components/site/shell';
import { BlockRenderer } from '@/components/blocks/block-renderer';
import { parseBlockData } from '@/lib/blocks/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const page = await db.page.findFirst({
    where: { slug: 'home' },
    include: { blocks: { where: { hidden: false }, orderBy: { order: 'asc' } } },
  });
  if (!page) return notFound();

  return (
    <SiteShell>
      {page.blocks.map((b) => (
        <BlockRenderer key={b.id} type={b.type} data={parseBlockData(b.data, b.type)} />
      ))}
    </SiteShell>
  );
}
