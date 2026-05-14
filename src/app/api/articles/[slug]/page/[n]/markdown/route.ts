import { NextRequest, NextResponse } from 'next/server';
import { readRasterizedArticleData } from '@/lib/raster-data';
import { verifyReaderToken, tokenAllowsPage } from '@/lib/reader-token';

export const dynamic = 'force-dynamic';

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

  const token = request.nextUrl.searchParams.get('t');
  const info = verifyReaderToken(slug, token);
  if (!info) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  if (!tokenAllowsPage(info, pageNum)) {
    return NextResponse.json(
      { error: 'TrialLimitReached', message: 'Đăng nhập để đọc tiếp.' },
      { status: 402 },
    );
  }

  const rasterData = await readRasterizedArticleData(slug);
  if (!rasterData) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const page = rasterData.markdownPages.find((p) => p.pageNumber === pageNum);
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  return NextResponse.json(
    { pageNumber: page.pageNumber, markdown: page.markdown },
    { headers: { 'Cache-Control': getPrivateCacheControl(info.expiresAt) } },
  );
}
