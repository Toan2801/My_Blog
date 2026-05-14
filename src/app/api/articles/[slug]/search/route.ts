import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data';
import { verifyReaderToken, TRIAL_MAX_PAGES } from '@/lib/reader-token';

export const dynamic = 'force-dynamic';

const SNIPPET_RADIUS = 60;
const MAX_HITS = 50;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildSnippet(text: string, index: number, qLen: number): string {
  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + qLen + SNIPPET_RADIUS);
  const slice = text.slice(start, end).replace(/\s+/g, ' ');
  return (start > 0 ? '…' : '') + slice + (end < text.length ? '…' : '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const host = request.headers.get('host') || '';
  const referer = request.headers.get('referer') || '';
  const sameOrigin =
    referer.includes(host) || process.env.NODE_ENV === 'development';
  if (!sameOrigin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = request.nextUrl.searchParams.get('t');
  const info = verifyReaderToken(slug, token);
  if (!info) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ hits: [], total: 0 });
  }

  // Search suspended along with markdownPages removal
  return NextResponse.json({ hits: [], total: 0 });
}
