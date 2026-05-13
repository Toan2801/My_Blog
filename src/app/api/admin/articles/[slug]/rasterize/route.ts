import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import prisma from '@/lib/prisma';

/**
 * Admin-only: rasterize one article. The route runs the rasterize script and
 * sets `rasterizedAt` on completion. Blocks until the script finishes so the
 * client can show a definitive success/failure state.
 *
 * Middleware (src/middleware.ts) gates this to admin role.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { slug: true },
  });
  if (!article) return NextResponse.json({ error: 'NotFound' }, { status: 404 });

  const script = path.join(process.cwd(), 'scripts', 'rasterize-articles.ts');
  const tsx = path.join(process.cwd(), 'node_modules', '.bin', 'tsx');

  await new Promise<void>((resolve, reject) => {
    execFile(
      tsx,
      [script, `--slug=${slug}`],
      { cwd: process.cwd(), maxBuffer: 64 * 1024 * 1024 },
      (err) => (err ? reject(err) : resolve()),
    );
  }).catch((err) => {
    throw new Error(`rasterize failed: ${err.message}`);
  });

  const now = new Date();
  await prisma.article.update({
    where: { slug },
    data: { rasterizedAt: now },
    select: { slug: true },
  });

  return NextResponse.json({ ok: true, slug, rasterizedAt: now.toISOString() });
}
