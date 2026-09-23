'use client';

import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Search, X, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface ImageItem {
  id: string;
  url: string;
  filename: string;
  alt: string | null;
  tags: string | null;
  source: string;
  width?: number | null;
  height?: number | null;
}

export function ImagePicker({ value, onChange, label = '图片' }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [uploading, setUploading] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = (query = '') => {
    setLoading(true);
    fetch(`/api/admin/images?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setImages(d.images || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (open) load(); }, [open]);

  const pick = (img: ImageItem) => {
    onChange(img.url);
    setOpen(false);
  };

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
      onChange(d.image.url);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || '上传失败');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addExternal = async () => {
    if (!externalUrl.trim()) return;
    setUploading(true);
    try {
      const r = await fetch('/api/admin/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: externalUrl.trim(), filename: externalUrl.split('/').pop() || 'external', source: 'external' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '添加失败');
      toast.success('已添加外部图片');
      setExternalUrl('');
      load(q);
      onChange(d.image.url);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || '添加失败');
    } finally {
      setUploading(false);
    }
  };

  const remove = () => onChange('');

  return (
    <div>
      <Label className="text-sm font-medium block mb-1.5">{label}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative h-16 w-24 overflow-hidden rounded-md border border-border bg-muted">
            { }
            <img src={value} alt={value} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-16 w-24 rounded-md border border-dashed border-border bg-muted/40" />
        )}
        <div className="flex flex-col gap-1.5">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <ImagePlus className="h-4 w-4 mr-1" /> {value ? '更换图片' : '选择图片'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>图片资源库</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="library" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="library">资源库</TabsTrigger>
                  <TabsTrigger value="upload">本地上传</TabsTrigger>
                  <TabsTrigger value="external">外部链接</TabsTrigger>
                </TabsList>
                <TabsContent value="library" className="flex-1 overflow-hidden flex flex-col mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索文件名 / 标签"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') load(q); }}
                        className="pl-8"
                      />
                    </div>
                    <Button type="button" size="sm" variant="secondary" onClick={() => load(q)}>搜索</Button>
                  </div>
                  <ScrollArea className="flex-1 h-[50vh]">
                    {loading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : images.length === 0 ? (
                      <div className="text-center py-12 text-sm text-muted-foreground">资源库暂无图片，可切换到「本地上传」</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pr-2">
                        {images.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => pick(img)}
                            className="group relative aspect-square overflow-hidden rounded-md border border-border hover:border-primary hover:ring-2 hover:ring-primary transition-all"
                          >
                            { }
                            <img src={img.url} alt={img.alt || img.filename} className="h-full w-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">{img.filename}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="upload" className="mt-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-10 text-center">
                    <ImagePlus className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">支持 JPG / PNG / WebP / GIF / SVG，单个 ≤ 10MB</p>
                    <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" id="img-upload-input" />
                    <Button type="button" asChild variant="outline" disabled={uploading}>
                      <label htmlFor="img-upload-input" className="cursor-pointer">{uploading ? '上传中…' : '选择文件上传'}</label>
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="external" className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label>外部图片 URL</Label>
                    <Input
                      placeholder="https://..."
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">外部图片不会被下载到服务器，仅作为资源库记录引用。</p>
                  </div>
                  <Button type="button" onClick={addExternal} disabled={uploading || !externalUrl.trim()}>
                    <ExternalLink className="h-4 w-4 mr-1" /> 添加并使用
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-muted-foreground">
              <X className="h-3 w-3 mr-1" /> 清除
            </Button>
          )}
        </div>
      </div>
      {value && <p className="mt-1.5 text-xs text-muted-foreground break-all">{value}</p>}
    </div>
  );
}
