'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ChevronUp, ChevronDown, Plus, Trash2, Loader2, Save, ExternalLink,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  label: string;
  url: string;
  order: number;
  parentId: string | null;
  openNew: boolean;
  children?: MenuItem[];
}

interface Menu {
  id: string;
  slug: string;
  title: string;
  items: MenuItem[];
}

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<Menu[] | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/menus')
      .then((r) => r.json())
      .then((d) => setMenus(d.menus || []))
      .catch(() => toast.error('加载失败'));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateItem = (slug: string, id: string, patch: Partial<MenuItem>) => {
    setMenus((ms) => ms ? ms.map((m) => m.slug === slug ? {
      ...m,
      items: m.items.map((it) => it.id === id ? { ...it, ...patch } : it),
    } : m) : ms);
  };

  const move = (slug: string, index: number, dir: -1 | 1) => {
    if (!menus) return;
    const menu = menus.find((m) => m.slug === slug);
    if (!menu) return;
    const items = [...menu.items];
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= items.length) return;
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    // Reassign order
    items.forEach((it, i) => { it.order = i; });
    setMenus((ms) => ms ? ms.map((m) => m.slug === slug ? { ...m, items } : m) : ms);
  };

  const addItem = async (slug: string) => {
    try {
      const r = await fetch(`/api/admin/menus/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: '新链接', url: '/' }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '添加失败');
      toast.success('已添加新链接');
      load();
    } catch (e: any) {
      toast.error(e?.message || '添加失败');
    }
  };

  const deleteItem = async (slug: string, id: string) => {
    if (!confirm('确认删除该链接？')) return;
    const r = await fetch(`/api/admin/menus/item?id=${id}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('删除失败'); return; }
    toast.success('已删除');
    load();
  };

  const saveMenu = async (slug: string) => {
    if (!menus) return;
    const menu = menus.find((m) => m.slug === slug);
    if (!menu) return;
    setSavingSlug(slug);
    try {
      const r = await fetch(`/api/admin/menus/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: menu.items.map((it, i) => ({
            id: it.id, label: it.label, url: it.url, order: i,
            parentId: it.parentId || null, openNew: it.openNew,
          })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '保存失败');
      toast.success('菜单已保存');
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSavingSlug(null);
    }
  };

  return (
    <AdminShell title="导航菜单">
      {!menus ? (
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      ) : menus.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">暂无菜单</CardContent></Card>
      ) : (
        <Tabs defaultValue={menus[0].slug}>
          <TabsList className="mb-4">
            {menus.map((m) => (
              <TabsTrigger key={m.slug} value={m.slug}>{m.title}</TabsTrigger>
            ))}
          </TabsList>
          {menus.map((m) => (
            <TabsContent key={m.slug} value={m.slug}>
              <Card>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        slug: <code className="bg-muted px-1.5 py-0.5 rounded">{m.slug}</code>
                        <span className="mx-2">·</span>
                        {m.items.length} 个链接
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => addItem(m.slug)}>
                        <Plus className="h-4 w-4 mr-1" /> 添加链接
                      </Button>
                      <Button size="sm" onClick={() => saveMenu(m.slug)} disabled={savingSlug === m.slug}>
                        {savingSlug === m.slug ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        保存菜单
                      </Button>
                    </div>
                  </div>
                  {m.items.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">暂无链接，点击右上角添加</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {m.items.map((it, i) => (
                        <div key={it.id} className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1.2fr_auto_auto] items-center gap-2 p-3 hover:bg-muted/30">
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => move(m.slug, i, -1)} disabled={i === 0}
                              aria-label="上移"
                            ><ChevronUp className="h-4 w-4" /></Button>
                            <Button
                              size="icon" variant="ghost" className="h-7 w-7"
                              onClick={() => move(m.slug, i, 1)} disabled={i === m.items.length - 1}
                              aria-label="下移"
                            ><ChevronDown className="h-4 w-4" /></Button>
                          </div>
                          <div>
                            <Label className="sr-only">链接文字</Label>
                            <Input
                              value={it.label}
                              onChange={(e) => updateItem(m.slug, it.id, { label: e.target.value })}
                              placeholder="链接文字"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="sr-only">URL</Label>
                            <Input
                              value={it.url}
                              onChange={(e) => updateItem(m.slug, it.id, { url: e.target.value })}
                              placeholder="/path 或 https://"
                              className="h-9"
                            />
                          </div>
                          <div className="flex items-center gap-1.5 justify-self-end">
                            <Switch
                              checked={it.openNew}
                              onCheckedChange={(v) => updateItem(m.slug, it.id, { openNew: v })}
                              aria-label="新窗口打开"
                            />
                            <span className="text-xs text-muted-foreground hidden sm:inline">新窗口</span>
                          </div>
                          <div className="flex items-center gap-1 justify-self-end">
                            <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                              <a href={it.url} target="_blank" rel="noreferrer" aria-label="访问"><ExternalLink className="h-3.5 w-3.5" /></a>
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                              onClick={() => deleteItem(m.slug, it.id)}
                              aria-label="删除"
                            ><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </AdminShell>
  );
}
