import { getAllArticles, getSiteConfig } from '@/lib/data';
import ArticleListClient from '@/components/ArticleListClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bài viết' };

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  const articles = getAllArticles();
  const config = getSiteConfig();

  return (
    <>
      <div className="container" style={{ marginTop: 'var(--space-6)' }}>
      <ArticleListClient
        articles={articles}
        categories={config.categories}
        initialCategory={category}
        initialSearch={search}
      />
      </div>
    </>
  );
}
