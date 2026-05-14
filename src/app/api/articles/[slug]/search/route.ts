import { NextRequest, NextResponse } from 'next/server';
import { readRasterizedArticleData } from '@/lib/raster-data';
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

  const rasterData = await readRasterizedArticleData(slug);
  if (!rasterData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const allPages = rasterData.markdownPages;
  // Trial: search only within the trial page range.
  const pages = info.kind === 'trial'
    ? allPages.filter((p) => p.pageNumber <= TRIAL_MAX_PAGES)
    : allPages;
  const re = new RegExp(escapeRegExp(q), 'gi');

  const hits: Array<{ pageNumber: number; snippet: string; count: number }> = [];
  let total = 0;
  for (const page of pages) {
    re.lastIndex = 0;
    const matches: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(page.markdown)) !== null) {
      matches.push(m.index);
      if (m.index === re.lastIndex) re.lastIndex++;
    }
    if (matches.length === 0) continue;
    total += matches.length;
    hits.push({
      pageNumber: page.pageNumber,
      snippet: buildSnippet(page.markdown, matches[0], q.length),
      count: matches.length,
    });
    if (hits.length >= MAX_HITS) break;
  }

  return NextResponse.json(
    { hits, total },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
