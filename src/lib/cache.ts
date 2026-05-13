import prisma from './prisma';
import type { Article, Series, SiteConfig } from './types';

/**
 * In-memory cache with updatedAt-based invalidation.
 * On each read, we check MAX(updatedAt) in the DB (a cheap index-only query).
 * If unchanged, we return the cached value; otherwise we refetch and update.
 */

interface CacheEntry<T> {
  data: T;
  lastUpdated: Date;
}

let slugsCache: CacheEntry<string[]> | null = null;
let summariesCache: CacheEntry<Article[]> | null = null;
let allSummariesCache: CacheEntry<Article[]> | null = null; // includes drafts (admin)
let seriesCache: CacheEntry<Series[]> | null = null;
let configCache: CacheEntry<SiteConfig> | null = null;

// ─── Invalidation checks ──────────────────────────────────────────────────────

async function getArticlesLastUpdated(): Promise<Date> {
  const result = await prisma.article.aggregate({ _max: { updatedAt: true } });
  return result._max.updatedAt ?? new Date(0);
}

async function getSeriesLastUpdated(): Promise<Date> {
  const result = await prisma.series.aggregate({ _max: { updatedAt: true } });
  return result._max.updatedAt ?? new Date(0);
}

function isFresh<T>(cache: CacheEntry<T> | null, lastUpdated: Date): cache is CacheEntry<T> {
  return cache !== null && cache.lastUpdated.getTime() >= lastUpdated.getTime();
}

// ─── Article slugs (for generateStaticParams) ─────────────────────────────────

export async function getCachedArticleSlugs(): Promise<string[]> {
  const lastUpdated = await getArticlesLastUpdated();
  if (isFresh(slugsCache, lastUpdated)) return slugsCache.data;

  const rows = await prisma.article.findMany({
    where: { status: 'published' },
    select: { slug: true },
  });
  const data = rows.map(r => r.slug);
  slugsCache = { data, lastUpdated };
  return data;
}

// ─── Article summaries (for listing pages) ────────────────────────────────────

const SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  category: true,
  type: true,
  tags: true,
  series: true,
  seriesOrder: true,
  date: true,
  featured: true,
  author: true,
  coverImage: true,
  status: true,
  readingTime: true,
} as const;

function rowToSummary(a: Record<string, unknown>): Article {
  return {
    id: a.id as string,
    slug: a.slug as string,
    title: a.title as string,
    subtitle: (a.subtitle as string) ?? '',
    excerpt: a.excerpt as string,
    category: (a.category as string) ?? undefined,
    type: ((a.type as string) ?? 'articles') as 'articles' | 'translation',
    tags: (a.tags as string[]) ?? [],
    series: (a.series as string) ?? null,
    seriesOrder: (a.seriesOrder as number) ?? null,
    date: a.date as string,
    featured: (a.featured as boolean) ?? false,
    author: a.author as string,
    coverImage: (a.coverImage as string) ?? null,
    status: a.status as 'draft' | 'published',
    readingTime: (a.readingTime as number) ?? 0,
  };
}

export async function getCachedArticleSummaries(): Promise<Article[]> {
  const lastUpdated = await getArticlesLastUpdated();
  if (isFresh(summariesCache, lastUpdated)) return summariesCache.data;

  const rows = await prisma.article.findMany({
    where: { status: 'published' },
    select: SUMMARY_SELECT,
    orderBy: { date: 'desc' },
  });
  const data = rows.map(rowToSummary);
  summariesCache = { data, lastUpdated };
  return data;
}

export async function getCachedArticleSummariesAdmin(): Promise<Article[]> {
  const lastUpdated = await getArticlesLastUpdated();
  if (isFresh(allSummariesCache, lastUpdated)) return allSummariesCache.data;

  const rows = await prisma.article.findMany({
    select: SUMMARY_SELECT,
    orderBy: { date: 'desc' },
  });
  const data = rows.map(rowToSummary);
  allSummariesCache = { data, lastUpdated };
  return data;
}

// ─── Series cache ─────────────────────────────────────────────────────────────

export async function getCachedSeries(): Promise<Series[]> {
  const lastUpdated = await getSeriesLastUpdated();
  if (isFresh(seriesCache, lastUpdated)) return seriesCache.data;

  const rows = await prisma.series.findMany();
  const data = rows.map(s => ({
    slug: s.slug,
    title: s.title,
    description: s.description,
    coverImage: s.coverImage ?? null,
    type: (s.type as 'articles' | 'translation') ?? 'articles',
    category: s.category ?? undefined,
    status: s.status as 'draft' | 'published',
    featured: s.featured ?? false,
  }));
  seriesCache = { data, lastUpdated };
  return data;
}

// ─── Site config cache ────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SiteConfig = {
  blogTitle: '',
  blogSubtitle: '',
  blogDescription: '',
  authorName: '',
  authorBio: '',
  authorEmail: '',
  authorAvatar: '',
  featuredArticleSlug: '',
  quoteBlock: { text: '', author: '' },
  suggestedReading: [],
  categories: [],
  donation: { text: '', qrImage: null },
};

export async function getCachedSiteConfig(): Promise<SiteConfig> {
  // SiteConfig has no updatedAt, use simple null check + invalidate on save
  if (configCache) return configCache.data;

  const row = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  const data = row ? (row.data as unknown as SiteConfig) : DEFAULT_CONFIG;
  configCache = { data, lastUpdated: new Date() };
  return data;
}

// ─── Cache invalidation (call after writes) ───────────────────────────────────

export function invalidateArticleCache() {
  slugsCache = null;
  summariesCache = null;
  allSummariesCache = null;
}

export function invalidateSeriesCache() {
  seriesCache = null;
}

export function invalidateConfigCache() {
  configCache = null;
}

// ─── Warm all caches (call at build time or server start) ─────────────────────

export async function warmCaches() {
  await Promise.all([
    getCachedArticleSlugs(),
    getCachedArticleSummaries(),
    getCachedSeries(),
    getCachedSiteConfig(),
  ]);
}
