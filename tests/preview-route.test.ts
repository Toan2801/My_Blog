import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data layer used by the preview route.
vi.mock('@/lib/data', () => ({
  getArticleBySlug: vi.fn(),
}));

vi.mock('@/lib/raster-data', () => ({
  readRasterizedArticleData: vi.fn(),
}));

import { GET as previewGET } from '@/app/api/articles/[slug]/preview/route';
import * as data from '@/lib/data';
import * as rasterData from '@/lib/raster-data';
import { verifyReaderToken, tokenAllowsPage, TRIAL_MAX_PAGES } from '@/lib/reader-token';

function makeRequest(host = 'localhost:3000') {
  return new Request(`http://${host}/api/articles/foo/preview`, {
    headers: { host, origin: `http://${host}`, referer: `http://${host}/articles/foo` },
  }) as unknown as import('next/server').NextRequest;
}

describe('GET /api/articles/[slug]/preview', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns first 5 pages + trial token capped at TRIAL_MAX_PAGES', async () => {
    const allPages = Array.from({ length: 80 }, (_, i) => ({
      pageNumber: i + 1,
      imageUrl: `/api/articles/foo/page/${i + 1}/image`,
    }));
    (data.getArticleBySlug as ReturnType<typeof vi.fn>).mockReturnValue({
      slug: 'foo',
      title: 'T',
      author: 'A',
      status: 'published',
    });
    (rasterData.readRasterizedArticleData as ReturnType<typeof vi.fn>).mockReturnValue({
      pages: allPages,
      markdownPages: [],
    });

    const res = await previewGET(makeRequest(), { params: Promise.resolve({ slug: 'foo' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isTrial).toBe(true);
    expect(body.totalPages).toBe(80);
    expect(body.pages.length).toBe(TRIAL_MAX_PAGES);

    const info = verifyReaderToken('foo', body.token);
    expect(info?.kind).toBe('trial');
    expect(tokenAllowsPage(info!, TRIAL_MAX_PAGES)).toBe(true);
    expect(tokenAllowsPage(info!, TRIAL_MAX_PAGES + 1)).toBe(false);
  });

  it('404 for unknown slug', async () => {
    (data.getArticleBySlug as ReturnType<typeof vi.fn>).mockReturnValue(null);
    (rasterData.readRasterizedArticleData as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const res = await previewGET(makeRequest(), { params: Promise.resolve({ slug: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('404 for drafts', async () => {
    (data.getArticleBySlug as ReturnType<typeof vi.fn>).mockReturnValue({
      slug: 'foo', status: 'draft',
    });
    (rasterData.readRasterizedArticleData as ReturnType<typeof vi.fn>).mockReturnValue({
      pages: [],
      markdownPages: [],
    });
    const res = await previewGET(makeRequest(), { params: Promise.resolve({ slug: 'foo' }) });
    expect(res.status).toBe(404);
  });
});
