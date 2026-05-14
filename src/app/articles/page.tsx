import {
  getPublicArticleSummaries,
  getPublicSeries,
  getPublicSiteConfig,
} from '@/lib/public-data';
import ArticleListClient from '@/components/ArticleListClient';
import CategorySidebar from '@/components/CategorySidebar';
import Breadcrumb from '@/components/Breadcrumb';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bài viết' };

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const [allArticles, allSeries, config] = await Promise.all([
    getPublicArticleSummaries(),
    getPublicSeries(),
    getPublicSiteConfig(),
  ]);

  const standaloneArticles = allArticles.filter(a => a.type === 'articles' && !a.series);
  const seriesItems = allSeries.filter(s => s.type === 'articles');

  const items = [
    ...standaloneArticles.map(a => ({ ...a, isSeries: false as const })),
    ...seriesItems.map(s => ({ ...s, isSeries: true as const }))
  ];

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Bài viết' }]} />
      <div className="articles-with-sidebar">
        <CategorySidebar categories={config.categories} activeCategory={category} />
        <ArticleListClient
          items={items}
          categories={config.categories}
          initialCategory={category}
          initialSearch={search}
        />
      </div>
    </div>
  );
}
