import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BLOCK_TYPES, defaultDataFor, type BlockType, getBlockTypeMeta } from '@/lib/blocks/types';

// GET /api/admin/pages/:id/blocks
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const blocks = await db.block.findMany({
    where: { pageId: id },
    orderBy: { order: 'asc' },
  });
  return NextResponse.json({
    blocks: blocks.map((b) => ({ ...b, data: safeParse(b.data) })),
    types: BLOCK_TYPES,
  });
}

// POST /api/admin/pages/:id/blocks — add a new block
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: '请求体无效' }, { status: 400 }); }
  const type = body.type as BlockType;
  const meta = getBlockTypeMeta(type);
  if (!meta) return NextResponse.json({ error: '未知的 block 类型' }, { status: 400 });
  const page = await db.page.findUnique({ where: { id } });
  if (!page) return NextResponse.json({ error: '页面不存在' }, { status: 404 });
  const count = await db.block.count({ where: { pageId: id } });
  const block = await db.block.create({
    data: {
      pageId: id,
      type,
      title: body.title ?? meta.label,
      order: body.order ?? count,
      data: JSON.stringify(defaultDataFor(type)),
      hidden: false,
    },
  });
  return NextResponse.json({ block: { ...block, data: safeParse(block.data) } });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
