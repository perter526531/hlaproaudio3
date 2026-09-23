'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, FileText, FormInput, Image as ImageIcon, Settings,
  Newspaper, Menu as MenuIcon, Volume2, ExternalLink, X, LogOut, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/pages', label: '页面与内容', icon: FileText },
  { href: '/admin/forms', label: '表单管理', icon: FormInput },
  { href: '/admin/images', label: '图片资源库', icon: ImageIcon },
  { href: '/admin/news', label: '新闻资讯', icon: Newspaper },
  { href: '/admin/menus', label: '导航菜单', icon: MenuIcon },
  { href: '/admin/settings', label: '站点设置', icon: Settings },
];

export function AdminSidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/');
  return (
    <nav className={cn('flex flex-col gap-1', mobile ? 'mt-2' : '')}>
      {NAV.map((it) => {
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={onNavigate}
            aria-current={isActive(it.href) ? 'true' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(it.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{it.label}</span>
          </Link>
        );
      })}
      <div className="my-3 border-t border-border" />
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        <ExternalLink className="h-4 w-4" /> 访问前台
      </Link>
    </nav>
  );
}

export function AdminHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const userName = session?.user?.name || 'admin';
  return (
    <header className="sticky top-0 z-40 flex h-14 md:h-16 items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 md:px-6">
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="打开菜单"><MenuIcon className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px]">
            <SheetTitle className="sr-only">管理菜单</SheetTitle>
            <Link href="/admin" className="flex items-center gap-2 mb-4" onClick={() => setOpen(false)}>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Volume2 className="h-4 w-4" />
              </span>
              <span className="font-bold">后台管理</span>
            </Link>
            <AdminSidebar mobile onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
      <h1 className="text-base md:text-lg font-semibold flex-1 truncate">{title}</h1>
      {action}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase">
              {userName.charAt(0)}
            </span>
            <span className="hidden sm:inline text-sm font-medium">{userName}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>已登录</DropdownMenuLabel>
          <DropdownMenuLabel className="font-normal text-muted-foreground -mt-2">{userName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/" target="_blank"><ExternalLink className="h-3.5 w-3.5 mr-2" /> 访问前台</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
          >
            <LogOut className="h-3.5 w-3.5 mr-2" /> 退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export function AdminShell({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-background">
        <Link href="/admin" className="flex items-center gap-2 h-16 px-6 border-b border-border">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Volume2 className="h-5 w-5" />
          </span>
          <span className="font-bold text-base">AudioCenter CMS</span>
        </Link>
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          <AdminSidebar />
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader title={title} action={action} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
