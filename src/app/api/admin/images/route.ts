import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

// GET /api/admin/images?q=&tag=
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const tag = req.nextUrl.searchParams.get('tag')?.trim() || '';
  const images = await db.image.findMany({
    where: {
      ...(q ? { OR: [{ filename: { contains: q } }, { alt: { contains: q } }] } : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return NextResponse.json({ images });
}

// POST /api/admin/images/upload  (multipart) OR body { url, alt, filename, source: 'external' }
export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  if (contentType.startsWith('multipart/form-data')) {
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
    const full = path.join(UPLOAD_DIR, safeName);
    await writeFile(full, buf);
    const dims = await readImageMeta(buf).catch(() => ({}));
    const img = await db.image.create({
      data: {
        url: `/uploads/${safeName}`,
        filename: file.name,
        alt,
        tags,
        size: file.size,
        mimeType: file.type,
        width: dims.width ?? null,
        height: dims.height ?? null,
        source: 'upload',
      },
    });
    return NextResponse.json({ image: img });
  }
  // external link
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  if (!body?.url) return NextResponse.json({ error: '缺少 url' }, { status: 400 });
  const img = await db.image.create({
    data: {
      url: body.url,
      filename: body.filename || body.url.split('/').pop() || 'external',
      alt: body.alt || '',
      tags: body.tags || '',
      source: 'external',
      mimeType: body.mimeType || null,
    },
  });
  return NextResponse.json({ image: img });
}

// minimal image dimension reader (jpeg/png signatures) — best-effort
async function readImageMeta(buf: Buffer): Promise<{ width?: number; height?: number }> {
  if (buf.length < 24) return {};
  // PNG
  if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  // JPEG — scan for SOFx markers
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const segLen = buf.readUInt16BE(i + 2);
      i += 2 + segLen;
    }
  }
  return {};
}
