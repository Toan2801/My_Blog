import { NextRequest, NextResponse } from 'next/server';
import { getReaderDocument, renderReaderPageSvg } from '@/lib/reader-pages';
import { verifyReaderToken, tokenAllowsPage } from '@/lib/reader-token';

export const dynamic = 'force-dynamic';

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

function getPrivateCacheControl(expiresAt: number): string {
  const remainingSeconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
  const maxAge = Math.min(remainingSeconds, 300);
  return `private, max-age=${maxAge}`;
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

  const readerDocument = await getReaderDocument(slug);
  if (!readerDocument || !readerDocument.pages.some((page) => page.pageNumber === pageNum)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const svg = await renderReaderPageSvg(slug, pageNum, request.headers);
  if (!svg) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': getPrivateCacheControl(info.expiresAt),
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
