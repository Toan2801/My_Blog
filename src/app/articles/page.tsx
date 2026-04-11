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
    <>

      <div className="container" style={{ marginTop: 'var(--space-8)' }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <h1 className="page-title" style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}>Bài viết</h1>
          <div style={{ width: '40px', height: '2px', background: 'var(--gold)', margin: '16px auto' }} />
        </div>
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
