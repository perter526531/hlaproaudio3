'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader2, Trash2, ExternalLink, Pencil } from 'lucide-react';
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

interface FormItem {
  id: string;
  slug: string;
  title: string;
  status: string;
  _count?: { submissions: number };
}

export default function AdminFormsListPage() {
  const [forms, setForms] = useState<FormItem[] | null>(null);

  const load = () => {
    fetch('/api/admin/forms')
      .then((r) => r.json())
      .then((d) => setForms(d.forms || []))
      .catch(() => toast.error('加载失败'));
  };

  useEffect(() => { load(); }, []);

  const create = async (slug: string, title: string) => {
    const r = await fetch('/api/admin/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title }),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '创建失败'); return null; }
    toast.success('已创建');
    return d.form as FormItem;
  };

  const del = async (id: string) => {
    if (!confirm('确认删除该表单？所有字段与提交记录将一并删除。')) return;
    const r = await fetch(`/api/admin/forms/${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('删除失败'); return; }
    toast.success('已删除');
    load();
  };

  const action = <CreateFormDialog onCreate={create} />;

  return (
    <AdminShell title="表单管理" action={action}>
      {!forms ? (
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      ) : forms.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <p className="mb-2">暂无表单</p>
          <p className="text-xs">点击右上角「新建表单」开始</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/forms/${f.id}`} className="font-medium hover:text-primary block truncate">{f.title}</Link>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      <code className="bg-muted px-1.5 py-0.5 rounded">/{f.slug}</code>
                    </div>
                  </div>
                  <Badge variant={f.status === 'published' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                    {f.status === 'published' ? '已发布' : '草稿'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px]">
                    {f._count?.submissions || 0} 条提交
                  </Badge>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  <Button asChild variant="ghost" size="sm" className="flex-1">
                    <Link href={`/admin/forms/${f.id}`}><Pencil className="h-3.5 w-3.5 mr-1" /> 编辑</Link>
                  </Button>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/${f.slug}`} target="_blank" aria-label="预览"><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="text-destructive h-8 w-8"
                    onClick={() => del(f.id)} aria-label="删除"
                  ><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function CreateFormDialog({ onCreate }: { onCreate: (slug: string, title: string) => Promise<FormItem | null> }) {
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const f = await onCreate(slug, title || slug);
    setSaving(false);
    if (f) {
      setOpen(false); setSlug(''); setTitle('');
      window.location.href = `/admin/forms/${f.id}`;
    }
  };

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> 新建表单</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>新建表单</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>表单标题 *</Label>
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }}
              placeholder="如：产品咨询"
            />
          </div>
          <div className="space-y-1.5">
            <Label>slug（URL 路径）*</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="如：inquiry" />
            <p className="text-xs text-muted-foreground">访问路径为 /{slug || 'slug'}</p>
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
