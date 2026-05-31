import { getAllArticles, getAllSeries, getSiteConfig } from '@/lib/data';
import ArticleListClient from '@/components/ArticleListClient';
import Breadcrumb from '@/components/Breadcrumb';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bài dịch' };

export default async function TranslationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const allArticles = getAllArticles();
  const allSeries = getAllSeries();
  const config = getSiteConfig();

  const articles = allArticles.filter(a => a.type === 'translation');
  const seriesItems = allSeries.filter(s => s.type === 'translation');

  const items = [
    ...articles.map(a => ({ ...a, isSeries: false as const })),
    ...seriesItems.map(s => ({ ...s, isSeries: true as const }))
  ];

  return (
    <div className="container">
      <Breadcrumb items={[{ label: 'Bài dịch' }]} />
      
      <div className="articles-layout-wrapper">
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
