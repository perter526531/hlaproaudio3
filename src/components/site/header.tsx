'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import type { NavItem } from '@/lib/site';

export function SiteHeader({ brand, tagline, items }: { brand: string; tagline: string; items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (url: string) => {
    if (url === '/') return pathname === '/';
    return pathname === url || pathname.startsWith(url + '/');
  };

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-border/60 bg-background/90 backdrop-blur transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
      <div className="container-page flex h-16 md:h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Volume2 className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base md:text-lg font-bold tracking-tight">{brand}</span>
            <span className="hidden sm:block text-[10px] text-muted-foreground tracking-widest uppercase">{tagline}</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {items.map((it) => (
            <Link
              key={it.url}
              href={it.url}
              aria-current={isActive(it.url) ? 'true' : undefined}
              className="nav-link text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/contact">在线咨询</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin">管理后台</Link>
          </Button>
        </div>

        <div className="lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="打开菜单">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetTitle className="sr-only">导航菜单</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {items.map((it) => (
                  <SheetClose asChild key={it.url}>
                    <Link
                      href={it.url}
                      aria-current={isActive(it.url) ? 'true' : undefined}
                      className={`px-3 py-2.5 rounded-md text-sm font-medium hover:bg-muted ${isActive(it.url) ? 'bg-muted text-primary' : ''}`}
                    >
                      {it.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild variant="outline">
                    <Link href="/contact">在线咨询</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild>
                    <Link href="/admin">管理后台</Link>
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
