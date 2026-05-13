import prisma from './prisma';
import type { Article, SiteConfig, Series } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToArticle(a: any): Article {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    subtitle: a.subtitle ?? '',
    excerpt: a.excerpt,
    content: a.content,
    category: a.category ?? undefined,
    type: (a.type as 'articles' | 'translation') ?? 'articles',
    tags: a.tags ?? [],
    series: a.series ?? null,
    seriesOrder: a.seriesOrder ?? null,
    date: a.date,
    featured: a.featured ?? false,
    author: a.author,
    coverImage: a.coverImage ?? null,
    status: a.status as 'draft' | 'published',
    readingTime: a.readingTime ?? 0,
    footnotes: a.footnotes ?? undefined,
    pages: a.pages ?? undefined,
    markdownPages: a.markdownPages ?? undefined,
  };
}

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

export async function getSiteConfig(): Promise<SiteConfig> {
  const row = await prisma.siteConfig.findUnique({ where: { id: 1 } });
  if (!row) return DEFAULT_CONFIG;
  return row.data as unknown as SiteConfig;
}

export async function saveSiteConfig(config: SiteConfig): Promise<void> {
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { data: config as any },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { id: 1, data: config as any },
  });
}

export async function getAllArticles(): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: { status: 'published' },
    orderBy: { date: 'desc' },
  });
  return rows.map(dbToArticle);
}

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const rows = await prisma.article.findMany({ orderBy: { date: 'desc' } });
  return rows.map(dbToArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const row = await prisma.article.findUnique({ where: { slug } });
  return row ? dbToArticle(row) : null;
}

export async function saveArticle(article: Article): Promise<void> {
  const data = {
    title: article.title,
    subtitle: article.subtitle ?? null,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category ?? null,
    type: article.type ?? 'articles',
    tags: article.tags ?? [],
    series: article.series ?? null,
    seriesOrder: article.seriesOrder ?? null,
    date: article.date,
    featured: article.featured ?? false,
    author: article.author,
    coverImage: article.coverImage ?? null,
    status: article.status ?? 'draft',
    readingTime: article.readingTime ?? 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    footnotes: article.footnotes ? (article.footnotes as any) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages: article.pages ? (article.pages as any) : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    markdownPages: article.markdownPages ? (article.markdownPages as any) : undefined,
  };
  await prisma.article.upsert({
    where: { slug: article.slug },
    update: data,
    create: { slug: article.slug, ...data },
  });
}

export async function deleteArticle(slug: string): Promise<void> {
  await prisma.article.delete({ where: { slug } }).catch(() => {});
}

export async function getCategories(): Promise<string[]> {
  const config = await getSiteConfig();
  return config.categories;
}

export function getRelatedArticles(current: Article, all: Article[], limit = 3): Article[] {
  return all
    .filter(
      (a) =>
        a.slug !== current.slug &&
        (a.category === current.category || a.tags.some((t) => current.tags.includes(t))),
    )
    .slice(0, limit);
}

export async function getArticlesBySeries(seriesName: string): Promise<Article[]> {
  const rows = await prisma.article.findMany({
    where: { series: seriesName, status: 'published' },
    orderBy: { seriesOrder: 'asc' },
  });
  return rows.map(dbToArticle);
}

export async function getAllSeries(): Promise<Series[]> {
  const rows = await prisma.series.findMany();
  return rows.map((s) => ({
    slug: s.slug,
    title: s.title,
    description: s.description,
    coverImage: s.coverImage ?? null,
    type: (s.type as 'articles' | 'translation') ?? 'articles',
    category: s.category ?? undefined,
    status: s.status as 'draft' | 'published',
    featured: s.featured ?? false,
  }));
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  const row = await prisma.series.findUnique({ where: { slug } });
  if (!row) return null;
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImage: row.coverImage ?? null,
    type: (row.type as 'articles' | 'translation') ?? 'articles',
    category: row.category ?? undefined,
    status: row.status as 'draft' | 'published',
    featured: row.featured ?? false,
  };
}

export async function saveSeries(series: Series): Promise<void> {
  const data = {
    title: series.title,
    description: series.description,
    coverImage: series.coverImage ?? null,
    type: series.type ?? 'articles',
    category: series.category ?? null,
    status: series.status ?? 'draft',
    featured: series.featured ?? false,
  };
  await prisma.series.upsert({
    where: { slug: series.slug },
    update: data,
    create: { slug: series.slug, ...data },
  });
}

export async function deleteSeries(slug: string): Promise<void> {
  await prisma.series.delete({ where: { slug } }).catch(() => {});
}
