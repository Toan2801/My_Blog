import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug } from '@/lib/data';
import { auth } from '@/auth';
import { issueUserReaderToken } from '@/lib/reader-token';
import { renderArticleMarkdown } from '@/lib/markdown';
import { paginateHTML } from '@/lib/paginate';

const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 50;
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
  const { slug } = await params;
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

  const article = getArticleBySlug(slug);
  if (!article || article.status !== 'published') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Vui lòng đăng nhập để đọc sách.' },
      { status: 401 },
    );
  }

  const { token, expiresAt } = issueUserReaderToken(session.user.id, slug);

  let finalPages: any[] = [];

  // If article has pre-rendered pages, use them (might have html already if updated)
  if (article.pages && article.pages.length > 0) {
    finalPages = article.pages.map((p) => ({
      pageNumber: p.pageNumber,
      imageUrl: p.imageUrl,
      html: p.html,
    }));
  } else {
    // Fallback: Generate HTML pages dynamically from content
    const htmlContent = renderArticleMarkdown(article.content);
    const { pages } = paginateHTML(htmlContent, 850); // Slightly higher word count for dynamic

    // Basic structure: Cover, Blank, TOC, Pages..., Blank, Back
    finalPages = [
      {
        pageNumber: 1,
        html: `<div class="cover-page"><h1 class="cover-title">${article.title}</h1><p class="cover-author">${article.author}</p></div>`,
      },
      { pageNumber: 2, html: '<div class="blank-page"></div>' },
      {
        pageNumber: 3,
        html: `<div class="page--toc"><h2 class="toc-title">Mục lục</h2><div style="text-align:center;color:#6C6C73;margin-top:2rem">Nội dung bài viết bắt đầu từ trang tiếp theo.</div></div>`,
      },
      ...pages.map((html, i) => ({
        pageNumber: i + 4,
        html: `<div class="page">${html}</div>`,
      })),
    ];

    // Ensure even pages and blank before back cover
    if (finalPages.length % 2 === 0) {
      finalPages.push({ pageNumber: finalPages.length + 1, html: '<div class="blank-page"></div>' });
    }
    finalPages.push({
      pageNumber: finalPages.length + 1,
      html: `<div class="back-page"><h2 class="back-title">${article.title}</h2><p class="back-text">Bảo lưu mọi bản quyền tác giả.</p></div>`,
    });
  }

  return NextResponse.json(
    {
      pages: finalPages,
      totalPages: finalPages.length,
      title: article.title,
      author: article.author,
      token,
      tokenExpiresAt: expiresAt,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
