'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, ChevronUp, ChevronDown, Trash2, Eye, EyeOff, GripVertical, Save, Loader2, ArrowLeft, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { AdminShell } from '@/components/admin/shell';
import { ImagePicker } from '@/components/admin/image-picker';
import { BLOCK_TYPES, getBlockTypeMeta, type BlockType, type BlockField } from '@/lib/blocks/types';
import { BlockRenderer } from '@/components/blocks/block-renderer';

type Block = { id: string; type: BlockType; title: string | null; data: any; order: number; hidden: boolean };

export default function PageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [pageId, setPageId] = useState<string>('');
  const [pageMeta, setPageMeta] = useState<{ slug: string; title: string; subtitle: string | null; status: string; isHome: boolean } | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [openBlock, setOpenBlock] = useState<string>('');
  const [previewBlockId, setPreviewBlockId] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { id } = await params;
      setPageId(id);
      const r = await fetch(`/api/admin/pages/${id}`);
      const d = await r.json();
      setPageMeta(d.page);
      const rb = await fetch(`/api/admin/pages/${id}/blocks`);
      const db = await rb.json();
      setBlocks(db.blocks || []);
      if ((db.blocks || []).length > 0) setOpenBlock(db.blocks[0].id);
      setLoading(false);
    })();
  }, [params]);

  const saveMeta = async (patch: any) => {
    const r = await fetch(`/api/admin/pages/${pageId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '保存失败'); return; }
    setPageMeta(d.page);
    toast.success('页面属性已保存');
  };

  const addBlock = async (type: BlockType) => {
    const r = await fetch(`/api/admin/pages/${pageId}/blocks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '添加失败'); return; }
    setBlocks((p) => [...p, d.block]);
    setOpenBlock(d.block.id);
    toast.success('已添加新内容块');
  };

  const saveBlock = useCallback(async (id: string, patch: Partial<Block>) => {
    setSavingId(id);
    const r = await fetch(`/api/admin/pages/${pageId}/blocks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '保存失败'); }
    // silent success
    setSavingId(null);
  }, [pageId]);

  const updateBlock = (id: string, updater: (b: Block) => Block, persist?: Partial<Block>) => {
    setBlocks((p) => p.map((b) => (b.id === id ? updater(b) : b)));
    if (persist) saveBlock(id, persist);
  };

  const deleteBlock = async (id: string) => {
    if (!confirm('确认删除该内容块？')) return;
    const r = await fetch(`/api/admin/pages/${pageId}/blocks/${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('删除失败'); return; }
    setBlocks((p) => p.filter((b) => b.id !== id));
    toast.success('已删除');
  };

  const duplicateBlock = async (id: string) => {
    const b = blocks.find((x) => x.id === id);
    if (!b) return;
    const r = await fetch(`/api/admin/pages/${pageId}/blocks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: b.type, title: (b.title || '') + ' (副本)', order: b.order + 1 }),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '复制失败'); return; }
    // then copy data
    const r2 = await fetch(`/api/admin/pages/${pageId}/blocks/${d.block.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: b.data, title: (b.title || '') + ' (副本)' }),
    });
    const d2 = await r2.json();
    setBlocks((p) => {
      const idx = p.findIndex((x) => x.id === id);
      const arr = [...p];
      arr.splice(idx + 1, 0, d2.block);
      // renumber
      return arr.map((x, i) => ({ ...x, order: i }));
    });
    toast.success('已复制');
  };

  const move = (id: string, dir: -1 | 1) => {
    setBlocks((p) => {
      const idx = p.findIndex((x) => x.id === id);
      const target = idx + dir;
      if (target < 0 || target >= p.length) return p;
      const arr = [...p];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      const reordered = arr.map((x, i) => ({ ...x, order: i }));
      // persist new orders
      Promise.all(reordered.map((x) => saveBlockRef(x.id, { order: x.order })));
      return reordered;
    });
  };

  const saveBlockRef = async (id: string, patch: any) => {
    await fetch(`/api/admin/pages/${pageId}/blocks/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  };

  if (loading) return <AdminShell title="页面编辑"><div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> 加载中…</div></AdminShell>;
  if (!pageMeta) return <AdminShell title="页面编辑"><p className="text-muted-foreground">页面不存在</p></AdminShell>;

  const slugForLink = pageMeta.slug === 'home' ? '/' : '/' + pageMeta.slug;

  return (
    <AdminShell
      title={`编辑：${pageMeta.title}`}
      action={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/pages"><ArrowLeft className="h-4 w-4 mr-1" /> 返回列表</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={slugForLink} target="_blank">在前台查看</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Meta editor */}
          <Card>
            <CardHeader><CardTitle className="text-base">页面属性</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>标题</Label>
                <Input defaultValue={pageMeta.title} onChange={(e) => setPageMeta((p) => p ? { ...p, title: e.target.value } : p)} />
              </div>
              <div className="space-y-1.5">
                <Label>副标题（英文/导航上方）</Label>
                <Input defaultValue={pageMeta.subtitle || ''} onChange={(e) => setPageMeta((p) => p ? { ...p, subtitle: e.target.value } : p)} />
              </div>
              <div className="space-y-1.5">
                <Label>slug（路由）</Label>
                <Input defaultValue={pageMeta.slug} disabled={pageMeta.isHome} onChange={(e) => setPageMeta((p) => p ? { ...p, slug: e.target.value } : p)} />
              </div>
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={pageMeta.status} onValueChange={(v) => setPageMeta((p) => p ? { ...p, status: v } : p)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => saveMeta(pageMeta)}><Save className="h-4 w-4 mr-1" /> 保存属性</Button>
              </div>
            </CardContent>
          </Card>

          {/* Blocks list */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-semibold">内容块 ({blocks.length})</h2>
              <p className="text-xs text-muted-foreground mt-0.5">点击任意块标题可展开编辑其内容字段；右侧按钮可排序 / 显隐 / 复制 / 删除</p>
            </div>
            <AddBlockDialog onAdd={addBlock} />
          </div>

          {blocks.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">
              本页暂无内容块，点击右上角「添加内容块」开始构建。
            </CardContent></Card>
          ) : (
            <Accordion value={openBlock} onValueChange={setOpenBlock} type="single" className="space-y-3">
              {blocks.map((b, i) => {
                const meta = getBlockTypeMeta(b.type);
                const isOpen = openBlock === b.id;
                return (
                  <AccordionItem key={b.id} value={b.id} className={`border rounded-lg bg-background overflow-hidden transition-colors ${isOpen ? 'border-primary/50 shadow-sm' : 'border-border'}`}>
                    <AccordionTrigger className="hover:no-underline px-4 py-3 [&>svg]:hidden cursor-pointer group">
                      <div className="flex items-center gap-3 w-full">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">{meta?.label || b.type}</Badge>
                            <span className="text-sm font-medium">{b.title || meta?.label}</span>
                            {b.hidden && <Badge variant="secondary" className="text-[10px]">隐藏</Badge>}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {isOpen ? '点击此处收起' : '点击此处展开编辑内容'}
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => move(b.id, -1)} title="上移"><ChevronUp className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={i === blocks.length - 1} onClick={() => move(b.id, 1)} title="下移"><ChevronDown className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateBlock(b.id, (x) => ({ ...x, hidden: !x.hidden }), { hidden: !b.hidden })}>
                            {b.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateBlock(b.id)}><Copy className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(b.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0 space-y-4">
                      <div className="flex items-center gap-3 pt-2">
                        <Button size="sm" onClick={() => setPreviewBlockId(previewBlockId === b.id ? '' : b.id)}>
                          {previewBlockId === b.id ? '收起预览' : '查看预览'}
                        </Button>
                        {savingId === b.id && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> 保存中…</span>}
                      </div>
                      {previewBlockId === b.id && (
                        <div className="rounded-lg border border-dashed border-border bg-muted/30 overflow-hidden">
                          <BlockRenderer type={b.type} data={b.data} />
                        </div>
                      )}
                      <Separator />
                      <BlockFieldsEditor
                        fields={meta?.fields || []}
                        data={b.data}
                        onChange={(data) => updateBlock(b.id, (x) => ({ ...x, data }), { data })}
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        {/* Block type palette */}
        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">添加内容块</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh] pr-2">
                <div className="space-y-1.5">
                  {BLOCK_TYPES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => addBlock(t.id)}
                      className="w-full text-left rounded-md border border-border/60 px-3 py-2 hover:bg-muted hover:border-primary transition group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">{t.label}</div>
                        <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </div>
    </AdminShell>
  );
}

function AddBlockDialog({ onAdd }: { onAdd: (t: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> 添加内容块</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader><DialogTitle>选择内容块类型</DialogTitle></DialogHeader>
        <ScrollArea className="flex-1 h-[60vh] pr-2">
          <div className="grid sm:grid-cols-2 gap-2">
            {BLOCK_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => { onAdd(t.id); setOpen(false); }}
                className="text-left rounded-md border border-border/60 px-3 py-2.5 hover:bg-muted hover:border-primary transition"
              >
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Field editor driven by BlockField metadata (the heart of "visual editing")
// ---------------------------------------------------------------------------

function BlockFieldsEditor({ fields, data, onChange }: { fields: BlockField[]; data: any; onChange: (d: any) => void }) {
  return (
    <div className="space-y-4">
      {fields.map((f, i) => (
        <FieldEditor key={i} field={f} data={data} onChange={onChange} />
      ))}
    </div>
  );
}

function getNested(obj: any, path: string): any {
  return path.split('.').reduce((acc, k) => (acc && typeof acc === 'object') ? acc[k] : undefined, obj);
}

function setNested(obj: any, path: string, value: any): any {
  const out = { ...obj };
  const parts = path.split('.');
  let cur = out;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) cur[parts[i]] = {};
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
  return out;
}

function FieldEditor({ field, data, onChange }: { field: BlockField; data: any; onChange: (d: any) => void }) {
  if (field.kind === 'list') {
    const arr: any[] = Array.isArray(getNested(data, field.key)) ? getNested(data, field.key) : [];
    const update = (next: any[]) => onChange(setNested(data, field.key, next));
    return (
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Button type="button" size="sm" variant="ghost" onClick={() => {
            const item: any = {};
            for (const sf of field.itemFields) item[lastSeg(sf.key)] = defaultValFor(sf);
            update([...arr, item]);
          }}><Plus className="h-3 w-3 mr-1" /> 添加</Button>
        </div>
        {field.help && <p className="text-xs text-muted-foreground mb-2">{field.help}</p>}
        <div className="space-y-2">
          {arr.length === 0 && <p className="text-xs text-muted-foreground italic">暂无条目</p>}
          {arr.map((it, i) => (
            <div key={i} className="rounded-md border border-border/60 p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{field.itemLabel} #{i + 1}</span>
                <div className="flex items-center gap-1">
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === 0} onClick={() => {
                    const n = [...arr]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; update(n);
                  }}><ChevronUp className="h-3 w-3" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6" disabled={i === arr.length - 1} onClick={() => {
                    const n = [...arr]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; update(n);
                  }}><ChevronDown className="h-3 w-3" /></Button>
                  <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => update(arr.filter((_, j) => j !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              <div className="space-y-3">
                {field.itemFields.map((sf, j) => (
                  <FieldEditor key={j} field={sf} data={it} onChange={(newIt) => {
                    const n = [...arr];
                    n[i] = newIt;
                    update(n);
                  }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // primitive field
  const value = getNested(data, field.key);
  const id = field.key;
  const set = (v: any) => onChange(setNested(data, field.key, v));

  switch (field.kind) {
    case 'text':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-sm font-medium">{field.label}</Label>
          {field.multiline ? (
            <Textarea id={id} value={value ?? ''} placeholder={field.placeholder} rows={3} onChange={(e) => set(e.target.value)} />
          ) : (
            <Input id={id} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => set(e.target.value)} />
          )}
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      );
    case 'number':
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id} className="text-sm font-medium">{field.label}</Label>
          <Input id={id} type="number" value={value ?? 0} onChange={(e) => set(e.target.value === '' ? 0 : Number(e.target.value))} />
          {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
        </div>
      );
    case 'switch':
      return (
        <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
          <div>
            <Label className="text-sm font-medium">{field.label}</Label>
            {field.help && <p className="text-xs text-muted-foreground">{field.help}</p>}
          </div>
          <Switch checked={!!value} onCheckedChange={set} />
        </div>
      );
    case 'select':
      return (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">{field.label}</Label>
          <Select value={value ?? ''} onValueChange={set}>
            <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
            <SelectContent>
              {field.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    case 'image':
      return <ImagePicker value={value || ''} onChange={set} label={field.label} />;
    default:
      return null;
  }
}

function lastSeg(path: string) { return path.split('.').pop() || path; }

function defaultValFor(field: BlockField): any {
  switch (field.kind) {
    case 'text': return '';
    case 'number': return 0;
    case 'switch': return false;
    case 'select': return field.options[0]?.value || '';
    case 'image': return '';
    case 'list': return [];
    default: return '';
  }
}
