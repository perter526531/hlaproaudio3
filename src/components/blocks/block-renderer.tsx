'use client';

import * as Lucide from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { imageOrPlaceholder } from '@/lib/blocks/utils';
import { DynamicForm } from '@/components/forms/dynamic-form';
import type { BlockData } from '@/lib/blocks/utils';

// ---------------------------------------------------------------------------

export function HeroBlock({ data }: { data: BlockData }) {
  const bg = imageOrPlaceholder(data.background, 'AudioCenter');
  return (
    <section
      className="relative w-full overflow-hidden text-white"
      style={{ minHeight: typeof data.minHeight === 'number' ? `${data.minHeight}px` : '560px' }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/45 to-black/65" />
      <div className={`relative container-page py-24 md:py-32 flex flex-col ${data.align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
        {data.eyebrow && (
          <span className="inline-block mb-4 px-3 py-1 text-xs tracking-[0.3em] uppercase border border-white/25 rounded-full bg-white/5">
            {data.eyebrow}
          </span>
        )}
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance max-w-4xl">
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="mt-6 text-lg md:text-xl text-white/80 max-w-2xl text-pretty">
            {data.subtitle}
          </p>
        )}
        {(data.primaryCta?.label || data.secondaryCta?.label) && (
          <div className={`mt-10 flex flex-wrap gap-4 ${data.align === 'center' ? 'justify-center' : ''}`}>
            {data.primaryCta?.label && (
              <Button asChild size="lg">
                <Link href={data.primaryCta.href || '/'}>{data.primaryCta.label}</Link>
              </Button>
            )}
            {data.secondaryCta?.label && (
              <Button asChild size="lg" variant="outline" className="bg-white/5 border-white/40 text-white hover:bg-white/15">
                <Link href={data.secondaryCta.href || '/'}>{data.secondaryCta.label}</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export function MarqueeBlock({ data }: { data: BlockData }) {
  const items: { text?: string }[] = Array.isArray(data.items) ? data.items : [];
  if (items.length === 0) return null;
  const speed = `marquee-${data.speed || 'normal'}`;
  const row = [...items, ...items];
  return (
    <div className="marquee-container border-y border-border bg-muted/30 overflow-hidden">
      <div className={`animate-marquee ${speed} flex whitespace-nowrap py-3`}>
        {row.map((it, i) => (
          <span key={i} className="mx-6 text-sm font-semibold tracking-widest text-muted-foreground uppercase">
            {it.text}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FeaturesBlock({ data }: { data: BlockData }) {
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  const cols = Math.min(Math.max(Number(data.columns) || 3, 1), 4);
  return (
    <section className="container-page py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        {data.title && <h2 className="text-3xl md:text-4xl font-bold text-balance">{data.title}</h2>}
        {data.subtitle && <p className="mt-3 text-muted-foreground text-pretty">{data.subtitle}</p>}
      </div>
      <div className={`grid gap-6 ${cols === 1 ? 'sm:grid-cols-1' : cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {items.map((it, i) => {
          const Icon = (Lucide as unknown as Record<string, any>)[it.icon] ?? null;
          return (
            <Card key={i} className="border-border/60 hover:shadow-lg transition-shadow fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <CardContent className="p-6">
                {it.image ? (
                  <div className="mb-4 aspect-video overflow-hidden rounded-md bg-muted">
                    { }
                    <img src={imageOrPlaceholder(it.image, it.title)} alt={it.title || ''} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {Icon ? <Icon className="h-6 w-6" /> : null}
                  </div>
                )}
                <h3 className="text-lg font-semibold">{it.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{it.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export function StatsBlock({ data }: { data: BlockData }) {
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  const bg =
    data.background === 'dark' ? 'bg-neutral-950 text-white'
    : data.background === 'gradient' ? 'hero-bg text-white'
    : 'bg-muted text-foreground';
  return (
    <section className={`${bg} py-16 md:py-20`}>
      <div className="container-page">
        {data.title && <h2 className="text-center text-2xl md:text-3xl font-bold mb-10">{data.title}</h2>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {items.map((it, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-bold tracking-tight">{it.value}</div>
              <div className="mt-2 text-xs md:text-sm opacity-80">{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductCategoriesBlock({ data }: { data: BlockData }) {
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="container-page py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        {data.title && <h2 className="text-3xl md:text-4xl font-bold">{data.title}</h2>}
        {data.subtitle && <p className="mt-3 text-muted-foreground">{data.subtitle}</p>}
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <Link key={i} href={it.href || '#'} className="group block">
            <Card className="overflow-hidden border-border/60 hover:shadow-xl transition-all hover:-translate-y-1 fade-up h-full" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                { }
                <img src={imageOrPlaceholder(it.image, it.title)} alt={it.title || ''} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg flex items-center justify-between">
                  {it.title}
                  <span className="text-primary text-sm opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </h3>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">{it.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProductsBlock({ data }: { data: BlockData }) {
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  const cols = Math.min(Math.max(Number(data.columns) || 3, 1), 4);
  return (
    <section className="container-page py-16 md:py-24">
      <div className="text-center max-w-2xl mx-auto mb-12">
        {data.title && <h2 className="text-3xl md:text-4xl font-bold">{data.title}</h2>}
        {data.subtitle && <p className="mt-3 text-muted-foreground">{data.subtitle}</p>}
      </div>
      <div className={`grid gap-6 ${cols === 1 ? 'sm:grid-cols-1' : cols === 2 ? 'sm:grid-cols-2' : cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {items.map((it, i) => {
          const card = (
            <Card className="group overflow-hidden border-border/60 hover:shadow-xl transition-all hover:-translate-y-1 fade-up h-full" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="relative aspect-square overflow-hidden bg-neutral-900">
                { }
                <img src={imageOrPlaceholder(it.image, it.name)} alt={it.name || ''} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {it.featured && data.badgeLabel && (
                  <Badge className="absolute top-3 left-3">{data.badgeLabel}</Badge>
                )}
              </div>
              <CardContent className="p-5">
                <h3 className="font-semibold text-lg">{it.name}</h3>
                {it.desc && <p className="mt-1 text-sm text-muted-foreground text-pretty">{it.desc}</p>}
              </CardContent>
            </Card>
          );
          return it.href ? (
            <Link key={i} href={it.href} className="block">{card}</Link>
          ) : (
            <div key={i}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}

export function NewsBlock({ data }: { data: BlockData }) {
  return <NewsListClient limit={Number(data.limit) || 3} title={data.title} subtitle={data.subtitle} showMore={data.showMore} moreLabel={data.moreLabel} moreHref={data.moreHref} />;
}

// NewsBlock needs dynamic data — we fetch via API client-side.
import { useEffect, useState } from 'react';
function NewsListClient({ limit, title, subtitle, showMore, moreLabel, moreHref }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`/api/public/news?limit=${limit}`)
      .then((r) => r.json())
      .then((d) => { setItems(d.items || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [limit]);
  return (
    <section className="container-page py-16 md:py-24">
      <div className="flex items-end justify-between mb-10">
        <div>
          {title && <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>}
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        </div>
        {showMore && (
          <Button asChild variant="outline">
            <Link href={moreHref || '/news'}>{moreLabel || '查看全部'}</Link>
          </Button>
        )}
      </div>
      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0,1,2].map(i => <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">暂无新闻</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((n: any, i) => (
            <Link key={n.id} href={`/news/${n.slug}`} className="group block fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-5">
                  <div className="text-xs text-muted-foreground">{n.date}</div>
                  <h3 className="mt-2 font-semibold line-clamp-2 group-hover:text-primary transition-colors">{n.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{n.excerpt}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function CtaBlock({ data }: { data: BlockData }) {
  const bgClass =
    data.background === 'dark' ? 'bg-neutral-950 text-white'
    : data.background === 'light' ? 'bg-muted'
    : 'hero-bg text-white';
  const img = data.image ? imageOrPlaceholder(data.image, '') : null;
  return (
    <section className={`${bgClass} py-16 md:py-20 relative overflow-hidden`}>
      {img && (
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${img})` }} />
      )}
      <div className="container-page relative text-center max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-balance">{data.title}</h2>
        {data.subtitle && <p className="mt-4 text-lg opacity-85 text-pretty">{data.subtitle}</p>}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          {data.primaryCta?.label && (
            <Button asChild size="lg">
              <Link href={data.primaryCta.href || '/'}>{data.primaryCta.label}</Link>
            </Button>
          )}
          {data.secondaryCta?.label && (
            <Button asChild size="lg" variant="outline" className={data.background === 'light' ? '' : 'bg-white/5 border-white/40 text-white hover:bg-white/15'}>
              <Link href={data.secondaryCta.href || '/'}>{data.secondaryCta.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function TextBlock({ data }: { data: BlockData }) {
  const align = data.align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <section className="container-page py-16 md:py-20">
      <div className={`max-w-3xl ${align}`}>
        {data.title && <h2 className="text-2xl md:text-3xl font-bold mb-4">{data.title}</h2>}
        {data.body && (
          <div className="text-muted-foreground whitespace-pre-line leading-relaxed text-pretty">
            {data.body}
          </div>
        )}
      </div>
    </section>
  );
}

export function ImageBlock({ data }: { data: BlockData }) {
  const widthClass = data.width === 'narrow' ? 'max-w-xl' : data.width === 'content' ? 'max-w-4xl' : '';
  return (
    <section className="container-page py-12">
      <figure className={widthClass}>
        <div className="overflow-hidden rounded-lg bg-muted">
          { }
          <img src={imageOrPlaceholder(data.src, data.alt || '')} alt={data.alt || ''} className="w-full h-auto object-cover" />
        </div>
        {data.caption && <figcaption className="mt-3 text-center text-sm text-muted-foreground">{data.caption}</figcaption>}
      </figure>
    </section>
  );
}

export function GalleryBlock({ data }: { data: BlockData }) {
  const images: any[] = Array.isArray(data.images) ? data.images : [];
  const cols = Math.min(Math.max(Number(data.columns) || 4, 2), 6);
  return (
    <section className="container-page py-16 md:py-24">
      {data.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{data.title}</h2>}
      <div className={`grid gap-4 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : cols === 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : cols === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {images.map((im, i) => (
          <div key={i} className="group overflow-hidden rounded-lg bg-muted aspect-square">
            { }
            <img src={imageOrPlaceholder(im.src, im.alt || '')} alt={im.alt || ''} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SplitBlock({ data }: { data: BlockData }) {
  const imgPos = data.imagePosition || 'right';
  const img = (
    <div className="overflow-hidden rounded-xl bg-neutral-900 aspect-[4/3]">
      { }
      <img src={imageOrPlaceholder(data.image, data.title)} alt={data.title || ''} className="h-full w-full object-cover" />
    </div>
  );
  const text = (
    <div className="flex flex-col justify-center">
      {data.subtitle && <div className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">{data.subtitle}</div>}
      {data.title && <h2 className="text-3xl md:text-4xl font-bold text-balance">{data.title}</h2>}
      {data.body && <p className="mt-4 text-muted-foreground leading-relaxed text-pretty">{data.body}</p>}
      {data.cta?.label && (
        <div className="mt-6">
          <Button asChild>
            <Link href={data.cta.href || '/'}>{data.cta.label}</Link>
          </Button>
        </div>
      )}
    </div>
  );
  return (
    <section className="container-page py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-2 items-center">
        {imgPos === 'left' ? (<>{img}{text}</>) : (<>{text}{img}</>)}
      </div>
    </section>
  );
}

export function ContactBlock({ data }: { data: BlockData }) {
  const items = [
    { icon: 'Phone', label: '电话', value: data.phone },
    { icon: 'Mail', label: '邮箱', value: data.email },
    { icon: 'MapPin', label: '地址', value: data.address },
    { icon: 'Clock', label: '工作时间', value: data.hours },
    { icon: 'MessageCircle', label: '微信', value: data.wechat },
    { icon: 'Smartphone', label: 'WhatsApp', value: data.whatsapp },
  ].filter((x) => x.value);
  return (
    <section className="container-page py-16 md:py-24">
      {data.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{data.title}</h2>}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {items.map((it, i) => {
          const Icon = (Lucide as unknown as Record<string, any>)[it.icon];
          return (
            <Card key={i} className="fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                  {Icon ? <Icon className="h-5 w-5" /> : null}
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">{it.label}</div>
                  <div className="font-medium mt-0.5 break-all">{it.value}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {data.mapEmbed && (
        <div className="rounded-xl overflow-hidden border border-border h-72" dangerouslySetInnerHTML={{ __html: data.mapEmbed }} />
      )}
    </section>
  );
}

export function FormBlock({ data }: { data: BlockData }) {
  return (
    <section className="container-page py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        {data.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-3">{data.title}</h2>}
        {data.subtitle && <p className="text-center text-muted-foreground mb-8">{data.subtitle}</p>}
        {data.formSlug && <DynamicForm slug={data.formSlug} />}
      </div>
    </section>
  );
}

export function FaqBlock({ data }: { data: BlockData }) {
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="container-page py-16 md:py-24">
      {data.title && <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">{data.title}</h2>}
      <div className="max-w-3xl mx-auto divide-y divide-border">
        {items.map((it, i) => (
          <details key={i} className="group py-5">
            <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-lg">
              {it.q}
              <span className="ml-4 text-primary transition-transform group-open:rotate-45 text-2xl leading-none">+</span>
            </summary>
            <p className="mt-3 text-muted-foreground leading-relaxed">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function LogosBlock({ data }: { data: BlockData }) {
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  return (
    <section className="border-y border-border bg-muted/30 py-12">
      <div className="container-page">
        {data.title && <h2 className="text-center text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-8">{data.title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
          {items.map((it, i) => (
            <div key={i} className="flex items-center justify-center h-16 px-4 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition">
              {it.image ? (
                 
                <img src={imageOrPlaceholder(it.image, it.name)} alt={it.name || ''} className="max-h-12 w-auto object-contain" />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">{it.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dispatcher used by the public page renderer.
// ---------------------------------------------------------------------------

export function BlockRenderer({ type, data }: { type: string; data: BlockData }) {
  switch (type) {
    case 'hero': return <HeroBlock data={data} />;
    case 'marquee': return <MarqueeBlock data={data} />;
    case 'features': return <FeaturesBlock data={data} />;
    case 'stats': return <StatsBlock data={data} />;
    case 'productCategories': return <ProductCategoriesBlock data={data} />;
    case 'products': return <ProductsBlock data={data} />;
    case 'news': return <NewsBlock data={data} />;
    case 'cta': return <CtaBlock data={data} />;
    case 'text': return <TextBlock data={data} />;
    case 'image': return <ImageBlock data={data} />;
    case 'gallery': return <GalleryBlock data={data} />;
    case 'split': return <SplitBlock data={data} />;
    case 'contact': return <ContactBlock data={data} />;
    case 'form': return <FormBlock data={data} />;
    case 'faq': return <FaqBlock data={data} />;
    case 'logos': return <LogosBlock data={data} />;
    default: return null;
  }
}
