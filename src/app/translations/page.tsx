import {
  getPublicArticleSummaries,
  getPublicSeries,
  getPublicSiteConfig,
} from '@/lib/public-data';
import ArticleListClient from '@/components/ArticleListClient';
import type { Metadata } from 'next';
import TiltCard from '@/components/TiltCard';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Bài dịch' };

export default async function TranslationsPage({
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

  const standaloneArticles = allArticles.filter(a => a.type === 'translation' && !a.series);
  const seriesItems = allSeries.filter(s => s.type === 'translation');

  const items = [
    ...standaloneArticles.map(a => ({ ...a, isSeries: false as const })),
    ...seriesItems.map(s => ({ ...s, isSeries: true as const }))
  ];

  return (
    <>
      <div className="container">
        {/* Dynamic Category Navigator - Moved from homepage */}
        <section className="era-navigator" style={{ marginBottom: 'var(--space-10)' }}>
          {config.categories.slice(0, 4).map(cat => (
            <TiltCard key={cat}>
              <Link href={`/translations?category=${encodeURIComponent(cat)}`} className="era-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <span className="era-name">{cat}</span>
                <span className="era-period">Xem thêm</span>
              </Link>
            </TiltCard>
          ))}
        </section>
        <ArticleListClient
          items={items}
          categories={config.categories}
          initialCategory={category}
          initialSearch={search}
        />
      </div>
    </>
  );
}
