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
      {/* Hero Header - Matching Homepage */}
      <section className="hero">
        {config.heroImage && (
          <div className="hero-bg">
            <img src={config.heroImage} alt="Background" />
            <div className="hero-overlay" />
          </div>
        )}
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <h1 className="hero-title">{config.blogTitle}</h1>
          <div className="hero-divider" />
          <p className="hero-description" style={{ textShadow: '0 1px 1px rgba(255,255,255,0.8)' }}>
            {config.blogDescription}
          </p>
        </div>
      </section>

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
