'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, FormInput, Image as ImageIcon, Newspaper, Inbox, ArrowRight } from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<{ pages: number; forms: number; images: number; news: number; unread: number; recent: any[] } | null>(null);
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pages').then((r) => r.json()),
      fetch('/api/admin/forms').then((r) => r.json()),
      fetch('/api/admin/images').then((r) => r.json()),
      fetch('/api/admin/news').then((r) => r.json()),
    ]).then(([p, f, img, n]) => {
      const forms = f.forms || [];
      const unread = forms.reduce((acc: number, x: any) => acc + (x._count?.submissions || 0), 0);
      setStats({
        pages: p.pages?.length || 0,
        forms: forms.length,
        images: img.images?.length || 0,
        news: n.news?.length || 0,
        unread,
        recent: forms,
      });
    });
  }, []);

  return (
    <AdminShell title="仪表盘">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard icon={FileText} label="页面" value={stats?.pages} href="/admin/pages" />
        <StatCard icon={FormInput} label="表单" value={stats?.forms} href="/admin/forms" />
        <StatCard icon={ImageIcon} label="图片资源" value={stats?.images} href="/admin/images" />
        <StatCard icon={Newspaper} label="新闻文章" value={stats?.news} href="/admin/news" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">快速开始</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/admin/pages" label="编辑页面内容块" desc="拖拽 / 增删 / 修改每个页面的内容" />
            <QuickLink href="/admin/forms" label="管理表单" desc="新增表单、字段，查看提交" />
            <QuickLink href="/admin/images" label="图片资源库" desc="上传或外部引用图片，统一管理" />
            <QuickLink href="/admin/news" label="新闻文章" desc="发布与管理新闻动态" />
            <QuickLink href="/admin/settings" label="站点设置" desc="品牌名、电话、邮箱、社交链接" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">表单提交概览</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {!stats ? (
              <Skeleton className="h-24" />
            ) : stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无表单</p>
            ) : (
              <ul className="space-y-2">
                {stats.recent.map((f: any) => (
                  <li key={f.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                    <Link href={`/admin/forms/${f.id}`} className="font-medium hover:text-primary">{f.title}</Link>
                    <Badge variant={f._count?.submissions ? 'default' : 'secondary'}>{f._count?.submissions || 0} 条</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function StatCard({ icon: Icon, label, value, href }: { icon: any; label: string; value?: number; href: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        {value === undefined ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-bold">{value}</div>}
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href={href}>查看 <ArrowRight className="h-3 w-3 ml-1" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickLink({ href, label, desc }: { href: string; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-md border border-border/60 p-3 hover:bg-muted transition-colors group">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
    </Link>
  );
}
