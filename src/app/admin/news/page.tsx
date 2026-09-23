'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover: string | null;
  category: string;
  status: string;
  publishedAt: string;
}

export default function AdminNewsListPage() {
  const [news, setNews] = useState<Article[] | null>(null);

  const load = () => {
    fetch('/api/admin/news')
      .then((r) => r.json())
      .then((d) => setNews(d.news || []))
      .catch(() => toast.error('加载失败'));
  };

  useEffect(() => { load(); }, []);

  const create = async (slug: string, title: string) => {
    const r = await fetch('/api/admin/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title }),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '创建失败'); return null; }
    toast.success('已创建，进入编辑');
    return d.article as Article;
  };

  const del = async (id: string) => {
    if (!confirm('确认删除该文章？此操作不可撤销。')) return;
    const r = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('删除失败'); return; }
    toast.success('已删除');
    load();
  };

  const fmtDate = (s: string) => {
    try {
      const d = new Date(s);
      return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return s; }
  };

  const action = <CreateNewsDialog onCreate={create} />;

  return (
    <AdminShell title="新闻资讯" action={action}>
      {!news ? (
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      ) : news.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <p className="mb-2">暂无文章</p>
          <p className="text-xs">点击右上角「新建文章」开始</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.2fr_auto] gap-3 px-4 py-2.5 border-b border-border text-xs font-medium text-muted-foreground">
              <div>标题</div><div>分类</div><div>状态</div><div>发布时间</div><div className="text-right">操作</div>
            </div>
            <div className="divide-y divide-border">
              {news.map((a) => (
                <div key={a.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] gap-2 md:gap-3 p-4 hover:bg-muted/30 transition items-center">
                  <div className="min-w-0">
                    <Link href={`/admin/news/${a.id}`} className="font-medium hover:text-primary truncate block">{a.title}</Link>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      <code className="bg-muted px-1.5 py-0.5 rounded">/news/{a.slug}</code>
                    </div>
                  </div>
                  <div><Badge variant="secondary" className="text-[11px]">{a.category}</Badge></div>
                  <div>
                    <Badge variant={a.status === 'published' ? 'default' : 'outline'} className="text-[11px]">
                      {a.status === 'published' ? '已发布' : '草稿'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{fmtDate(a.publishedAt)}</div>
                  <div className="flex items-center gap-1 justify-self-end">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/news/${a.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button asChild size="sm"><Link href={`/admin/news/${a.id}`}>编辑</Link></Button>
                    <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => del(a.id)} aria-label="删除"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AdminShell>
  );
}

function CreateNewsDialog({ onCreate }: { onCreate: (slug: string, title: string) => Promise<Article | null> }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const a = await onCreate(slug, title || slug);
    setSaving(false);
    if (a) {
      setOpen(false); setSlug(''); setTitle('');
      window.location.href = `/admin/news/${a.id}`;
    }
  };

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> 新建文章</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>新建文章</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>标题 *</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!slug || slug === slugify(slug)) setSlug(slugify(e.target.value)); }}
              placeholder="如：AudioCenter 亮相 2024 北京展"
            />
          </div>
          <div className="space-y-1.5">
            <Label>slug（URL 路径）*</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="如：audiocenter-beijing-expo-2024" />
            <p className="text-xs text-muted-foreground">访问路径为 /news/{slug || 'slug'}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button variant="outline" disabled={saving}>取消</Button></DialogClose>
            <Button onClick={submit} disabled={saving || !slug.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              创建并编辑
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
