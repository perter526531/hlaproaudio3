'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, Info } from 'lucide-react';
import { AdminShell } from '@/components/admin/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface Settings {
  brand?: string;
  brandEn?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  address?: string;
  icp?: string;
  wechat?: string;
  whatsapp?: string;
  facebook?: string;
  youtube?: string;
  instagram?: string;
  linkedin?: string;
}

const FIELDS: { group: string; items: { key: keyof Settings; label: string; type?: 'textarea' | 'input' }[] }[] = [
  {
    group: '品牌信息',
    items: [
      { key: 'brand', label: '品牌名称（中文）' },
      { key: 'brandEn', label: '品牌名称（英文）' },
      { key: 'tagline', label: '品牌标语 / 一句话定位' },
    ],
  },
  {
    group: '联系方式',
    items: [
      { key: 'phone', label: '电话' },
      { key: 'email', label: '邮箱' },
      { key: 'wechat', label: '微信号' },
      { key: 'whatsapp', label: 'WhatsApp' },
      { key: 'address', label: '地址', type: 'textarea' },
      { key: 'icp', label: 'ICP 备案号' },
    ],
  },
  {
    group: '社交媒体',
    items: [
      { key: 'facebook', label: 'Facebook' },
      { key: 'youtube', label: 'YouTube' },
      { key: 'instagram', label: 'Instagram' },
      { key: 'linkedin', label: 'LinkedIn' },
    ],
  },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => setSettings(d.settings || {}))
      .catch(() => toast.error('加载失败'));
  }, []);

  const update = (k: keyof Settings, v: string) => {
    setSettings((s) => (s ? { ...s, [k]: v } : s));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || '保存失败');
      toast.success('已保存，前台立即生效');
    } catch (e: any) {
      toast.error(e?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const action = (
    <Button size="sm" onClick={save} disabled={saving || !settings}>
      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
      保存设置
    </Button>
  );

  return (
    <AdminShell title="站点设置" action={action}>
      <Card className="mb-4 border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/10">
        <CardContent className="p-4 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-900 dark:text-amber-200">
            修改将立即影响前台站点（品牌名、页脚联系信息、社交链接）。
          </p>
        </CardContent>
      </Card>

      {!settings ? (
        <Card><CardContent className="p-12 flex items-center justify-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mr-2" /> 加载中…</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {FIELDS.map((group) => (
            <Card key={group.group}>
              <CardHeader><CardTitle className="text-base">{group.group}</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {group.items.map((it) => (
                  <div key={it.key} className="space-y-1.5">
                    <Label htmlFor={`set-${it.key}`}>{it.label}</Label>
                    {it.type === 'textarea' ? (
                      <Textarea
                        id={`set-${it.key}`}
                        rows={2}
                        value={settings[it.key] || ''}
                        onChange={(e) => update(it.key, e.target.value)}
                        placeholder={it.label}
                      />
                    ) : (
                      <Input
                        id={`set-${it.key}`}
                        value={settings[it.key] || ''}
                        onChange={(e) => update(it.key, e.target.value)}
                        placeholder={it.label}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
