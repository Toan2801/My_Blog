import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data';
import { auth } from '@/auth';
import { issueUserReaderToken } from '@/lib/reader-token';

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 30;
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
  { params }: { params: Promise<{ slug: string }> },
) {
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const host = request.headers.get('host') || '';
  const isValidOrigin =
    origin.includes(host) ||
    referer.includes(host) ||
    origin === '' ||
    process.env.NODE_ENV === 'development';
  if (!isValidOrigin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Auth: full book is gated to signed-in users.
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Vui lòng đăng nhập để đọc sách.' },
      { status: 401 },
    );
  }

  const { token, expiresAt } = issueUserReaderToken(session.user.id, slug);
  const pages = (article.pages ?? []).map((p) => ({
    pageNumber: p.pageNumber,
    imageUrl: p.imageUrl,
  }));

  return NextResponse.json(
    {
      pages,
      totalPages: pages.length,
      title: article.title,
      author: article.author,
      token,
      tokenExpiresAt: expiresAt,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
