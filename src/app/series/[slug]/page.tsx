import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSeriesBySlug, getArticlesBySeries, getSiteConfig } from '@/lib/data';
import { formatDate } from '@/lib/utils';
import TiltCard from '@/components/TiltCard';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) return { title: 'Không tìm thấy series' };
  return {
    title: `${series.title} - Series`,
    description: series.description,
  };
}

export default async function SeriesLandingPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  const series = getSeriesBySlug(slug);
  if (!series) notFound();

  const articles = getArticlesBySeries(series.title);
  const config = getSiteConfig();

  return (
    <div className="container" style={{ marginTop: 'var(--space-10)', marginBottom: 'var(--space-10)' }}>
      <header className="series-header admin-card" style={{ padding: 'var(--space-8)', marginBottom: 'var(--space-10)', textAlign: 'center' }}>
        {series.coverImage && (
          <div className="article-cover-container" style={{ marginBottom: 'var(--space-6)', background: 'var(--parchment, #f5f0e8)', boxShadow: 'none', border: '1px solid var(--border-light)' }}>
            <img 
              src={series.coverImage} 
              alt={series.title} 
              className="article-cover-full"
            />
          </div>
        )}
        <span className="featured-badge" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
          Series {series.type === 'translation' ? 'Dịch' : 'Viết'}
        </span>
        <h1 style={{ fontSize: '3rem', fontFamily: 'var(--font-serif)', color: 'var(--gold)', marginBottom: 'var(--space-4)' }}>{series.title}</h1>
        <div 
          className="series-description" 
          style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.1rem', color: 'var(--ink)', lineHeight: '1.8' }}
          dangerouslySetInnerHTML={{ __html: series.description.replace(/\n/g, '<br/>') }}
        />
      </header>

      <section style={{ background: '#fff', borderRadius: 'var(--radius)', padding: 'var(--space-6) var(--space-8)' }}>
        <p className="section-label">Danh sách các phần ({articles.length})</p>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {articles.map((article, index) => (
            <li key={article.slug} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--ink-muted)', minWidth: '1.8em', textAlign: 'right', flexShrink: 0 }}>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1 }}>
                <Link href={`/articles/${article.slug}`} style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', color: 'var(--ink)', textDecoration: 'none', lineHeight: 1.4, display: 'block' }}>
                  {article.title}
                </Link>
                {article.subtitle && (
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--ink-muted)', display: 'block', marginTop: '2px' }}>{article.subtitle}</span>
                )}
              </div>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--ink-muted)', flexShrink: 0 }}>{article.readingTime} phút</span>
            </li>
          ))}
        </ol>
      </section>

      <div style={{ marginTop: 'var(--space-16)', paddingTop: 'var(--space-8)', borderTop: '1px solid var(--border-light)', textAlign: 'center', clear: 'both' }}>
        <Link href="/" className="btn-secondary" style={{ display: 'inline-block', padding: '12px 32px' }}>← Trở về trang chủ</Link>
      </div>
    </div>
  );
}
