'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Plus, Loader2, Search, ExternalLink, Upload, Pencil, Trash2,
} from 'lucide-react';
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

interface ImageItem {
  id: string;
  url: string;
  filename: string;
  alt: string | null;
  tags: string | null;
  source: string;
  size: number | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
}

export default function AdminImagesPage() {
  const [images, setImages] = useState<ImageItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [ext, setExt] = useState({ url: '', alt: '', filename: '', tags: '' });
  const [editTarget, setEditTarget] = useState<ImageItem | null>(null);
  const [editForm, setEditForm] = useState({ alt: '', tags: '' });

  const load = useCallback((query = '') => {
    setLoading(true);
    fetch(`/api/admin/images?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
      .catch(() => toast.error('加载失败'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(''); }, [load]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('alt', file.name.replace(/\.[^.]+$/, ''));
      const r = await fetch('/api/admin/images/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '上传失败');
      toast.success('上传成功');
      load(q);
    } catch (err: any) {
      toast.error(err?.message || '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addExternal = async () => {
    if (!ext.url.trim()) return;
    setUploading(true);
    try {
      const r = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: ext.url.trim(),
          alt: ext.alt,
          filename: ext.filename || ext.url.split('/').pop() || 'external',
          tags: ext.tags,
          source: 'external',
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '添加失败');
      toast.success('已添加外部图片');
      setExternalOpen(false);
      setExt({ url: '', alt: '', filename: '', tags: '' });
      load(q);
    } catch (err: any) {
      toast.error(err?.message || '添加失败');
    } finally {
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    try {
      const r = await fetch(`/api/admin/images/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alt: editForm.alt, tags: editForm.tags }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '保存失败');
      toast.success('已保存');
      setEditTarget(null);
      load(q);
    } catch (err: any) {
      toast.error(err?.message || '保存失败');
    }
  };

  const remove = async (img: ImageItem) => {
    if (!confirm(`确认删除图片「${img.filename}」？${img.source === 'upload' ? '上传的本地文件也会被一并删除。' : ''}`)) return;
    const r = await fetch(`/api/admin/images/${img.id}`, { method: 'DELETE' });
    if (!r.ok) { const d = await r.json(); toast.error(d.error || '删除失败'); return; }
    toast.success('已删除');
    load(q);
  };

  const fmtSize = (b: number | null) => {
    if (!b && b !== 0) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1024 / 1024).toFixed(2)} MB`;
  };

  const action = (
    <div className="flex items-center gap-2">
      <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" id="img-lib-upload" />
      <Button asChild size="sm" variant="outline" disabled={uploading}>
        <label htmlFor="img-lib-upload" className="cursor-pointer">
          {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
          本地上传
        </label>
      </Button>
      <Dialog open={externalOpen} onOpenChange={setExternalOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4 mr-1" /> 外部链接</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>添加外部图片</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>图片 URL *</Label>
              <Input value={ext.url} onChange={(e) => setExt({ ...ext, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>文件名</Label>
                <Input value={ext.filename} onChange={(e) => setExt({ ...ext, filename: e.target.value })} placeholder="留空自动取 URL 末段" />
              </div>
              <div className="space-y-1.5">
                <Label>标签（逗号分隔）</Label>
                <Input value={ext.tags} onChange={(e) => setExt({ ...ext, tags: e.target.value })} placeholder="如：banner,产品" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Alt 文本</Label>
              <Input value={ext.alt} onChange={(e) => setExt({ ...ext, alt: e.target.value })} placeholder="图片描述" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
              <Button onClick={addExternal} disabled={uploading || !ext.url.trim()}>
                {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return (
    <AdminShell title="图片资源库" action={action}>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索文件名 / Alt 文本"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') load(q); }}
            className="pl-8"
          />
        </div>
        <Button size="sm" variant="secondary" onClick={() => load(q)}>搜索</Button>
      </div>

      {loading && images === null ? (
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      ) : !images || images.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <p className="mb-2">资源库暂无图片</p>
          <p className="text-xs">点击右上角「本地上传」或「外部链接」添加图片</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <Card key={img.id} className="overflow-hidden group">
              <div className="relative aspect-square bg-muted">
                <img src={img.url} alt={img.alt || img.filename} className="h-full w-full object-cover" />
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon" variant="secondary" className="h-7 w-7"
                    onClick={() => { setEditTarget(img); setEditForm({ alt: img.alt || '', tags: img.tags || '' }); }}
                    aria-label="编辑"
                  ><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button
                    size="icon" variant="secondary" className="h-7 w-7 text-destructive"
                    onClick={() => remove(img)}
                    aria-label="删除"
                  ><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <Badge
                  className="absolute bottom-1 left-1 text-[10px] py-0 px-1.5"
                  variant={img.source === 'upload' ? 'default' : 'secondary'}
                >{img.source === 'upload' ? '本地' : '外部'}</Badge>
              </div>
              <CardContent className="p-3 space-y-1">
                <p className="text-sm font-medium truncate" title={img.filename}>{img.filename}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{fmtSize(img.size)}</span>
                  {img.width && img.height ? <span>{img.width}×{img.height}</span> : null}
                </div>
                {img.tags ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {img.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 3).map((t, i) => (
                      <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded truncate max-w-[80px]">{t}</span>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑图片信息</DialogTitle></DialogHeader>
          {editTarget && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-md border border-border bg-muted shrink-0">
                  <img src={editTarget.url} alt={editTarget.alt || editTarget.filename} className="h-full w-full object-cover" />
                </div>
                <p className="text-sm text-muted-foreground truncate">{editTarget.filename}</p>
              </div>
              <div className="space-y-1.5">
                <Label>Alt 文本</Label>
                <Input value={editForm.alt} onChange={(e) => setEditForm({ ...editForm, alt: e.target.value })} placeholder="图片描述，用于 SEO 与无障碍" />
              </div>
              <div className="space-y-1.5">
                <Label>标签（逗号分隔）</Label>
                <Input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="如：banner,产品,首页" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild><Button variant="outline">取消</Button></DialogClose>
                <Button onClick={saveEdit}>保存</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
