import { getAllArticlesMeta, getAllSeries, getSiteConfig } from '@/lib/data';
import ArticleListFromUrl from '@/components/ArticleListFromUrl';
import { Suspense } from 'react';
import Breadcrumb from '@/components/Breadcrumb';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bài dịch' };

export default function TranslationsPage() {
  const allArticles = getAllArticlesMeta();
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
        <Suspense fallback={<p>Đang tải danh sách...</p>}>
        <ArticleListFromUrl
          items={items}
          categories={config.categories}
        />
        </Suspense>
      </div>
    </div>
  );
}
