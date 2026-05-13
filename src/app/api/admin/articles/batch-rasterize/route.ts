import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import prisma from '@/lib/prisma';

interface Body {
  slugs?: string[];
}

const tsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');
const script = path.join(process.cwd(), 'scripts', 'rasterize-articles.ts');

function rasterizeOne(slug: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(
      tsx,
      [script, `--slug=${slug}`],
      { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 },
      (err) => (err ? reject(err) : resolve()),
    );
  });
}

/**
 * Admin-only: rasterize multiple articles sequentially. Returns a per-slug
 * status array so the UI can surface partial failures.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BadJson' }, { status: 400 });
  }
  const slugs = (body.slugs ?? []).filter((s) => typeof s === 'string' && s.length > 0);
  if (slugs.length === 0) {
    return NextResponse.json({ error: 'EmptyBatch' }, { status: 400 });
  }

  const results: Array<{ slug: string; ok: boolean; error?: string; rasterizedAt?: string }> = [];

  for (const slug of slugs) {
    try {
      await rasterizeOne(slug);
      const now = new Date();
      await prisma.article.update({ where: { slug }, data: { rasterizedAt: now } });
      results.push({ slug, ok: true, rasterizedAt: now.toISOString() });
    } catch (e) {
      results.push({ slug, ok: false, error: (e as Error).message });
    }
  }

  const allOk = results.every((r) => r.ok);
  return NextResponse.json({ ok: allOk, results });
}
