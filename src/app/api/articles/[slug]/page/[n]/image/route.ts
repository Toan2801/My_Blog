import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getArticleBySlug } from '@/lib/data';
import { verifyReaderToken, tokenAllowsPage } from '@/lib/reader-token';
import { derivePermutation, TILE_COLS, TILE_ROWS } from '@/lib/tile-shuffle';
import { shufflePngTiles } from '@/lib/tile-shuffle-server';

export const dynamic = 'force-dynamic';

const PAGE_IMAGE_ROOT = path.join(process.cwd(), 'storage', 'page-images');

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 240;
const RATE_WINDOW = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; n: string }> },
) {
  const { slug, n } = await params;
  const pageNum = parseInt(n, 10);
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return NextResponse.json({ error: 'Bad page' }, { status: 400 });
  }

  const host = request.headers.get('host') || '';
  const referer = request.headers.get('referer') || '';
  const sameOrigin =
    referer.includes(host) || process.env.NODE_ENV === 'development';
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const token = request.nextUrl.searchParams.get('t');
  const info = verifyReaderToken(slug, token);
  if (!info) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  if (!tokenAllowsPage(info, pageNum)) {
    return NextResponse.json(
      { error: 'TrialLimitReached', message: 'Đăng nhập để đọc tiếp.' },
      { status: 402 },
    );
  }

  const safeSlug = path.basename(slug);
  const filePath = path.join(PAGE_IMAGE_ROOT, safeSlug, `page-${pageNum}.png`);
  if (!filePath.startsWith(PAGE_IMAGE_ROOT) || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const article = await getArticleBySlug(safeSlug);
  if (!article || article.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Scramble tiles deterministically from (token, slug, pageNumber).
  // The client recomputes the same permutation and unshuffles into a canvas.
  const pngBuffer = fs.readFileSync(filePath);
  const permutation = await derivePermutation(token!, slug, pageNum);
  const scrambled = shufflePngTiles(pngBuffer, permutation);

  const body = new Uint8Array(scrambled);
  return new NextResponse(body, {
    status: 200,
    headers: {
      // Not image/png — these bytes are a scrambled PNG that won't render
      // correctly in <img>. The reader fetches via JS and assembles on canvas.
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(scrambled.length),
      'Cache-Control': 'private, no-store, max-age=0',
      'X-Page-Tile-Grid': `${TILE_COLS}x${TILE_ROWS}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
