import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getArticleBySlug } from '@/lib/data';
import { issueTrialReaderToken, TRIAL_MAX_PAGES } from '@/lib/reader-token';

/**
 * Anonymous trial endpoint: returns the first TRIAL_MAX_PAGES pages of a book
 * along with a trial token. The trial token is capped to those pages on the
 * server side (see verifyReaderToken + tokenAllowsPage).
 */
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

  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const sessionId = crypto.randomBytes(16).toString('base64url');
  const { token, expiresAt } = issueTrialReaderToken(sessionId, slug);
  const allPages = article.pages ?? [];
  const totalPages = allPages.length;
  const pages = allPages.slice(0, TRIAL_MAX_PAGES).map((p) => ({
    pageNumber: p.pageNumber,
    imageUrl: p.imageUrl,
  }));

  return NextResponse.json(
    {
      pages,
      totalPages,
      trialPages: pages.length,
      isTrial: true,
      title: article.title,
      author: article.author,
      token,
      tokenExpiresAt: expiresAt,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
