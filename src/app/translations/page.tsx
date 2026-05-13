import { getAllArticles, getAllSeries, getSiteConfig } from '@/lib/data';
import ArticleListClient from '@/components/ArticleListClient';
import Breadcrumb from '@/components/Breadcrumb';
import type { Metadata } from 'next';
import Link from 'next/link';

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

  const standaloneArticles = allArticles.filter(a => a.type === 'translation' && !a.series);
  const seriesItems = allSeries.filter(s => s.type === 'translation');

  const items = [
    ...standaloneArticles.map(a => ({ ...a, isSeries: false as const })),
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
