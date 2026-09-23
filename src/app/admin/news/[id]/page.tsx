'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { ImagePicker } from '@/components/admin/image-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CATEGORIES = ['企业新闻', '新品发布', '案例分享', '展会资讯'];

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  cover: string | null;
  category: string;
  status: string;
  publishedAt: string;
}

export default function NewsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      fetch(`/api/admin/news/${id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.article) setArticle(d.article);
          else toast.error('文章不存在');
        })
        .catch(() => toast.error('加载失败'));
    });
  }, [params]);

  const update = <K extends keyof Article>(k: K, v: Article[K]) => {
    setArticle((a) => (a ? { ...a, [k]: v } : a));
  };

  const fmtDateInput = (s: string) => {
    const d = new Date(s);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
  };

  const save = async () => {
    if (!article) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/admin/news/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          body: article.body,
          cover: article.cover,
          category: article.category,
          status: article.status,
          publishedAt: article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString(),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '保存失败');
      toast.success('已保存');
      setArticle(d.article);
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const action = (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm"><Link href="/admin/news"><ArrowLeft className="h-4 w-4 mr-1" /> 返回</Link></Button>
      <Button size="sm" onClick={save} disabled={saving || !article}>
        {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
        保存
      </Button>
    </div>
  );

  if (!article) {
    return (
      <AdminShell title="新闻编辑" action={action}>
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`编辑：${article.title}`} action={action}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">文章内容</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>标题</Label>
              <Input value={article.title} onChange={(e) => update('title', e.target.value)} placeholder="文章标题" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>slug</Label>
                <Input value={article.slug} onChange={(e) => update('slug', e.target.value)} placeholder="url-slug" />
              </div>
              <div className="space-y-1.5">
                <Label>分类</Label>
                <Select value={article.category} onValueChange={(v) => update('category', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={article.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>发布时间</Label>
                <Input
                  type="datetime-local"
                  value={fmtDateInput(article.publishedAt)}
                  onChange={(e) => update('publishedAt', new Date(e.target.value).toISOString())}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>封面图</Label>
              <ImagePicker value={article.cover || ''} onChange={(url) => update('cover', url || null)} label="封面" />
            </div>
            <div className="space-y-1.5">
              <Label>摘要</Label>
              <Textarea
                rows={3}
                value={article.excerpt || ''}
                onChange={(e) => update('excerpt', e.target.value)}
                placeholder="列表与详情页顶部的简短介绍"
              />
            </div>
            <div className="space-y-1.5">
              <Label>正文</Label>
              <Textarea
                rows={12}
                value={article.body}
                onChange={(e) => update('body', e.target.value)}
                placeholder="正文内容（纯文本或简单 HTML）"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">支持纯文本或简单 HTML，换行会被保留。</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-20 self-start">
          <CardHeader><CardTitle className="text-base">实时预览</CardTitle></CardHeader>
          <CardContent>
            <article>
              {article.cover ? (
                <div className="aspect-video overflow-hidden rounded-md mb-4 bg-muted">
                  <img src={article.cover} alt={article.title} className="h-full w-full object-cover" />
                </div>
              ) : null}
              <p className="text-xs text-muted-foreground mb-1">{article.category}</p>
              <h2 className="text-xl font-bold mb-2">{article.title || '未命名'}</h2>
              {article.excerpt ? <p className="text-sm text-muted-foreground mb-4">{article.excerpt}</p> : null}
              <div className="text-sm whitespace-pre-line prose prose-sm max-w-none">{article.body}</div>
            </article>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
