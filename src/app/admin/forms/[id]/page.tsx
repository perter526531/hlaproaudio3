'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, ChevronUp, ChevronDown,
  MailOpen,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table';
import { toast } from 'sonner';

const FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'email', label: '邮箱' },
  { value: 'phone', label: '电话' },
  { value: 'select', label: '下拉选择' },
  { value: 'radio', label: '单选' },
  { value: 'checkbox', label: '复选' },
  { value: 'number', label: '数字' },
  { value: 'url', label: 'URL' },
  { value: 'date', label: '日期' },
  { value: 'consent', label: '同意条款' },
  { value: 'rating', label: '评分' },
];

interface FormField {
  id: string;
  label: string;
  name: string;
  type: string;
  required: boolean;
  order: number;
  config: Record<string, any>;
}

interface FormItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  submitLabel: string | null;
  successMsg: string | null;
  status: string;
  fields: FormField[];
}

interface Submission {
  id: string;
  data: Record<string, any>;
  ip: string | null;
  ua: string | null;
  read: boolean;
  createdAt: string;
}

export default function AdminFormEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState<FormItem | null>(null);
  const [tab, setTab] = useState('fields');

  const [subs, setSubs] = useState<Submission[]>([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { params.then(({ id }) => setId(id)); }, [params]);

  const loadForm = useCallback(() => {
    if (!id) return;
    fetch(`/api/admin/forms/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.form) setForm(d.form); else toast.error('表单不存在'); })
      .catch(() => toast.error('加载失败'));
  }, [id]);

  const loadSubs = useCallback(() => {
    if (!id) return;
    fetch(`/api/admin/forms/${id}/submissions?pageSize=100`)
      .then((r) => r.json())
      .then((d) => {
        setSubs(d.submissions || []);
        setSubsTotal(d.total || 0);
        setUnreadCount(d.unreadCount || 0);
      })
      .catch(() => toast.error('提交记录加载失败'));
  }, [id]);

  useEffect(() => { loadForm(); }, [loadForm]);
  useEffect(() => { if (tab === 'submissions') loadSubs(); }, [tab, loadSubs]);

  const action = (
    <Button asChild variant="outline" size="sm"><Link href="/admin/forms"><ArrowLeft className="h-4 w-4 mr-1" /> 返回</Link></Button>
  );

  const patchForm = async (patch: Partial<FormItem>) => {
    if (!form) return;
    const r = await fetch(`/api/admin/forms/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '保存失败'); return null; }
    toast.success('已保存表单属性');
    setForm(d.form);
    return d.form;
  };

  const addField = async () => {
    if (!form) return;
    try {
      const r = await fetch(`/api/admin/forms/${form.id}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: '新字段', name: `field_${Date.now()}`, type: 'text', required: false, config: {},
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '添加失败');
      toast.success('已添加字段');
      loadForm();
    } catch (e: any) {
      toast.error(e?.message || '添加失败');
    }
  };

  const patchField = async (fieldId: string, patch: Partial<FormField>) => {
    if (!form) return;
    const r = await fetch(`/api/admin/forms/${form.id}/fields/${fieldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error || '保存失败'); return; }
    toast.success('字段已保存');
    setForm((f) => f ? { ...f, fields: f.fields.map((x) => x.id === fieldId ? { ...x, ...d.field } : x) } : f);
  };

  const deleteField = async (fieldId: string) => {
    if (!form) return;
    if (!confirm('确认删除该字段？')) return;
    const r = await fetch(`/api/admin/forms/${form.id}/fields/${fieldId}`, { method: 'DELETE' });
    if (!r.ok) { toast.error('删除失败'); return; }
    toast.success('已删除');
    loadForm();
  };

  const moveField = async (idx: number, dir: -1 | 1) => {
    if (!form) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.fields.length) return;
    const fields = [...form.fields];
    [fields[idx], fields[newIdx]] = [fields[newIdx], fields[idx]];
    fields.forEach((f, i) => { f.order = i; });
    setForm({ ...form, fields });
    // persist both via per-field PATCH
    await Promise.all([
      patchFieldSilent(form, fields[idx]),
      patchFieldSilent(form, fields[newIdx]),
    ]);
    loadForm();
  };

  const patchFieldSilent = async (form: FormItem, field: FormField) => {
    await fetch(`/api/admin/forms/${form.id}/fields/${field.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: field.order }),
    });
  };

  const markAllRead = async () => {
    if (!form) return;
    const r = await fetch(`/api/admin/forms/${form.id}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readAll: true }),
    });
    if (!r.ok) { toast.error('操作失败'); return; }
    toast.success('已全部标记为已读');
    loadSubs();
  };

  if (!form) {
    return (
      <AdminShell title="表单编辑" action={action}>
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      </AdminShell>
    );
  }

  return (
    <AdminShell title={`表单：${form.title}`} action={action}>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="fields">字段设计</TabsTrigger>
          <TabsTrigger value="submissions">
            提交记录
            {unreadCount > 0 && <Badge className="ml-1.5 text-[10px] h-4 px-1">{unreadCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="space-y-4">
          <FormMetaCard form={form} setForm={setForm} onSave={patchForm} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base">字段列表</CardTitle>
              <Button size="sm" variant="outline" onClick={addField}><Plus className="h-4 w-4 mr-1" /> 添加字段</Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.fields.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">暂无字段，点击右上角添加</div>
              ) : (
                form.fields.map((f, i) => (
                  <FieldEditor
                    key={f.id}
                    field={f}
                    index={i}
                    total={form.fields.length}
                    onMove={(dir) => moveField(i, dir)}
                    onSave={(patch) => patchField(f.id, patch)}
                    onDelete={() => deleteField(f.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                提交记录
                <Badge variant="secondary" className="text-[11px]">共 {subsTotal}</Badge>
                {unreadCount > 0 && <Badge className="text-[11px]">{unreadCount} 未读</Badge>}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
                <MailOpen className="h-4 w-4 mr-1" /> 全部标记为已读
              </Button>
            </CardHeader>
            <CardContent>
              {subs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">暂无提交记录</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>提交时间</TableHead>
                        {form.fields.map((f) => (
                          <TableHead key={f.id}>{f.label}</TableHead>
                        ))}
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subs.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleString('zh-CN')}
                            {!s.read && <Badge className="ml-1 text-[10px] h-4 px-1">未读</Badge>}
                          </TableCell>
                          {form.fields.map((f) => (
                            <TableCell key={f.id} className="text-sm align-top max-w-xs">
                              {renderValue(s.data?.[f.name])}
                            </TableCell>
                          ))}
                          <TableCell className="text-xs text-muted-foreground">{s.ip || '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function renderValue(v: any) {
  if (v === undefined || v === null || v === '') return <span className="text-muted-foreground">—</span>;
  if (typeof v === 'object') return <span className="text-xs break-all">{JSON.stringify(v)}</span>;
  return <span className="break-words whitespace-pre-line">{String(v)}</span>;
}

function FormMetaCard({
  form, setForm, onSave,
}: {
  form: FormItem; setForm: (f: FormItem) => void; onSave: (p: Partial<FormItem>) => Promise<any>;
}) {
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState({
    title: form.title,
    slug: form.slug,
    description: form.description || '',
    submitLabel: form.submitLabel || '',
    successMsg: form.successMsg || '',
    status: form.status,
  });

  const save = async () => {
    setSaving(true);
    const updated = await onSave(meta);
    setSaving(false);
    // Sync local state with server-returned form (e.g., normalized slug)
    if (updated) {
      setMeta({
        title: updated.title ?? meta.title,
        slug: updated.slug ?? meta.slug,
        description: updated.description ?? meta.description,
        submitLabel: updated.submitLabel ?? meta.submitLabel,
        successMsg: updated.successMsg ?? meta.successMsg,
        status: updated.status ?? meta.status,
      });
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">表单属性</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>标题</Label>
          <Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>slug</Label>
          <Input
            value={meta.slug}
            onChange={(e) => setMeta({ ...meta, slug: e.target.value })}
            disabled={form._count !== undefined}
          />
          <p className="text-xs text-muted-foreground">slug 修改可能影响既有提交记录的引用，请谨慎。</p>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <Label>表单描述</Label>
          <Textarea rows={2} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} placeholder="表单上方显示的说明文字" />
        </div>
        <div className="space-y-1.5">
          <Label>提交按钮文字</Label>
          <Input value={meta.submitLabel} onChange={(e) => setMeta({ ...meta, submitLabel: e.target.value })} placeholder="提交" />
        </div>
        <div className="space-y-1.5">
          <Label>提交成功提示</Label>
          <Input value={meta.successMsg} onChange={(e) => setMeta({ ...meta, successMsg: e.target.value })} placeholder="感谢您的提交！" />
        </div>
        <div className="space-y-1.5">
          <Label>状态</Label>
          <Select value={meta.status} onValueChange={(v) => setMeta({ ...meta, status: v })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="published">已发布</SelectItem>
              <SelectItem value="draft">草稿</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            保存表单属性
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldEditor({
  field, index, total, onMove, onSave, onDelete,
}: {
  field: FormField;
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onSave: (patch: Partial<FormField>) => Promise<any>;
  onDelete: () => void;
}) {
  const [label, setLabel] = useState(field.label);
  const [name, setName] = useState(field.name);
  const [type, setType] = useState(field.type);
  const [required, setRequired] = useState(field.required);
  const [config, setConfig] = useState<Record<string, any>>(field.config || {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave({ label, name, type, required, config, order: index });
    setSaving(false);
  };

  // Config editor per type
  const renderConfig = () => {
    if (type === 'select' || type === 'radio' || type === 'checkbox') {
      const opts = Array.isArray(config.options) ? config.options.join('\n') : (config.optionsText || '');
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">选项（每行一个）</Label>
          <Textarea
            rows={3}
            value={opts}
            onChange={(e) => setConfig({ ...config, options: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
            placeholder={'选项A\n选项B\n选项C'}
          />
        </div>
      );
    }
    if (type === 'textarea') {
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">行数</Label>
            <Input
              type="number" min={1} max={20}
              value={config.rows ?? 3}
              onChange={(e) => setConfig({ ...config, rows: Number(e.target.value) || 3 })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">placeholder</Label>
            <Input
              value={config.placeholder || ''}
              onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
            />
          </div>
        </div>
      );
    }
    if (type === 'number') {
      return (
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">placeholder</Label>
            <Input value={config.placeholder || ''} onChange={(e) => setConfig({ ...config, placeholder: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">min</Label>
            <Input type="number" value={config.min ?? ''} onChange={(e) => setConfig({ ...config, min: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">max</Label>
            <Input type="number" value={config.max ?? ''} onChange={(e) => setConfig({ ...config, max: e.target.value === '' ? undefined : Number(e.target.value) })} />
          </div>
        </div>
      );
    }
    if (type === 'consent') {
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">同意条款文字</Label>
          <Input
            value={config.text || ''}
            onChange={(e) => setConfig({ ...config, text: e.target.value })}
            placeholder="我已阅读并同意《隐私政策》"
          />
        </div>
      );
    }
    if (type === 'rating') {
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">最大值（默认 5）</Label>
          <Input
            type="number" min={2} max={10}
            value={config.max ?? 5}
            onChange={(e) => setConfig({ ...config, max: Number(e.target.value) || 5 })}
          />
        </div>
      );
    }
    // text / email / phone / url / date
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">placeholder</Label>
        <Input
          value={config.placeholder || ''}
          onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
        />
      </div>
    );
  };

  return (
    <div className="rounded-md border border-border p-3 space-y-3 bg-background">
      <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr_1fr_180px_auto] gap-2 items-end">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onMove(-1)} disabled={index === 0} aria-label="上移"><ChevronUp className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onMove(1)} disabled={index === total - 1} aria-label="下移"><ChevronDown className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">显示名 Label</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">字段名 Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">类型</Label>
          <Select value={type} onValueChange={(v) => { setType(v); setConfig({}); }}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 justify-self-end pb-1">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Switch checked={required} onCheckedChange={setRequired} /> 必填
          </Label>
          <Button size="sm" variant="outline" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete} aria-label="删除字段"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="border-t border-border pt-3">{renderConfig()}</div>
    </div>
  );
}
