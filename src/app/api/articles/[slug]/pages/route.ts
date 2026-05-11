import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data';

// Rate limit: simple in-memory tracker (per-process)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30; // requests per minute
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
  { params }: { params: Promise<{ slug: string }> }
) {
  // Referer / Origin check
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const host = request.headers.get('host') || '';

  const isValidOrigin =
    origin.includes(host) ||
    referer.includes(host) ||
    origin === '' ||
    process.env.NODE_ENV === 'development';

  if (!isValidOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') || 'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  const { slug } = await params;

  const article = getArticleBySlug(slug);
  if (!article || article.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Return all pre-rasterized page image URLs
  const pages = article.pages ?? [];

  return NextResponse.json({
    pages,
    totalPages: pages.length,
    title: article.title,
    author: article.author,
  }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
