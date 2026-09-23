import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invalidateSiteConfig } from '@/lib/site';

// GET /api/admin/settings
export async function GET() {
  const rows = await db.siteSetting.findMany();
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json({ settings });
}

// PUT /api/admin/settings — upsert many
export async function PUT(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  if (!body || typeof body !== 'object') return NextResponse.json({ error: '请求体无效' }, { status: 400 });
  for (const [k, v] of Object.entries(body)) {
    await db.siteSetting.upsert({
      where: { key: k },
      update: { value: String(v) },
      create: { key: k, value: String(v) },
    });
  }
  invalidateSiteConfig();
  return NextResponse.json({ ok: true });
}
