import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

// POST /api/admin/images/upload (multipart) — kept for compatibility with the picker upload
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  const alt = (form.get('alt') as string) || '';
  const tags = (form.get('tags') as string) || '';
  if (!(file instanceof File)) return NextResponse.json({ error: '缺少文件' }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: '不支持的文件类型' }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: '文件超过 10MB' }, { status: 413 });
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = (file.name.match(/\.[a-z0-9]+$/i)?.[0] || '').toLowerCase();
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, safeName), buf);
  const img = await db.image.create({
    data: {
      url: `/uploads/${safeName}`,
      filename: file.name,
      alt,
      tags,
      size: file.size,
      mimeType: file.type,
      source: 'upload',
    },
  });
  return NextResponse.json({ image: img });
}
