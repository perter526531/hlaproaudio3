'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FormFieldDef {
  id: string;
  label: string;
  name: string;
  type: string;
  required: boolean;
  config: any;
}

interface FormDef {
  slug: string;
  title: string;
  description: string | null;
  submitLabel: string | null;
  successMsg: string | null;
  fields: FormFieldDef[];
}

export function DynamicForm({ slug }: { slug: string }) {
  const [form, setForm] = useState<FormDef | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});

  // load form definition once on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/public/forms/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('表单加载失败');
        return r.json();
      })
      .then((d) => { if (!cancelled) setForm(d.form); })
      .catch((e) => { if (!cancelled) setLoadError(e.message || '表单加载失败'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loadError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive flex flex-col items-center gap-2">
        <AlertCircle className="h-5 w-5" />
        <p>{loadError}</p>
      </div>
    );
  }
  if (!form) {
    return (
      <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        表单加载中…
      </div>
    );
  }
  if (done) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="font-medium">{form.successMsg || '提交成功！'}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => { setDone(false); setValues({}); }}>
          再提交一次
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // validate required
    for (const f of form.fields) {
      if (f.required) {
        const v = values[f.name];
        if (v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0)) {
          toast.error(`请填写：${f.label}`);
          return;
        }
        if (f.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
          toast.error(`${f.label} 邮箱格式不正确`);
          return;
        }
        if (f.type === 'phone' && v && !/^[\d+\-\s()]{6,20}$/.test(v)) {
          toast.error(`${f.label} 电话格式不正确`);
          return;
        }
      }
    }
    setSubmitting(true);
    try {
      const r = await fetch(`/api/public/forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!r.ok) throw new Error('提交失败');
      setDone(true);
      toast.success('提交成功');
    } catch (e: any) {
      toast.error(e.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (name: string, v: any) => setValues((p) => ({ ...p, [name]: v }));

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 space-y-5">
      {form.description && <p className="text-sm text-muted-foreground">{form.description}</p>}
      {form.fields.map((f) => {
        const cfg = typeof f.config === 'string' ? safeParse(f.config) : (f.config || {});
        return (
          <div key={f.id} className="space-y-1.5">
            <Label htmlFor={f.name} className="text-sm font-medium">
              {f.label}
              {f.required && <span className="text-destructive ml-0.5">*</span>}
            </Label>
            {renderField(f, cfg, values[f.name], (v) => set(f.name, v))}
          </div>
        );
      })}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {form.submitLabel || '提交'}
      </Button>
    </form>
  );
}

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

function renderField(f: FormFieldDef, cfg: any, value: any, onChange: (v: any) => void) {
  switch (f.type) {
    case 'textarea':
      return (
        <Textarea
          id={f.name}
          value={value ?? ''}
          placeholder={cfg.placeholder}
          rows={cfg.rows || 4}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'email':
    case 'phone':
    case 'url':
    case 'date':
      return (
        <Input
          id={f.name}
          type={f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text'}
          value={value ?? ''}
          placeholder={cfg.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          id={f.name}
          type="number"
          value={value ?? ''}
          placeholder={cfg.placeholder}
          min={cfg.min}
          max={cfg.max}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    case 'select':
      return (
        <Select value={value ?? ''} onValueChange={onChange}>
          <SelectTrigger id={f.name}><SelectValue placeholder={cfg.placeholder || '请选择'} /></SelectTrigger>
          <SelectContent>
            {(cfg.options || []).map((o: string) => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'radio':
      return (
        <RadioGroup value={value ?? ''} onValueChange={onChange} className="flex flex-col gap-2">
          {(cfg.options || []).map((o: string) => (
            <div key={o} className="flex items-center gap-2">
              <RadioGroupItem value={o} id={`${f.name}-${o}`} />
              <Label htmlFor={`${f.name}-${o}`}>{o}</Label>
            </div>
          ))}
        </RadioGroup>
      );
    case 'checkbox':
      return (
        <div className="flex flex-col gap-2">
          {(cfg.options || []).map((o: string) => {
            const arr: string[] = Array.isArray(value) ? value : [];
            const checked = arr.includes(o);
            return (
              <div key={o} className="flex items-center gap-2">
                <Checkbox
                  id={`${f.name}-${o}`}
                  checked={checked}
                  onCheckedChange={(c) => {
                    if (c) onChange([...arr, o]);
                    else onChange(arr.filter((x) => x !== o));
                  }}
                />
                <Label htmlFor={`${f.name}-${o}`}>{o}</Label>
              </div>
            );
          })}
        </div>
      );
    case 'consent':
      return (
        <div className="flex items-start gap-2">
          <Checkbox
            id={f.name}
            checked={!!value}
            onCheckedChange={(c) => onChange(!!c)}
          />
          <Label htmlFor={f.name} className="text-sm text-muted-foreground font-normal">
            {cfg.text || f.label}
          </Label>
        </div>
      );
    case 'rating':
      return (
        <div className="flex gap-1">
          {[1,2,3,4,5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`text-2xl transition-colors ${(value ?? 0) >= n ? 'text-primary' : 'text-muted-foreground/40'}`}
              aria-label={`${n}星`}
            >
              ★
            </button>
          ))}
        </div>
      );
    default:
      return (
        <Input
          id={f.name}
          value={value ?? ''}
          placeholder={cfg.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
