'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, ExternalLink, Trash2, FileText } from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminPagesPage() {
  const [pages, setPages] = useState<any[] | null>(null);
  const load = () => {
    fetch('/api/admin/pages').then((r) => r.json()).then((d) => setPages(d.pages || []));
  };
  useEffect(() => { load(); }, []);

  const create = async (body: any) => {
    const r = await fetch('/api/admin/pages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '创建失败'); return null; }
    toast.success('已创建');
    load();
    return d.page;
  };

  const del = async (id: string) => {
    if (!confirm('确认删除该页面？其下所有内容块将一并删除。')) return;
    const r = await fetch(`/api/admin/pages/${id}`, { method: 'DELETE' });
    if (!r.ok) { const d = await r.json(); toast.error(d.error || '删除失败'); return; }
    toast.success('已删除');
    load();
  };

  return (
    <AdminShell title="页面与内容" action={<CreatePageDialog onCreate={create} />}>
      <Card>
        <CardContent className="p-0">
          {pages === null ? (
            <div className="p-6 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 加载中…</div>
          ) : (
            <div className="divide-y divide-border">
              {pages.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-muted/40 transition">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/admin/pages/${p.id}`} className="font-medium hover:text-primary truncate">{p.title}</Link>
                      {p.isHome && <Badge className="text-[10px]">首页</Badge>}
                      <Badge variant={p.status === 'published' ? 'default' : 'secondary'} className="text-[10px]">{p.status === 'published' ? '已发布' : '草稿'}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <code className="bg-muted px-1.5 py-0.5 rounded">/{p.slug}</code> · {p._count?.blocks || 0} 个内容块
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={p.slug === 'home' ? '/' : '/' + p.slug} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/admin/pages/${p.id}`}>编辑</Link>
                    </Button>
                    {!p.isHome && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminShell>
  );
}

function CreatePageDialog({ onCreate }: { onCreate: (b: any) => Promise<any> }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const submit = async () => {
    const p = await onCreate({ slug, title: title || slug, subtitle });
    if (p) {
      setOpen(false); setSlug(''); setTitle(''); setSubtitle('');
      window.location.href = `/admin/pages/${p.id}`;
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> 新建页面</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>新建页面</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>标题 *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="如：招贤纳士" />
          </div>
          <div className="space-y-1.5">
            <Label>slug（路由）*</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="如：careers" />
            <p className="text-xs text-muted-foreground">访问路径为 /{slug || 'slug'}</p>
          </div>
          <div className="space-y-1.5">
            <Label>副标题（可选）</Label>
            <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="如：Careers" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
            <Button onClick={submit} disabled={!slug.trim()}>创建并编辑</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
